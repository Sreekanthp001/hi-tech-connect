const prisma = require('../config/prisma');

// 1. Create a New Request
exports.createRequest = async (req, res) => {
    try {
        const { title, description, address, clientName, clientPhone, requestType } = req.body;

        if (!['New Installation', 'Repair / Maintenance'].includes(requestType)) {
            return res.status(400).json({ error: "Invalid requestType" });
        }

        // Map to existing TicketType to avoid breaking other parts conceptually
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
                status: 'SUBMITTED', // Using new status
                ticketProgress: 'REQUESTED' // Keep backward compatibility
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

        // Verify the user is a SENIOR technician (or just a valid worker)
        // Here we just assign and change status
        const updated = await prisma.ticket.update({
            where: { id },
            data: {
                assignedTechnician: technicianId,
                status: 'SITE_VISIT_ASSIGNED'
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
        const { notes, items } = req.body; // items = [{ productId, quantity }]

        if (!notes) {
            return res.status(400).json({ error: "Site visit notes are mandatory." });
        }

        let quotationItems = [];
        let subtotal = 0;

        if (items && Array.isArray(items) && items.length > 0) {
            for (const item of items) {
                const product = await prisma.productMaster.findUnique({ where: { id: item.productId } });
                if (product) {
                    const lineTotal = product.sellingPrice * item.quantity;
                    subtotal += lineTotal;
                    quotationItems.push({
                        productId: product.id,
                        name: product.name,
                        unitPrice: product.sellingPrice,
                        quantity: item.quantity,
                        totalPrice: lineTotal
                    });
                }
            }
        }

        // Calculate GST (assuming 18% as default, Admin can edit later)
        const gstAmount = subtotal * 0.18;
        const grandTotal = subtotal + gstAmount;

        const draftQuote = {
            items: quotationItems,
            subtotal,
            gstPercent: 18,
            gstAmount,
            grandTotal
        };

        const updated = await prisma.ticket.update({
            where: { id },
            data: {
                siteVisitNotes: notes,
                quotationItems: draftQuote,
                status: 'SITE_VISIT_COMPLETED',
                quotationStatus: 'GENERATED' // Auto-generated draft
            }
        });

        res.status(200).json(updated);
    } catch (error) {
        console.error("Complete visit error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// 4. Admin Edit & Send Quotation
exports.sendQuotation = async (req, res) => {
    try {
        const { id } = req.params;
        const { quotationData } = req.body; // Allows Admin to submit edited prices/quantities

        const updated = await prisma.ticket.update({
            where: { id },
            data: {
                quotationItems: quotationData,
                status: 'QUOTATION_SENT',
                quotationStatus: 'SENT'
            }
        });

        // Here we could trigger email/SMS if required.
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
        const { teamId } = req.body; // or array of worker IDs

        const ticket = await prisma.ticket.findUnique({ where: { id } });
        if (ticket.requestType === 'New Installation' && ticket.status !== 'APPROVED') {
            return res.status(400).json({ error: "Must be APPROVED before assigning work for New Installation." });
        }

        // Can also utilize the existing TicketAssignment model to maintain backward compatibility
        const updated = await prisma.ticket.update({
            where: { id },
            data: {
                assignedTeam: teamId,
                status: 'WORK_ASSIGNED'
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

        // Group by custom advanced workflow fields
        const dashboard = {
            requests: tickets.filter(t => t.status === 'SUBMITTED'),
            siteVisits: tickets.filter(t => ['SITE_VISIT_ASSIGNED', 'SITE_VISIT_COMPLETED'].includes(t.status)),
            pendingQuotations: tickets.filter(t => ['QUOTATION_GENERATED', 'QUOTATION_SENT'].includes(t.status)),
            approvedWorks: tickets.filter(t => ['APPROVED', 'WORK_ASSIGNED'].includes(t.status)),
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
