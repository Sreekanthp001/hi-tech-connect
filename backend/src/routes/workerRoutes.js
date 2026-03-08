const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const authController = require('../controllers/authController');
const workerController = require('../controllers/workerController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(authMiddleware);
router.use(requireRole('WORKER'));

router.get('/tickets', workerController.getWorkerTickets);
router.patch('/tickets/:ticketId/status', ticketController.updateStatus);
router.patch('/tickets/:id/progress', ticketController.updateProgress);
router.post('/tickets/:ticketId/upload-photo', upload.single('photo'), ticketController.uploadTicketPhoto);
router.patch('/tickets/:ticketId/items', ticketController.submitTicketItems);
router.post('/change-password', authController.changePassword);

module.exports = router;
