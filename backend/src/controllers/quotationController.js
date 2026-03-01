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
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(quotations);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};
