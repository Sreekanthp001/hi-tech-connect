const axios = require('axios');

/**
 * Telegram Service
 * Handles sending notifications to workers via Telegram Bot API.
 */
const sendTelegramMessage = async (chatId, message) => {
    if (!process.env.TELEGRAM_BOT_TOKEN) {
        console.warn('[Telegram Service] TELEGRAM_BOT_TOKEN not found in environment.');
        return;
    }

    if (!chatId) {
        console.log('[Telegram Service] No Telegram ID provided for recipient.');
        return;
    }

    try {
        const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
        await axios.post(url, {
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML'
        });
    } catch (error) {
        console.error('[Telegram Service] Error sending message:', error.response?.data || error.message);
        // Fail silently to avoid blocking the main application flow
    }
};

module.exports = {
    sendTelegramMessage
};
