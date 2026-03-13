const inventoryService = require('../services/inventoryService');
const prisma = require('../config/prisma');

// Add Stock (IN)
exports.addStock = async (req, res) => {
    try {
        const transaction = await inventoryService.addStock(req.body);
        res.status(201).json(transaction);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Issue Material (OUT)
exports.issueMaterial = async (req, res) => {
    try {
        const transaction = await inventoryService.issueMaterial(req.body);
        res.status(201).json(transaction);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get Dashboard Stats
exports.getDashboard = async (req, res) => {
    try {
        const stats = await inventoryService.getDashboardStats();
        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

// Get Product History
exports.getHistory = async (req, res) => {
    try {
        const { productId } = req.params;
        const history = await inventoryService.getProductHistory(productId);
        const currentStock = await inventoryService.getCurrentStock(productId);
        res.status(200).json({ history, currentStock });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

// Get Low Stock Alerts
exports.getAlerts = async (req, res) => {
    try {
        const alerts = await inventoryService.getLowStockAlerts();
        res.status(200).json(alerts);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

// Get Daily Usage Report
exports.getReport = async (req, res) => {
    try {
        const report = await inventoryService.getDailyUsageReport();
        res.status(200).json(report);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

// Add Material to Ticket
exports.addTicketMaterial = async (req, res) => {
    try {
        const item = await inventoryService.addMaterialToTicket(req.body);
        res.status(201).json(item);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Remove Material from Ticket
exports.removeTicketMaterial = async (req, res) => {
    try {
        const result = await inventoryService.removeMaterialFromTicket(req.body);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// List all workers for issue dropdown
exports.getWorkers = async (req, res) => {
    try {
        const workers = await prisma.user.findMany({
            where: { role: 'WORKER' },
            select: { id: true, name: true, email: true }
        });
        res.status(200).json(workers);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.getTicketMaterials = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const materials = await prisma.ticketMaterial.findMany({
            where: { ticketId },
            include: { product: true }
        });
        res.json(materials);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        await prisma.stockTransaction.deleteMany({ where: { productId: req.params.id } });
        await prisma.ticketMaterial.deleteMany({ where: { productId: req.params.id } });
        await prisma.productMaster.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
