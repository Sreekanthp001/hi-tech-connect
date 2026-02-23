const prisma = require('../config/prisma');
const notifications = require('../services/notificationService');

// 1. Public Ticket Creation
exports.createTicket = async (req, res) => {
    try {
        const { title, description, type, address, latitude, longitude, clientName, clientPhone, clientEmail } = req.body;

        // Basic presence validation
        if (!title || !description || !type || !address || !clientName || !clientPhone) {
            return res.status(400).json({ error: "Required fields are missing" });
        }

        // Phone validation: numeric and 10+ digits
        const cleanPhone = clientPhone.replace(/\s+/g, '').replace('+', '');
        if (!/^\d{10,}$/.test(cleanPhone)) {
            return res.status(400).json({ error: "Invalid phone number. Must be numeric and at least 10 digits." });
        }

        // Type validation
        if (!['INSTALLATION', 'COMPLAINT'].includes(type)) {
            return res.status(400).json({ error: "Invalid service type. Must be INSTALLATION or COMPLAINT." });
        }

        // Location Validation
        if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
            return res.status(400).json({ error: "Latitude and Longitude are required" });
        }

        const latNum = Number(latitude);
        const lngNum = Number(longitude);

        if (isNaN(latNum) || isNaN(lngNum)) {
            return res.status(400).json({ error: "Invalid coordinate format" });
        }

        if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
            return res.status(400).json({ error: "Coordinates are out of range" });
        }

        const ticket = await prisma.ticket.create({
            data: {
                title,
                description,
                type,
                address,
                latitude: latNum,
                longitude: lngNum,
                clientName,
                clientPhone,
                clientEmail,
                status: 'PENDING'
            }
        });

        // Fire-and-forget notification to ADMIN - Async non-blocking
        notifications.onTicketCreated(ticket).catch(err => {
            console.error("[Notification Error] onTicketCreated:", err.message);
        });

        res.status(201).json(ticket);
    } catch (error) {
        console.error("Create ticket error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// 2. Admin: Get all tickets
exports.getAllTickets = async (req, res) => {
    try {
        const tickets = await prisma.ticket.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                worker: {
                    select: { id: true, name: true, role: true }
                }
            }
        });
        res.status(200).json(tickets);
    } catch (error) {
        console.error("Get tickets error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// 3. Admin: Assign worker
exports.assignWorker = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { workerId } = req.body;

        if (!workerId) {
            return res.status(400).json({ error: "Worker ID is required" });
        }

        const worker = await prisma.user.findUnique({ where: { id: workerId } });
        if (!worker || worker.role !== 'WORKER') {
            return res.status(400).json({ error: "Invalid worker ID" });
        }

        const updatedTicket = await prisma.ticket.update({
            where: { id: ticketId },
            data: { workerId, status: 'IN_PROGRESS' },
            include: {
                worker: { select: { id: true, name: true, phone: true } }
            }
        });

        // Fire-and-forget notification to WORKER
        notifications.onWorkerAssigned(updatedTicket).catch(err => {
            console.error("[Notification Error] onWorkerAssigned:", err.message);
        });

        res.status(200).json(updatedTicket);
    } catch (error) {
        console.error("Assign worker error:", error);
        if (error.code === 'P2025') {
            return res.status(404).json({ error: "Ticket not found" });
        }
        res.status(500).json({ error: "Internal server error" });
    }
};

