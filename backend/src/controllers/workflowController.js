const prisma = require('../config/prisma');

// 1. Create a New Request
exports.createRequest = async (req, res) => {
    try {
        const { title, description, address, clientName, clientPhone, alternatePhone, requestType } = req.body;

        if (!['New Installation', 'Repair / Maintenance'].includes(requestType)) {
            return res.status(400).json({ error: "Invalid requestType" });
        }

        const type = requestType === 'New Installation' ? 'INSTALLATION' : 'COMPLAINT';

        const ticket = await prisma.ticket.create({
            data: {
                title,
                description,
                type,
                requestType,
                address,
                clientName,
                clientPhone,
                alternatePhone,
                status: 'NEW_REQUEST',
                ticketProgress: 'REQUESTED'
            }
        });

        res.status(201).json(ticket);
    } catch (error) {
        console.error("Create request error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// 2. Assign Site Visit (New Installation only)
exports.assignSiteVisit = async (req, res) => {
    try {
        const { id } = req.params;
        const { technicianId } = req.body;

        const ticket = await prisma.ticket.findUnique({ where: { id } });
        if (!ticket || ticket.requestType !== 'New Installation') {
            return res.status(400).json({ error: "Only New Installation requests can have a Site Visit." });
        }

        const updated = await prisma.ticket.update({
            where: { id },
            data: {
                planningWorkerId: technicianId,
                status: 'SURVEY_ASSIGNED'
            }
        });

        await prisma.notification.create({
            data: {
                userId: technicianId,
                title: "New Job Assigned",
                message: "You have been assigned for Site Survey / Planning.",
                type: "JOB_ASSIGNED",
                ticketId: id
            }
        });

        res.status(200).json(updated);
    } catch (error) {
        console.error("Assign visit error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// 3. Complete Site Visit & Auto-Generate Quote Draft
exports.completeSiteVisit = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            numCameras, cableLength, nvrDvrType, hardDiskType,
            powerSupply, surveyNotes, additionalItems
        } = req.body;

        if (!surveyNotes) {
            return res.status(400).json({ error: "Site survey notes are mandatory." });
        }

        // Auto-generation based on ItemsCatalog
        let quotationItems = [];
        let subtotal = 0;

        // Helper to add item from catalog
        const addItem = async (name, qty) => {
            if (!qty || qty <= 0) return;
            const item = await prisma.itemsCatalog.findUnique({ where: { name } });
            if (item) {
                const lineTotal = item.price * qty;
                subtotal += lineTotal;
                quotationItems.push({
                    name: item.name,
                    unitPrice: item.price,
                    quantity: qty,
                    totalPrice: lineTotal
                });
            }
        };

        // Standard logic for CCTV packages
        if (numCameras > 0) {
            // 1. Map Cameras
            // Try to find a default camera or one containing 'CAMERA'
            const defaultCamera = await prisma.itemsCatalog.findFirst({
                where: { name: { contains: 'CAMERA', mode: 'insensitive' } }
            });
            if (defaultCamera) {
                await addItem(defaultCamera.name, Number(numCameras));
            }

            // 2. Map Cable
            const defaultCable = await prisma.itemsCatalog.findFirst({
                where: { name: { contains: 'CAT6', mode: 'insensitive' } }
            });
            if (defaultCable) {
                await addItem(defaultCable.name, Number(cableLength));
            }

            // 3. Map Accessories (Exact matches from tech selection)
            if (nvrDvrType) await addItem(nvrDvrType, 1);
            if (hardDiskType) await addItem(hardDiskType, 1);
            if (powerSupply) await addItem(powerSupply, 1);

            // 4. Installation Charges
            const installCharge = await prisma.itemsCatalog.findFirst({
                where: { name: { contains: 'INSTALLATION', mode: 'insensitive' } }
            });
            if (installCharge) {
                await addItem(installCharge.name, Number(numCameras));
            }
        }

        const gstAmount = subtotal * 0.18;
        const grandTotal = subtotal + gstAmount;

        const draftQuote = {
            items: quotationItems,
            subtotal,
            gstPercent: 18,
            gstAmount,
            grandTotal
        };

        // Create TicketItems in the database for the generated quotation
        await prisma.ticketItem.deleteMany({ where: { ticketId: id } });
        await prisma.ticketItem.createMany({
            data: quotationItems.map(item => ({
                ticketId: id,
                itemName: item.name,
                quantity: item.quantity,
                price: item.unitPrice
            }))
        });

        const updated = await prisma.ticket.update({
            where: { id },
            data: {
                numCameras: Number(numCameras),
                cableLength: Number(cableLength),
                nvrDvrType,
                hardDiskType,
                powerSupply,
                surveyNotes,
                additionalItems,
                quotationItems: draftQuote,
                totalAmount: grandTotal,
                status: 'SURVEY_COMPLETED',
                quotationStatus: 'GENERATED'
            }
        });

        res.status(200).json(updated);
    } catch (error) {
        console.error("Complete survey error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// 4. Admin Edit & Send Quotation
exports.sendQuotation = async (req, res) => {
    try {
        const { id } = req.params;
        const { quotationData } = req.body;

        const updated = await prisma.ticket.update({
            where: { id },
            data: {
                quotationItems: quotationData,
                status: 'QUOTATION_SENT',
                quotationStatus: 'SENT'
            }
        });

        res.status(200).json(updated);
    } catch (error) {
        console.error("Send quotation error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// 5. Approve Request
exports.approveRequest = async (req, res) => {
    try {
        const { id } = req.params;

        const updated = await prisma.ticket.update({
            where: { id },
            data: {
                status: 'APPROVED',
                quotationStatus: 'APPROVED'
            }
        });

        res.status(200).json(updated);
    } catch (error) {
        console.error("Approve error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// 6. Assign Worker Team
exports.assignWork = async (req, res) => {
    try {
        const { id } = req.params;
        const { technicianIds } = req.body; // array of IDs

        const ticket = await prisma.ticket.findUnique({ where: { id } });
        if (ticket.requestType === 'New Installation' && !['APPROVED', 'WAITING_CUSTOMER_APPROVAL'].includes(ticket.status)) {
            // Usually approved, but allow flexibility if admin forces
            // return res.status(400).json({ error: "Must be APPROVED before assigning work." });
        }

        // Create multiple assignments
        if (technicianIds && technicianIds.length > 0) {
            await prisma.ticketAssignment.deleteMany({ where: { ticketId: id } });
            await prisma.ticketAssignment.createMany({
                data: technicianIds.map((tid, index) => ({
                    ticketId: id,
                    workerId: tid,
                    isPrimary: index === 0
                }))
            });
        }

        const updated = await prisma.ticket.update({
            where: { id },
            data: {
                status: 'INSTALLATION_ASSIGNED'
            }
        });

        res.status(200).json(updated);
    } catch (error) {
        console.error("Assign work error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// 7. Complete Work & Upload Images
exports.completeWork = async (req, res) => {
    try {
        const { id } = req.params;
        const { beforeImages, afterImages } = req.body;

        // Enforce Image Rules
        const ticket = await prisma.ticket.findUnique({ where: { id } });

        let bImages = Array.isArray(beforeImages) ? beforeImages : [];
        let aImages = Array.isArray(afterImages) ? afterImages : [];

        if (ticket.requestType === 'Repair / Maintenance') {
            if (bImages.length === 0 || aImages.length === 0) {
                return res.status(400).json({ error: "Before and After images are mandatory for Repair." });
            }
        } else {
            // New Installation: also require images generally after Work Assigned
            if (bImages.length === 0 || aImages.length === 0) {
                return res.status(400).json({ error: "Images are required to complete the installation." });
            }
        }

        const updated = await prisma.ticket.update({
            where: { id },
            data: {
                beforeImages: bImages,
                afterImages: aImages,
                status: 'WORK_COMPLETED'
            }
        });

        res.status(200).json(updated);
    } catch (error) {
        console.error("Complete work error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// 8. Dashboards
exports.getAdminDashboard = async (req, res) => {
    try {
        const tickets = await prisma.ticket.findMany({
            where: { requestType: { not: null } },
            orderBy: { updatedAt: 'desc' }
        });

        const dashboard = {
            requests: tickets.filter(t => ['NEW_REQUEST', 'SUBMITTED'].includes(t.status)),
            siteSurveys: tickets.filter(t => ['SURVEY_ASSIGNED', 'SURVEY_COMPLETED'].includes(t.status)),
            pendingQuotations: tickets.filter(t => ['QUOTATION_GENERATED', 'QUOTATION_SENT', 'WAITING_CUSTOMER_APPROVAL'].includes(t.status)),
            approvedWorks: tickets.filter(t => ['APPROVED', 'INSTALLATION_ASSIGNED', 'WORK_ASSIGNED'].includes(t.status)),
            completedWorks: tickets.filter(t => t.status === 'WORK_COMPLETED')
        };

        res.status(200).json(dashboard);
    } catch (error) {
        console.error("Admin dashboard error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.getTechnicianDashboard = async (req, res) => {
    try {
        const userId = req.user.userId;
        const assignedVisits = await prisma.ticket.findMany({
            where: {
                status: 'SITE_VISIT_ASSIGNED',
                assignedTechnician: userId
            }
        });

        res.status(200).json({ assignedVisits });
    } catch (error) {
        console.error("Tech dashboard error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.getWorkerDashboard = async (req, res) => {
    try {
        const userId = req.user.userId;
        // Depending on how teams are assigned: using new `assignedTeam` field or backward-compatible assignments
        // To be safe, look for anything marked as WORK_ASSIGNED.
        const jobs = await prisma.ticket.findMany({
            where: {
                status: 'WORK_ASSIGNED'
                // Add specific team/userId filtering logic later based on assignment model
            }
        });

        res.status(200).json({ assignedJobs: jobs });
    } catch (error) {
        console.error("Worker dashboard error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
