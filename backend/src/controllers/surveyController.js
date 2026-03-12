const prisma = require('../config/prisma');

/**
 * Submit Site Survey (Worker)
 * POST /api/survey/submit
 */
exports.submitSurvey = async (req, res) => {
    try {
        const { ticketId, items, notes } = req.body;

        if (!ticketId || !items || !Array.isArray(items)) {
            return res.status(400).json({ error: "Ticket ID and items are required" });
        }

        // Fetch ticket
        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId }
        });

        if (!ticket) {
            return res.status(404).json({ error: "Ticket not found" });
        }

        // Fetch products from master list for selection
        const catalogItems = await prisma.productMaster.findMany({
            where: { isActive: true },
            select: { id: true, name: true, category: true, sellingPrice: true, unitType: true }
        });

        const pricingMap = {};
        catalogItems.forEach(item => {
            pricingMap[item.name] = item.sellingPrice;
        });

        // Prepare quotation items
        const quotationItemsData = items
            .filter(item => item.quantity > 0)
            .map(item => {
                const unitPrice = pricingMap[item.name] || 0;
                return {
                    name: item.name,
                    quantity: parseInt(item.quantity),
                    unitPrice: unitPrice,
                    totalPrice: parseInt(item.quantity) * unitPrice
                };
            });

        if (quotationItemsData.length === 0) {
            return res.status(400).json({ error: "At least one item with quantity > 0 is required" });
        }

        const subtotal = quotationItemsData.reduce((sum, item) => sum + item.totalPrice, 0);
        const gstAmount = subtotal * 0.18;
        const grandTotal = subtotal + gstAmount;

        const quotationNo = `QTN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

        // Transaction to create quotation and update ticket
        const result = await prisma.$transaction(async (tx) => {
            const quotation = await tx.quotation.create({
                data: {
                    quotationNo,
                    ticketId: ticket.id,
                    customerName: ticket.clientName,
                    customerPhone: ticket.clientPhone,
                    cameraCount: ticket.numCameras || 0,
                    cameraType: ticket.nvrDvrType || "CCTV",
                    wireLength: ticket.cableLength || 0,
                    notes: notes,
                    subtotal,
                    gstAmount,
                    grandTotal,
                    status: 'PENDING',
                    items: {
                        create: quotationItemsData
                    }
                },
                include: { items: true }
            });

            await tx.ticket.update({
                where: { id: ticket.id },
                data: {
                    status: 'QUOTATION_GENERATED',
                    quotationStatus: 'PENDING',
                    numCameras: quotation.cameraCount,
                    cableLength: quotation.wireLength,
                    nvrDvrType: quotation.cameraType,
                    surveyNotes: notes
                }
            });

            return quotation;
        });

        res.status(201).json(result);
    } catch (error) {
        console.error("Submit survey error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
