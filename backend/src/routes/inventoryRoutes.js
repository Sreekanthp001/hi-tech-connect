const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

router.use(authMiddleware);

router.get('/dashboard', requireRole('ADMIN'), inventoryController.getDashboard);
router.get('/alerts', requireRole('ADMIN'), inventoryController.getAlerts);
router.get('/workers', requireRole('ADMIN'), inventoryController.getWorkers);
router.get('/history/:productId', requireRole('ADMIN'), inventoryController.getHistory);
router.get('/report', requireRole('ADMIN'), inventoryController.getReport);
router.get('/report/download', requireRole('ADMIN'), inventoryController.downloadReport);
router.post('/add', requireRole('ADMIN'), inventoryController.addStock);
router.post('/issue', requireRole('ADMIN'), inventoryController.issueMaterial);
router.get('/ticket/:ticketId/materials', authMiddleware, inventoryController.getTicketMaterials);
router.post('/ticket/material/add', inventoryController.addTicketMaterial);
router.delete('/ticket/material/:id', inventoryController.removeTicketMaterial);
router.delete('/products/:id', requireRole('ADMIN'), inventoryController.deleteProduct);

router.get("/products/list", inventoryController.getProducts);
module.exports = router;
