const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Daily Cron Job at 00:00 (Midnight)
 * Checks for:
 * 1. Pending Payments for Completed Tickets (> 7 days)
 * 2. Upcoming Warranty Expiries (within 7 days)
 * 3. Upcoming AMC Renewals (within 15 days)
 */
const initCronJobs = () => {
    // Run every day at midnight
    cron.schedule('0 0 * * *', async () => {
        console.log('Running daily reminder cron job...');
        await checkPendingPayments();
        await checkWarrantyExpiries();
        await checkAMCRenewals();
    });

    // Also run once on startup in development to verify
    if (process.env.NODE_ENV === 'development') {
        process.nextTick(async () => {
            console.log('Running startup reminder check...');
            await checkPendingPayments();
            await checkWarrantyExpiries();
            await checkAMCRenewals();
        });
    }
};

const checkPendingPayments = async () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    try {
        const pendingTickets = await prisma.ticket.findMany({
            where: {
                status: 'COMPLETED',
                paymentStatus: { in: ['PENDING', 'PARTIAL'] },
                updatedAt: { lte: sevenDaysAgo }
            },
            include: { customer: true }
        });

        for (const ticket of pendingTickets) {
            const message = `Payment Pending: ${ticket.clientName} for ${ticket.title} (Ticket #${ticket.id.slice(0, 8)})`;

            // Avoid duplicate notifications for same ticket if one is already unread
            const existing = await prisma.internalNotification.findFirst({
                where: { ticketId: ticket.id, type: 'PAYMENT', isRead: false }
            });

            if (!existing) {
                await prisma.internalNotification.create({
                    data: {
                        type: 'PAYMENT',
                        message,
                        ticketId: ticket.id,
                        customerId: ticket.customerId
                    }
                });
            }
        }
    } catch (error) {
        console.error('Error in checkPendingPayments cron:', error);
    }
};

const checkWarrantyExpiries = async () => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    try {
        const expiringTickets = await prisma.ticket.findMany({
            where: {
                warrantyExpiryDate: {
                    gte: today,
                    lte: nextWeek
                }
            }
        });

        for (const ticket of expiringTickets) {
            const message = `Warranty Expiring Soon: ${ticket.clientName} - ${ticket.title}`;

            const existing = await prisma.internalNotification.findFirst({
                where: { ticketId: ticket.id, type: 'WARRANTY', isRead: false }
            });

            if (!existing) {
                await prisma.internalNotification.create({
                    data: {
                        type: 'WARRANTY',
                        message,
                        ticketId: ticket.id,
                        customerId: ticket.customerId
                    }
                });
            }
        }
    } catch (error) {
        console.error('Error in checkWarrantyExpiries cron:', error);
    }
};

const checkAMCRenewals = async () => {
    const today = new Date();
    const nextFortnight = new Date();
    nextFortnight.setDate(today.getDate() + 15);

    try {
        const renewingTickets = await prisma.ticket.findMany({
            where: {
                amcEnabled: true,
                amcRenewalDate: {
                    gte: today,
                    lte: nextFortnight
                }
            }
        });

        for (const ticket of renewingTickets) {
            const message = `AMC Renewal Due: ${ticket.clientName} - ${ticket.title}`;

            const existing = await prisma.internalNotification.findFirst({
                where: { ticketId: ticket.id, type: 'AMC', isRead: false }
            });

            if (!existing) {
                await prisma.internalNotification.create({
                    data: {
                        type: 'AMC',
                        message,
                        ticketId: ticket.id,
                        customerId: ticket.customerId
                    }
                });
            }
        }
    } catch (error) {
        console.error('Error in checkAMCRenewals cron:', error);
    }
};

module.exports = { initCronJobs };
