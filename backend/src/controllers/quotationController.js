const prisma = require('../config/prisma');
const quotationService = require('../services/quotationService');
const pdfService = require('../services/pdfService');

// Generate PDF
exports.getPDF = async (req, res) => {
    try {
        const { id } = req.params;
        const quotation = await prisma.quotation.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!quotation) return res.status(404).json({ error: "Quotation not found" });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Quotation_${quotation.quotationNo}.pdf`);

        await pdfService.generateQuotation(quotation, res);
    } catch (error) {
        console.error("PDF generation error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Generate initial draft
exports.generate = async (req, res) => {
    try {
        const quotation = await quotationService.generateDraft(req.body);
        res.status(201).json(quotation);
    } catch (error) {
        console.error("Quotation generation error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Recalculate quotation with discounts
exports.recalculate = async (req, res) => {
    try {
        const { id } = req.params;
        const { discount, discountType } = req.body;
        const quotation = await quotationService.recalculateQuotation(id, discount, discountType);
        res.status(200).json(quotation);
    } catch (error) {
        res.status(500).json({ error: error.message || "Internal server error" });
    }
};

// Update status
exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const quotation = await prisma.quotation.update({
            where: { id },
            data: { status }
        });
        res.status(200).json(quotation);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

// Get by Ticket ID
exports.getByTicketId = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const quotation = await prisma.quotation.findUnique({
            where: { ticketId },
            include: { items: true }
        });
        if (!quotation) return res.status(404).json({ error: "Quotation not found" });
        res.status(200).json(quotation);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

// Comprehensive Update (Admin)
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { items, discount, discountType, status, notes } = req.body;

        const result = await prisma.$transaction(async (tx) => {
            // If items are provided, replace them
            if (items && Array.isArray(items)) {
                await tx.quotationItem.deleteMany({ where: { quotationId: id } });
                await tx.quotationItem.createMany({
                    data: items.map(item => ({
                        quotationId: id,
                        name: item.name,
                        quantity: parseInt(item.quantity) || 0,
                        unitPrice: parseFloat(item.unitPrice) || 0,
                        totalPrice: (parseInt(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)
                    }))
                });
            }

            // Fetch current items to calculate totals
            const updatedItems = await tx.quotationItem.findMany({ where: { quotationId: id } });
            const subtotal = updatedItems.reduce((sum, item) => sum + item.totalPrice, 0);

            // Re-calculate totals
            let discountAmount = 0;
            if (discountType === 'PERCENTAGE') {
                discountAmount = (subtotal * (discount || 0)) / 100;
            } else {
                discountAmount = discount || 0;
            }

            const subtotalAfterDiscount = subtotal - discountAmount;
            const gstAmount = subtotalAfterDiscount * 0.18;
            const grandTotal = subtotalAfterDiscount + gstAmount;

            return await tx.quotation.update({
                where: { id: id },
                data: {
                    subtotal: subtotal,
                    discount: discountAmount,
                    discountType: discountType || 'FLAT',
                    gstAmount: gstAmount,
                    grandTotal: grandTotal,
                    status: status || undefined,
                    notes: notes || undefined
                },
                include: { items: true }
            });
        });

        res.status(200).json(result);
    } catch (error) {
        console.error("Update quotation error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Get by ID
exports.getById = async (req, res) => {
    try {
        const { id } = req.params;
        const quotation = await prisma.quotation.findUnique({
            where: { id },
            include: { items: true }
        });
        if (!quotation) return res.status(404).json({ error: "Quotation not found" });
        res.status(200).json(quotation);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

// List all
exports.getAll = async (req, res) => {
    try {
        const quotations = await prisma.quotation.findMany({
            orderBy: { createdAt: 'desc' },
            include: { items: true }
        });
        res.status(200).json(quotations);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};// Get PDF by Ticket ID
exports.getPDFByTicketId = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const quotation = await prisma.quotation.findUnique({
            where: { ticketId },
            include: { items: true }
        });

        if (!quotation) {
            // If no quotation record, try to generate one from ticket items on the fly or return error
            // For now, let's assume updateQuotation creates it.
            return res.status(404).json({ error: "Quotation not found for this ticket. Please finalize it first." });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Quotation_${quotation.quotationNo}.pdf`);

        await pdfService.generateQuotation(quotation, res);
    } catch (error) {
        console.error("Ticket PDF generation error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = exports;
