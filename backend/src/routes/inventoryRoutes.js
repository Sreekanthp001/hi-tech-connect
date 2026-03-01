const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// All inventory routes require admin access
router.use(authMiddleware, requireRole('ADMIN'));

router.get('/dashboard', inventoryController.getDashboard);
router.get('/alerts', inventoryController.getAlerts);
router.get('/workers', inventoryController.getWorkers);
router.get('/history/:productId', inventoryController.getHistory);

router.post('/add', inventoryController.addStock);
router.post('/issue', inventoryController.issueMaterial);

module.exports = router;
