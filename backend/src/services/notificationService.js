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
            type: "INFO",
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
exports.onWorkerAssigned = async (data) => {
    try {
        if (!data.workerId) return;

        await prisma.notification.create({
            data: {
                userId: data.workerId,
                type: "INFO",
                title: "New Assignment",
                message: `You have been assigned a ${data.type} at ${data.address}`
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

        // Find primary worker name or fallback to "A technician"
        const primaryAssignment = ticket.assignments?.find(a => a.isPrimary);
        const workerName = primaryAssignment?.worker?.name || ticket.assignments?.[0]?.worker?.name || "A technician";

        const notifications = admins.map(admin => ({
            userId: admin.id,
            type: "SUCCESS",
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

        // Find primary worker name or fallback to "A technician"
        const primaryAssignment = ticket.assignments?.find(a => a.isPrimary);
        const workerName = primaryAssignment?.worker?.name || ticket.assignments?.[0]?.worker?.name || "A technician";

        const notifications = admins.map(admin => ({
            userId: admin.id,
            type: "WARNING",
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
