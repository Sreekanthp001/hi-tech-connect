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
router.post('/tickets/:ticketId/add-payment', ticketController.addPayment);
router.delete('/tickets/:id', ticketController.deleteTicket);

// Ticket history / timeline
router.get('/ticket/:id/history', ticketController.getTicketHistory);

// Worker management
router.get('/workers', adminController.getWorkers);
router.post('/create-worker', adminController.createWorker);
router.delete('/worker/:id', adminController.deleteWorker);
router.patch('/workers/:id/telegram', adminController.updateWorkerTelegram);
router.patch('/reset-password/:id', adminController.resetWorkerPassword);
router.get('/worker-performance', adminController.getWorkerPerformance);
router.get('/dashboard-stats', adminController.getDashboardStats);
router.get('/maintenance-alerts', adminController.getMaintenanceAlerts);
router.get('/tickets/:id/photos', ticketController.getTicketPhotos);
router.get('/revenue-stats', adminController.getRevenueStats);

// Internal Notifications (Phase 7)
router.get('/notifications', adminController.getNotifications);
router.patch('/notifications/:id/read', adminController.markNotificationRead);

// Customer management
router.get('/customers', adminController.getCustomers);
router.get('/customer/:id', adminController.getCustomerProfile);
router.get('/customers/:id/statement', adminController.getCustomerStatement);

module.exports = router;
