const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(authMiddleware);
router.use(requireRole('WORKER'));

router.get('/tickets', ticketController.getWorkerTickets);
router.patch('/tickets/:ticketId/status', ticketController.updateStatus);
router.patch('/tickets/:id/progress', ticketController.updateProgress);
router.post('/tickets/:id/upload-photo', upload.single('file'), ticketController.uploadTicketPhoto);
router.get('/tickets/:id/photos', ticketController.getTicketPhotos);

module.exports = router;
