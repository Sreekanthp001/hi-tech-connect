const prisma = require('../config/prisma');
const telegramService = require('../services/telegramService');

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

                // Send confirmation back to the customer
                const confirmMsg =
                    `✅ <b>You're all set, ${recentTicket.clientName}!</b>\n\n` +
                    `Your Telegram account has been linked to your service request.\n\n` +
                    `📋 <b>Service:</b> ${recentTicket.title}\n` +
                    `📍 <b>Location:</b> ${recentTicket.address}\n` +
                    `🆔 <b>Ticket:</b> ${recentTicket.id.slice(0, 8).toUpperCase()}\n\n` +
                    `You will receive updates here when a technician is assigned and when the job is completed. 🛡️`;

                telegramService.sendTelegramMessage(chatId, confirmMsg).catch(() => { });
            } else {
                // No matching ticket found — notify the user gracefully
                const noTicketMsg =
                    `ℹ️ <b>Hi there!</b>\n\n` +
                    `We couldn't find any recent pending service request to link to this account.\n\n` +
                    `If you've just submitted a request, please wait a moment and send /start again.\n` +
                    `For assistance, contact us directly. 📞`;

                telegramService.sendTelegramMessage(chatId, noTicketMsg).catch(() => { });
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
