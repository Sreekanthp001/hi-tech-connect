const prisma = require('../config/prisma');

/**
 * Telegram Webhook Controller
 * Logic: Read Telegram update, if /start, find most recent ticket without telegramId and save it.
 * 
 * SETUP INSTRUCTION:
 * To set this webhook, call:
 * https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?url=${BASE_URL}/api/telegram/webhook
 */
exports.handleWebhook = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || !message.text || !message.chat) {
            return res.status(200).send('OK'); // Safe return for non-message updates
        }

        const chatId = message.chat.id.toString();
        const text = message.text.trim();

        if (text.startsWith('/start')) {
            // Find most recent ticket without telegramId
            const recentTicket = await prisma.ticket.findFirst({
                where: { telegramId: null },
                orderBy: { createdAt: 'desc' }
            });

            if (recentTicket) {
                await prisma.ticket.update({
                    where: { id: recentTicket.id },
                    data: { telegramId: chatId }
                });
                console.log(`[Telegram Webhook] Linked chatId ${chatId} to ticket ${recentTicket.id}`);
            } else {
                console.log(`[Telegram Webhook] No tickets without telegramId found for chatId ${chatId}`);
            }
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('[Telegram Webhook Error]', error.message);
        // Do NOT crash, return 200 OK to Telegram to avoid retries on failure
        res.status(200).send('OK');
    }
};
