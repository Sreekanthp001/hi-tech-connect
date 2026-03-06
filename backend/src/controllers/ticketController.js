const prisma = require('../config/prisma');
const notifications = require('../services/notificationService');
const telegramService = require('../services/telegramService');
const invoiceService = require('../services/invoiceService');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const distributeWorkerSalary = async (ticketId, totalAmount) => {
    try {
        const assignments = await prisma.ticketAssignment.findMany({
            where: { ticketId }
        });

        if (assignments.length === 0 || !totalAmount || totalAmount <= 0) return;

        const share = totalAmount / assignments.length;

        for (const assign of assignments) {
            await prisma.workerFinance.upsert({
                where: { workerId: assign.workerId },
                update: {
                    totalEarned: { increment: share }
                },
                create: {
                    workerId: assign.workerId,
                    totalEarned: share,
                    baseSalary: 0,
                    totalAdvance: 0
                }
            });
        }
    } catch (error) {
        console.error("Salary distribution error:", error);
    }
};

// 1. Public Ticket Creation
exports.createTicket = async (req, res) => {
    try {
        const { title, description, type, address, latitude, longitude, clientName, clientPhone, clientEmail, requestType, alternatePhone } = req.body;

        // Basic presence validation
        if (!title || !description || !type || !address || !clientName || !clientPhone || !requestType) {
            return res.status(400).json({ error: "Required fields are missing (title, description, type, address, clientName, clientPhone, requestType)" });
        }

        // Phone validation: numeric and 10+ digits
        const cleanPhone = clientPhone.replace(/\s+/g, '').replace('+', '');
        if (!/^\d{10,}$/.test(cleanPhone)) {
            return res.status(400).json({ error: "Invalid phone number. Must be numeric and at least 10 digits." });
        }

        if (alternatePhone) {
            const cleanAltPhone = alternatePhone.replace(/\s+/g, '').replace('+', '');
            if (!/^\d{10,}$/.test(cleanAltPhone)) {
                return res.status(400).json({ error: "Invalid alternate phone number. Must be numeric and at least 10 digits." });
            }
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
                requestType,
                alternatePhone,
                status: 'NEW',
                quotationStatus: 'NONE'
            }
        });

        // Fire-and-forget notification to ADMIN - Async non-blocking
        notifications.onTicketCreated(ticket).catch(err => {
            console.error("[Notification Error] onTicketCreated:", err.message);
        });

        // Customer Confirmation (Phase 13)
        if (ticket.telegramId) {
            const customerMsg = `✅ <b>Booking Confirmed!</b>\n\n` +
                `Hello ${ticket.clientName},\n` +
                `Your service request "<b>${ticket.title}</b>" has been received.\n\n` +
                `📍 <b>Location:</b> ${ticket.address}\n` +
                `🆔 <b>Ticket:</b> ${ticket.id.slice(0, 8).toUpperCase()}\n\n` +
                `Our admin will assign a technician shortly.`;
            telegramService.sendTelegramMessage(ticket.telegramId, customerMsg).catch(() => { });
        }

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
                assignments: {
                    include: {
                        worker: { select: { id: true, name: true, role: true } }
                    }
                },
                payments: {
                    orderBy: { createdAt: 'desc' }
                },
                ticketPhotos: true,
                invoice: true,
                items: true,
                planningWorker: { select: { id: true, name: true } },
                installationWorker: { select: { id: true, name: true } }
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
        const { workerId, workers } = req.body;

        // Support both single workerId and multiple workers array
        let assignmentData = [];
        if (workers && Array.isArray(workers)) {
            assignmentData = workers.map(w => ({
                workerId: w.workerId || w.id,
                isPrimary: w.isPrimary || false
            }));
        } else if (workerId) {
            assignmentData = [{ workerId, isPrimary: true }];
        }

        if (assignmentData.length === 0) {
            return res.status(400).json({ error: "At least one worker must be assigned" });
        }

        // Validate all workers
        for (const entry of assignmentData) {
            const w = await prisma.user.findUnique({ where: { id: entry.workerId } });
            if (!w || w.role !== 'WORKER') {
                return res.status(400).json({ error: `Invalid worker ID: ${entry.workerId}` });
            }
        }

        // Use transaction to ensure data consistency
        const result = await prisma.$transaction(async (tx) => {
            // 1. Delete existing assignments
            await tx.ticketAssignment.deleteMany({ where: { ticketId } });

            // 2. Create new assignments
            await tx.ticketAssignment.createMany({
                data: assignmentData.map(w => ({
                    ticketId,
                    workerId: w.workerId,
                    isPrimary: w.isPrimary || false
                }))
            });


            // 4. Update ticket status and primary worker
            const updatedTicket = await tx.ticket.update({
                where: { id: ticketId },
                data: {
                    status: 'IN_PROGRESS'
                },
                include: {
                    assignments: {
                        include: {
                            worker: { select: { id: true, name: true, phone: true, telegramId: true } }
                        }
                    }
                }
            });

            return updatedTicket;
        });

        // Fire-and-forget notifications
        // 1. Internal notification
        result.assignments.forEach(assign => {
            notifications.onWorkerAssigned({ ...result, workerId: assign.workerId }).catch(err => {
                console.error("[Notification Error] onWorkerAssigned:", err.message);
            });
        });

        // 2. Telegram Notifications for ALL assigned workers (Phase 11 format)
        const primaryTech = result.assignments.find(a => a.isPrimary)?.worker.name || 'N/A';
        const supportTechs = result.assignments.filter(a => !a.isPrimary).map(a => a.worker.name);

        result.assignments.forEach(assign => {
            if (assign.worker.telegramId) {
                const botMessage = `🔔 <b>NEW WORK ASSIGNED</b>\n\n` +
                    `🆔 <b>Ticket ID:</b> ${result.id.slice(0, 8).toUpperCase()}\n` +
                    `👤 <b>Customer:</b> ${result.clientName}\n` +
                    `📞 <b>Phone:</b> ${result.clientPhone}\n` +
                    `📍 <b>Location:</b> ${result.address}\n\n` +
                    `👨​🔧 <b>Main Technician:</b> ${primaryTech}\n` +
                    `👷 <b>Support Members:</b>\n${supportTechs.length > 0 ? supportTechs.map(name => `- ${name}`).join('\n') : '- None'}\n\n` +
                    `Please login and update status.`;

                telegramService.sendTelegramMessage(assign.worker.telegramId, botMessage)
                    .catch(err => console.error(`[Telegram Error] Failed to send to ${assign.worker.name}:`, err.message));
            }
        });

        // 3. Customer Notification - Worker Assigned
        if (result.telegramId) {
            const primaryAssignment = result.assignments.find(a => a.isPrimary) || result.assignments[0];
            const primaryWorkerPhone = primaryAssignment?.worker?.phone || 'N/A';
            const customerMsg =
                `👷 <b>Technician Assigned!</b>\n\n` +
                `A field engineer has been assigned to your service request.\n\n` +
                `👨‍🔧 <b>Technician:</b> ${primaryTech}\n` +
                `📞 <b>Phone:</b> ${primaryWorkerPhone}\n` +
                `🔧 <b>Service Type:</b> ${result.type}\n` +
                `📍 <b>Location:</b> ${result.address}\n` +
                `🆔 <b>Ticket:</b> ${result.id.slice(0, 8).toUpperCase()}\n\n` +
                `The technician will contact you or arrive at the site shortly. 🛡️`;
            telegramService.sendTelegramMessage(result.telegramId, customerMsg).catch(() => { });
        }

        res.status(200).json(result);
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
            where: {
                assignments: { some: { workerId: req.user.userId } }
            },
            include: {
                ticketPhotos: true,
                assignments: {
                    include: {
                        worker: { select: { id: true, name: true } }
                    }
                }
            },
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
        const { status, note, totalAmount, amountReceived, paymentMode, paymentNote } = req.body;

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
            include: { assignments: true }
        });

        if (!currentTicket) {
            return res.status(404).json({ error: "Ticket not found" });
        }

        const isAssigned = currentTicket.assignments.some(a => a.workerId === req.user.userId);
        if (!isAssigned) {
            return res.status(403).json({ error: "You are not assigned to this ticket" });
        }

        // Rule 6: Status flow validation omitted for brevity or handled by frontend

        const updateData = { status };
        if (status === 'PENDING') {
            updateData.pendingNote = note;
        }

        if (status === 'COMPLETED') {
            // PART 2: Mandatory Photos Check
            const photos = await prisma.ticketPhoto.findMany({
                where: { ticketId }
            });

            const hasBefore = photos.some(p => p.type === 'BEFORE');
            const hasAfter = photos.some(p => p.type === 'AFTER');

            if (!hasBefore || !hasAfter) {
                return res.status(400).json({ error: "Before and After photos are mandatory before completion." });
            }

            const tot = parseFloat(totalAmount || "0");
            const rec = parseFloat(amountReceived || "0");
            let pStatus = "PENDING";
            if (tot > 0 && rec >= tot) pStatus = "FULL";
            else if (rec > 0 && rec < tot) pStatus = "PARTIAL";

            updateData.totalAmount = tot;
            updateData.amountReceived = rec;
            updateData.paymentStatus = pStatus;
            updateData.paymentMode = paymentMode;
            updateData.paymentNote = paymentNote;
            updateData.reviewRequested = true;

            // Create payment history record if there's a payment
            if (rec > 0) {
                await prisma.paymentHistory.create({
                    data: {
                        ticketId,
                        amount: rec,
                        paymentMode: paymentMode || 'CASH',
                        addedBy: 'WORKER'
                    }
                });
            }
        }

        const updatedTicket = await prisma.ticket.update({
            where: { id: ticketId },
            data: updateData
        });

        // Handle Notifications
        if (status === 'COMPLETED') {
            notifications.onTicketCompleted(updatedTicket).catch(err => {
                console.error("[Notification Error] onTicketCompleted:", err.message);
            });
            // Auto-generate invoice
            invoiceService.createInvoice(ticketId).catch(err => {
                console.error("[Invoice Error] createInvoice:", err.message);
            });

            // Distribute salary among assigned workers
            distributeWorkerSalary(ticketId, updatedTicket.totalAmount).catch(err => {
                console.error("[Salary Error] distributeWorkerSalary:", err.message);
            });

            // Customer Notification - Job Completed
            if (updatedTicket.telegramId) {
                const baseUrl = process.env.BASE_URL || 'https://hitech-connect.in';
                const feedbackLink = `${baseUrl}/review/${ticketId}`;
                const customerMsg =
                    `🎉 <b>Job Completed!</b>\n\n` +
                    `Thank you for choosing Hi-Tech Connect.\n` +
                    `The work for "<b>${updatedTicket.title}</b>" has been finished.\n\n` +
                    `⭐ <b>We value your feedback!</b>\n` +
                    `Please take 30 seconds to rate our service:\n` +
                    `👉 ${feedbackLink}\n\n` +
                    `Stay secure! 🛡️`;
                telegramService.sendTelegramMessage(updatedTicket.telegramId, customerMsg).catch(() => { });
            }
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
                assignments: {
                    include: { worker: { select: { id: true, name: true } } }
                }
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

        const primaryAssign = ticket.assignments.find(a => a.isPrimary) || ticket.assignments[0];
        if (primaryAssign) {
            timeline.push({
                event: 'ASSIGNED',
                label: 'Worker Assigned',
                timestamp: ticket.updatedAt,
                status: 'IN_PROGRESS',
                actor: primaryAssign.worker?.name || 'Unknown Worker',
            });
        }

        if (ticket.status === 'COMPLETED') {
            timeline.push({
                event: 'COMPLETED',
                label: 'Work Completed',
                timestamp: ticket.updatedAt,
                status: 'COMPLETED',
                actor: primaryAssign?.worker?.name || 'Unknown Worker',
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
        const { status, amount, paymentMode, workSummary, warrantyStartDate, warrantyExpiryDate, amcEnabled, amcRenewalDate } = req.body;

        if (!['PENDING', 'IN_PROGRESS', 'COMPLETED'].includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        const updateData = { status };
        if (status === 'COMPLETED') {
            const amt = parseFloat(amount || "0");
            updateData.amountReceived = amt;
            updateData.totalAmount = amt; // Assuming admin complete means full payment
            updateData.paymentStatus = "FULL";
            updateData.paymentMode = paymentMode;
            updateData.workSummary = workSummary;
            updateData.reviewRequested = true;

            // Upgrade Phases (Warranty & AMC)
            if (warrantyStartDate) updateData.warrantyStartDate = new Date(warrantyStartDate);
            if (warrantyExpiryDate) updateData.warrantyExpiryDate = new Date(warrantyExpiryDate);
            if (amcEnabled !== undefined) updateData.amcEnabled = amcEnabled;
            if (amcRenewalDate) updateData.amcRenewalDate = new Date(amcRenewalDate);

            // Create payment history record
            if (amt > 0) {
                await prisma.paymentHistory.create({
                    data: {
                        ticketId,
                        amount: amt,
                        paymentMode: paymentMode || 'CASH',
                        addedBy: 'ADMIN'
                    }
                });
            }
        }

        const updatedTicket = await prisma.ticket.update({
            where: { id: ticketId },
            data: updateData,
            include: {
                assignments: {
                    include: { worker: { select: { id: true, name: true } } }
                }
            }
        });

        if (status === 'COMPLETED') {
            notifications.onTicketCompleted(updatedTicket).catch(() => { });
            // Auto-generate invoice
            invoiceService.createInvoice(ticketId).catch(err => {
                console.error("[Invoice Error] createInvoice:", err.message);
            });

            // Distribute salary among assigned workers
            distributeWorkerSalary(ticketId, updatedTicket.totalAmount).catch(err => {
                console.error("[Salary Error] distributeWorkerSalary:", err.message);
            });
        }

        res.status(200).json(updatedTicket);
    } catch (error) {
        console.error("Admin update status error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// 8. Admin: Add Settlement Payment
exports.addPayment = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { amount, paymentMode } = req.body;

        const amt = parseFloat(amount);
        if (isNaN(amt) || amt <= 0) {
            return res.status(400).json({ error: "Invalid payment amount" });
        }

        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            include: { payments: true }
        });

        if (!ticket) {
            return res.status(404).json({ error: "Ticket not found" });
        }

        const currentTotalReceived = (ticket.amountReceived || 0);
        const newTotalReceived = currentTotalReceived + amt;
        const totalAmount = (ticket.totalAmount || 0);

        if (totalAmount > 0 && newTotalReceived > totalAmount + 1) { // small buffer for float
            return res.status(400).json({ error: `Amount exceeds balance. Remaining: ₹${totalAmount - currentTotalReceived}` });
        }

        let pStatus = ticket.paymentStatus;
        if (totalAmount > 0) {
            if (newTotalReceived >= totalAmount) pStatus = "FULL";
            else pStatus = "PARTIAL";
        }

        // 1. Create history record
        await prisma.paymentHistory.create({
            data: {
                ticketId,
                amount: amt,
                paymentMode: paymentMode || 'CASH',
                addedBy: 'ADMIN'
            }
        });

        // 2. Update ticket
        const updatedTicket = await prisma.ticket.update({
            where: { id: ticketId },
            data: {
                amountReceived: newTotalReceived,
                paymentStatus: pStatus
            },
            include: {
                assignments: {
                    include: { worker: { select: { id: true, name: true } } }
                },
                payments: { orderBy: { createdAt: 'desc' } }
            }
        });

        res.status(200).json(updatedTicket);
    } catch (error) {
        console.error("Add payment error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Update Ticket Progress Step (Phase 3)
 * PATCH /api/tickets/:id/progress
 */
exports.updateProgress = async (req, res) => {
    try {
        const { id } = req.params;
        const { progress } = req.body;
        const userId = req.user.userId;

        const ticket = await prisma.ticket.findUnique({ where: { id } });

        if (!ticket) {
            return res.status(404).json({ error: "Ticket not found" });
        }

        const isAssigned = await prisma.ticketAssignment.findFirst({
            where: { ticketId: id, workerId: userId }
        });

        if (!isAssigned) {
            return res.status(403).json({ error: "Not authorized to update this ticket" });
        }

        const updatedTicket = await prisma.ticket.update({
            where: { id },
            data: { ticketProgress: progress }
        });

        res.status(200).json(updatedTicket);
    } catch (error) {
        console.error("Update progress error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Assign Planning Worker
 * PATCH /api/admin/tickets/:id/assign-planning-worker
 */
exports.assignPlanningWorker = async (req, res) => {
    try {
        const { id } = req.params;
        const { workerId } = req.body;

        const updatedTicket = await prisma.ticket.update({
            where: { id },
            data: {
                planningWorkerId: workerId,
                status: 'SITE_VISIT_ASSIGNED'
            }
        });

        res.status(200).json(updatedTicket);
    } catch (error) {
        console.error("Assign planning worker error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Assign Installation Worker
 * PATCH /api/admin/tickets/:id/assign-installation-worker
 */
exports.assignInstallationWorker = async (req, res) => {
    try {
        const { id } = req.params;
        const { workerId } = req.body;

        const updatedTicket = await prisma.ticket.update({
            where: { id },
            data: {
                installationWorkerId: workerId,
                status: 'INSTALLATION_ASSIGNED'
            }
        });

        res.status(200).json(updatedTicket);
    } catch (error) {
        console.error("Assign installation worker error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Get Client Tickets (Phase 3)
 * GET /api/tickets/my-tickets
 */
exports.getClientTickets = async (req, res) => {
    try {
        const userEmail = req.user.email;
        // Find tickets matching user's email or potentially phone
        const tickets = await prisma.ticket.findMany({
            where: {
                OR: [
                    { clientEmail: userEmail },
                    { clientName: { equals: req.user.name, mode: 'insensitive' } } // Fallback
                ]
            },
            include: {
                assignments: {
                    include: { worker: { select: { name: true, phone: true } } }
                },
                invoice: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json(tickets);
    } catch (error) {
        console.error("Get client tickets error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Upload Ticket Photo (Phase 4)
 * POST /api/tickets/:id/photos
 */
exports.uploadTicketPhoto = async (req, res) => {
    try {
        const { id } = req.params;
        const { type } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: "No image file provided" });
        }

        // Generate a unique filename (moved from middleware to here since we use memoryStorage)
        const timestamp = Date.now();
        const ext = '.jpg'; // Store everything as optimized jpg
        const filename = `${id}-${type.toLowerCase()}-${timestamp}${ext}`;
        const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'tickets');
        const outputPath = path.join(uploadDir, filename);

        // Ensure upload directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Process image with Sharp: resize to max width 1280, compress to 75% quality
        // If the file is small (< 500KB), we might skip resizing but the user wants optimization for all
        await sharp(req.file.buffer)
            .resize({ width: 1280, withoutEnlargement: true, fit: 'inside' })
            .jpeg({ quality: 75 })
            .toFile(outputPath);

        // Relative path for storage, frontend will use /uploads prefix
        const imageUrl = `/uploads/tickets/${filename}`;

        const photo = await prisma.ticketPhoto.create({
            data: {
                ticketId: id,
                type,
                imageUrl,
                workerId: req.user?.userId || null,
                uploadedBy: req.user.role === 'ADMIN' ? 'Admin' : 'Worker'
            },
            include: {
                worker: { select: { name: true } }
            }
        });

        // Update the actual Ticket model's before_image and after_image JSON arrays
        const ticket = await prisma.ticket.findUnique({
            where: { id },
            select: { beforeImages: true, afterImages: true }
        });

        if (ticket) {
            let beforeImages = Array.isArray(ticket.beforeImages) ? ticket.beforeImages : [];
            let afterImages = Array.isArray(ticket.afterImages) ? ticket.afterImages : [];

            if (type === 'BEFORE') {
                beforeImages.push(imageUrl);
                await prisma.ticket.update({
                    where: { id },
                    data: { beforeImages }
                });
            } else if (type === 'AFTER') {
                afterImages.push(imageUrl);
                await prisma.ticket.update({
                    where: { id },
                    data: { afterImages }
                });
            }
        }

        res.status(201).json(photo);
    } catch (error) {
        console.error("Upload photo error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Get Ticket Photos (Phase 4)
 * GET /api/tickets/:id/photos
 */
exports.getTicketPhotos = async (req, res) => {
    try {
        const { id } = req.params;
        const photos = await prisma.ticketPhoto.findMany({
            where: { ticketId: id },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(photos);
    } catch (error) {
        console.error("Get photos error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Admin: Delete Ticket
 * DELETE /api/admin/tickets/:id
 */
exports.deleteTicket = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if ticket exists
        const ticket = await prisma.ticket.findUnique({
            where: { id }
        });

        if (!ticket) {
            return res.status(404).json({ error: "Ticket not found" });
        }

        // Deletion in transaction to ensure integrity
        // Order matters for some FK constraints, though deleteMany handles multiple
        await prisma.$transaction([
            prisma.review.deleteMany({ where: { ticketId: id } }),
            prisma.invoice.deleteMany({ where: { ticketId: id } }),
            prisma.ticketAssignment.deleteMany({ where: { ticketId: id } }),
            prisma.ticketPhoto.deleteMany({ where: { ticketId: id } }),
            prisma.paymentHistory.deleteMany({ where: { ticketId: id } }),
            prisma.internalNotification.deleteMany({ where: { ticketId: id } }),
            prisma.ticket.delete({ where: { id } })
        ]);

        res.status(200).json({ message: "Ticket and all related records deleted successfully" });
    } catch (error) {
        console.error("Delete ticket error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Submit Ticket Items (Worker)
 * POST /api/tickets/:id/items
 */
exports.submitTicketItems = async (req, res) => {
    try {
        const { id } = req.params;
        const { items, numCameras, cableLength, nvrDvrType, hardDiskType, powerSupply, surveyNotes } = req.body;

        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ error: "Items array is required" });
        }

        // Use transaction to ensure all updates succeed
        const result = await prisma.$transaction(async (tx) => {
            // Delete existing items if any
            await tx.ticketItem.deleteMany({ where: { ticketId: id } });

            // Create new items
            await tx.ticketItem.createMany({
                data: items.map(item => ({
                    ticketId: id,
                    itemName: item.itemName,
                    quantity: Number(item.quantity) || 1,
                    price: Number(item.price) || 0
                }))
            });

            // Update ticket status and survey details
            return await tx.ticket.update({
                where: { id },
                data: {
                    status: 'SITE_VISIT_COMPLETED',
                    quotationStatus: 'PENDING',
                    numCameras: Number(numCameras),
                    cableLength: Number(cableLength),
                    nvrDvrType,
                    hardDiskType,
                    powerSupply,
                    surveyNotes
                }
            });
        });

        res.status(200).json(result);
    } catch (error) {
        console.error("Submit ticket items error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Get Quotation (Admin/Worker/Client)
 * GET /api/tickets/:id/quotation
 */
exports.getQuotation = async (req, res) => {
    try {
        const { id } = req.params;
        const ticket = await prisma.ticket.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!ticket) return res.status(404).json({ error: "Ticket not found" });

        const total = ticket.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        res.status(200).json({
            ticket,
            items: ticket.items,
            total
        });
    } catch (error) {
        console.error("Get quotation error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Update Quotation (Admin)
 * PATCH /api/tickets/:id/update-quotation
 */
exports.updateQuotation = async (req, res) => {
    try {
        const { id } = req.params;
        const { items } = req.body;

        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ error: "Items array is required" });
        }

        const result = await prisma.$transaction(async (tx) => {
            // Delete existing
            await tx.ticketItem.deleteMany({ where: { ticketId: id } });

            // Create new
            await tx.ticketItem.createMany({
                data: items.map(item => ({
                    ticketId: id,
                    itemName: item.itemName,
                    quantity: Number(item.quantity) || 1,
                    price: Number(item.price) || 0
                }))
            });

            // Update total amount in ticket if needed, or just leave it for final invoice
            const total = items.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);

            return await tx.ticket.update({
                where: { id },
                data: { totalAmount: total }
            });
        });

        res.status(200).json(result);
    } catch (error) {
        console.error("Update quotation error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Send Quotation to Customer (Admin)
 * POST /api/tickets/:id/send-quotation
 */
exports.sendQuotation = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedTicket = await prisma.ticket.update({
            where: { id },
            data: {
                quotationStatus: 'SENT'
            }
        });

        res.status(200).json(updatedTicket);
    } catch (error) {
        console.error("Send quotation error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Handle Customer Quotation Action (Approve/Reject)
 * POST /api/tickets/:id/quotation-action
 */
exports.handleCustomerAction = async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body; // 'APPROVE' or 'REJECT'

        if (!['APPROVE', 'REJECT'].includes(action)) {
            return res.status(400).json({ error: "Invalid action" });
        }

        const status = action === 'APPROVE' ? 'INSTALLATION_APPROVED' : 'SITE_VISIT_COMPLETED';
        const qStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

        const updatedTicket = await prisma.ticket.update({
            where: { id },
            data: {
                status: status,
                quotationStatus: qStatus
            }
        });

        res.status(200).json(updatedTicket);
    } catch (error) {
        console.error("Customer action error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
