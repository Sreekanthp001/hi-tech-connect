const express = require('express');
const router = express.Router();
const quotationController = require('../controllers/quotationController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// All quotation routes require authentication
router.use(authMiddleware);

// Generate initial draft
router.post('/generate', quotationController.generate);

// Recalculate quotation
router.put('/:id/recalculate', quotationController.recalculate);

// Get by Ticket ID
router.get('/ticket/:ticketId', quotationController.getByTicketId);

// Update status (Admin only)
router.put('/:id/status', requireRole('ADMIN'), quotationController.updateStatus);

// Update quotation (Admin only)
router.patch('/:id', requireRole('ADMIN'), quotationController.update);

// Get PDF
router.get('/:id/pdf', quotationController.getPDF);
router.get('/ticket/:ticketId/pdf', quotationController.getPDFByTicketId);

// Get by ID
router.get('/:id', quotationController.getById);

// List all (Admin only)
router.get('/', requireRole('ADMIN'), quotationController.getAll);

module.exports = router;
