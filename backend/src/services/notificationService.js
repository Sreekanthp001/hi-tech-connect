const prisma = require('../config/prisma');

/**
 * Internal Notification Service
 * Handles in-app notifications by saving records to the database.
 * Methods are non-blocking.
 */

// A) When New Ticket Created (Public Form) -> Notify ADMIN
exports.onTicketCreated = async (ticket) => {
    try {
        const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
        const notifications = admins.map(admin => ({
            userId: admin.id,
            title: "New Service Request",
            message: `New ${ticket.type} from ${ticket.clientName}`
        }));

        if (notifications.length > 0) {
            await prisma.notification.createMany({ data: notifications });
        }
    } catch (err) {
        console.error('[Notification Service] Error onTicketCreated:', err.message);
    }
};

// B) When Admin Assigns Worker -> Notify WORKER
exports.onWorkerAssigned = async (ticket) => {
    try {
        if (!ticket.workerId) return;

        await prisma.notification.create({
            data: {
                userId: ticket.workerId,
                title: "New Assignment",
                message: `You have been assigned a ${ticket.type} at ${ticket.address}`
            }
        });
    } catch (err) {
        console.error('[Notification Service] Error onWorkerAssigned:', err.message);
    }
};

// C) When Worker Marks COMPLETED -> Notify ADMIN
exports.onTicketCompleted = async (ticket) => {
    try {
        const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
        const workerName = ticket.worker?.name || "A technician";

        const notifications = admins.map(admin => ({
            userId: admin.id,
            title: "Work Completed",
            message: `Ticket completed by ${workerName}`
        }));

        if (notifications.length > 0) {
            await prisma.notification.createMany({ data: notifications });
        }
    } catch (err) {
        console.error('[Notification Service] Error onTicketCompleted:', err.message);
    }
};

// D) When Worker Marks PENDING -> Notify ADMIN
exports.onTicketPending = async (ticket, note) => {
    try {
        const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
        const workerName = ticket.worker?.name || "A technician";

        const notifications = admins.map(admin => ({
            userId: admin.id,
            title: "Work Marked Pending",
            message: `${workerName} marked ticket pending: ${note || "No reason provided"}`
        }));

        if (notifications.length > 0) {
            await prisma.notification.createMany({ data: notifications });
        }
    } catch (err) {
        console.error('[Notification Service] Error onTicketPending:', err.message);
    }
};
