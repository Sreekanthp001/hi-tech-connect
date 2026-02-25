const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

router.use(authMiddleware);

// Admin only: List all invoices
router.get('/', requireRole('ADMIN'), invoiceController.getAllInvoices);

// Shared: Download specific invoice
router.get('/:id/download', invoiceController.downloadInvoice);

// Shared: Get invoice by ticket ID
router.get('/ticket/:ticketId', invoiceController.getInvoiceByTicket);

module.exports = router;