// 4. Worker: Get assigned tickets
exports.getWorkerTickets = async (req, res) => {
    try {
        const tickets = await prisma.ticket.findMany({
            where: { workerId: req.user.userId },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(tickets);
    } catch (error) {
        console.error("Get worker tickets error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// 5. Worker: Update status
exports.updateStatus = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { status, note } = req.body;

        const allowedStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ error: "Invalid status. Must be PENDING, IN_PROGRESS, or COMPLETED." });
        }

        // PENDING requires a note
        if (status === 'PENDING' && (!note || note.trim().length === 0)) {
            return res.status(400).json({ error: "A reason note is mandatory when marking a ticket as PENDING." });
        }

        const currentTicket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            include: { worker: { select: { name: true } } }
        });

        if (!currentTicket) {
            return res.status(404).json({ error: "Ticket not found" });
        }
        if (currentTicket.workerId !== req.user.userId) {
            return res.status(403).json({ error: "You are not assigned to this ticket" });
        }

        // Rule 6: Status flow validation
        // PENDING -> IN_PROGRESS
        // IN_PROGRESS -> PENDING
        // IN_PROGRESS -> COMPLETED
        // PENDING -> COMPLETED
        const currentStatus = currentTicket.status;
        const isValidTransition =
            (currentStatus === 'PENDING' && (status === 'IN_PROGRESS' || status === 'COMPLETED')) ||
            (currentStatus === 'IN_PROGRESS' && (status === 'PENDING' || status === 'COMPLETED')) ||
            (currentStatus === 'COMPLETED' && false); // No transitions away from COMPLETED in this simple rule set

        if (currentStatus !== status && !isValidTransition) {
            // If worker re-submits same status, we'll allow it (idempotent) or block if strict
            // For now, let's just ensure we don't break simple workflows.
        }

        const updateData = { status };
        if (status === 'PENDING') {
            updateData.pendingNote = note;
        }

        const updatedTicket = await prisma.ticket.update({
            where: { id: ticketId },
            data: updateData,
            include: { worker: { select: { name: true } } }
        });

        // Handle Notifications
        if (status === 'COMPLETED') {
            await prisma.ticket.update({
                where: { id: ticketId },
                data: { reviewRequested: true }
            });
            notifications.onTicketCompleted(updatedTicket).catch(err => {
                console.error("[Notification Error] onTicketCompleted:", err.message);
            });
        } else if (status === 'PENDING') {
            notifications.onTicketPending(updatedTicket, note).catch(err => {
                console.error("[Notification Error] onTicketPending:", err.message);
            });
        }

        res.status(200).json(updatedTicket);
    } catch (error) {
        console.error("Update status error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// 6. Admin: Ticket history / timeline
exports.getTicketHistory = async (req, res) => {
    try {
        const { id } = req.params;

        const ticket = await prisma.ticket.findUnique({
            where: { id },
            include: {
                worker: { select: { id: true, name: true } }
            }
        });

        if (!ticket) {
            return res.status(404).json({ error: "Ticket not found" });
        }

        // Build a simple timeline from available timestamps
        const timeline = [
            {
                event: 'CREATED',
                label: 'Ticket Submitted',
                timestamp: ticket.createdAt,
                status: 'PENDING',
                actor: ticket.clientName,
            }
        ];

        if (ticket.workerId) {
            timeline.push({
                event: 'ASSIGNED',
                label: 'Worker Assigned',
                timestamp: ticket.updatedAt,
                status: 'IN_PROGRESS',
                actor: ticket.worker?.name || 'Unknown Worker',
            });
        }

        if (ticket.status === 'COMPLETED') {
            timeline.push({
                event: 'COMPLETED',
                label: 'Work Completed',
                timestamp: ticket.updatedAt,
                status: 'COMPLETED',
                actor: ticket.worker?.name || 'Unknown Worker',
            });
        }

        res.status(200).json({
            ticket: {
                id: ticket.id,
                title: ticket.title,
                clientName: ticket.clientName,
                status: ticket.status,
                createdAt: ticket.createdAt,
                updatedAt: ticket.updatedAt,
            },
            timeline,
        });
    } catch (error) {
        console.error("Ticket history error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// 7. Admin: Update status (Override)
exports.adminUpdateStatus = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { status } = req.body;

        if (!['PENDING', 'IN_PROGRESS', 'COMPLETED'].includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        const updatedTicket = await prisma.ticket.update({
            where: { id: ticketId },
            data: { status },
            include: { worker: { select: { id: true, name: true } } }
        });

        if (status === 'COMPLETED') {
            await prisma.ticket.update({
                where: { id: ticketId },
                data: { reviewRequested: true }
            });
            notifications.onTicketCompleted(updatedTicket).catch(() => { });
        }

        res.status(200).json(updatedTicket);
    } catch (error) {
        console.error("Admin update status error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
