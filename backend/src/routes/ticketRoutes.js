const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');

const authMiddleware = require('../middleware/authMiddleware');

router.post('/', ticketController.createTicket);
router.get('/my-tickets', authMiddleware, ticketController.getClientTickets);

module.exports = router;
