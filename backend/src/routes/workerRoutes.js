const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const authController = require('../controllers/authController');
const workerController = require("../controllers/workerController");
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');
const workflowController = require('../controllers/workflowController');

router.use(authMiddleware);
router.use(requireRole('WORKER'));

router.get('/tickets', ticketController.getWorkerTickets);
router.get("/tickets", authMiddleware, workerController.getWorkerTickets);
router.patch('/tickets/:ticketId/status', ticketController.updateStatus);
router.patch('/tickets/:id/progress', ticketController.updateProgress);
router.post('/tickets/:id/upload-photo', upload.single('file'), ticketController.uploadTicketPhoto);
router.post('/tickets/:id/items', ticketController.submitTicketItems);
router.get('/tickets/:id/quotation', ticketController.getQuotation);
router.post('/tickets/:id/complete-survey', workflowController.completeSiteVisit);
router.get('/tickets/:id/photos', ticketController.getTicketPhotos);
router.patch('/change-password', authController.changePassword);

module.exports = router;
