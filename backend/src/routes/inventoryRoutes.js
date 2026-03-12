const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Admin only routes
router.get('/dashboard', requireRole('ADMIN'), inventoryController.getDashboard);
router.get('/alerts', requireRole('ADMIN'), inventoryController.getAlerts);
router.get('/workers', requireRole('ADMIN'), inventoryController.getWorkers);
router.get('/history/:productId', requireRole('ADMIN'), inventoryController.getHistory);
router.get('/report', requireRole('ADMIN'), inventoryController.getReport);

router.post('/add', requireRole('ADMIN'), inventoryController.addStock);
router.post('/issue', requireRole('ADMIN'), inventoryController.issueMaterial);

// Routes allowed for both Admin and Worker
router.post('/ticket/add', inventoryController.addTicketMaterial);
router.post('/ticket/remove', inventoryController.removeTicketMaterial);

module.exports = router;
