const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

router.use(authMiddleware);
router.use(requireRole('WORKER'));

router.get('/tickets', ticketController.getWorkerTickets);
router.patch('/tickets/:ticketId/status', ticketController.updateStatus);

module.exports = router;
