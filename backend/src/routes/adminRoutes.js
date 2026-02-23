const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

router.use(authMiddleware);
router.use(requireRole('ADMIN'));

// Ticket management
router.get('/tickets', ticketController.getAllTickets);
router.post('/tickets', ticketController.createTicket);
router.patch('/assign/:ticketId', ticketController.assignWorker);
router.patch('/tickets/:ticketId/status', ticketController.adminUpdateStatus);

// Ticket history / timeline
router.get('/ticket/:id/history', ticketController.getTicketHistory);

// Worker management
router.get('/workers', adminController.getWorkers);
router.post('/create-worker', adminController.createWorker);
router.delete('/worker/:id', adminController.deleteWorker);
router.patch('/reset-password/:id', adminController.resetWorkerPassword);
router.get('/worker-performance', adminController.getWorkerPerformance);

module.exports = router;
