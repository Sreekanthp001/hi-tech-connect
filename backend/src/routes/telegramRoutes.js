const express = require('express');
const router = express.Router();
const telegramWebhookController = require('../controllers/telegramWebhookController');

router.post('/webhook', telegramWebhookController.handleWebhook);

module.exports = router;
