const prisma = require('../config/prisma');
const bcrypt = require('bcrypt');

/**
 * Worker Performance Report
 * GET /api/admin/worker-performance
 */
exports.getWorkerPerformance = async (req, res) => {
    try {
        const workers = await prisma.user.findMany({
            where: { role: 'WORKER' },
            select: { id: true, name: true }
        });

        const now = new Date();
        const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

        const tickets = await prisma.ticket.findMany({
            where: { workerId: { not: null } },
            select: {
                workerId: true,
                status: true,
                updatedAt: true,
            }
        });

        const ticketMap = {};
        for (const t of tickets) {
            if (!ticketMap[t.workerId]) {
                ticketMap[t.workerId] = { all: [], completed: [], inProgress: [], pending: [], thisMonth: [] };
            }
            ticketMap[t.workerId].all.push(t);
            if (t.status === 'COMPLETED') {
                ticketMap[t.workerId].completed.push(t);
                if (new Date(t.updatedAt) >= monthStart) {
                    ticketMap[t.workerId].thisMonth.push(t);
                }
            } else if (t.status === 'IN_PROGRESS') {
                ticketMap[t.workerId].inProgress.push(t);
            } else {
                ticketMap[t.workerId].pending.push(t);
            }
        }

        const performance = workers.map((w) => {
            const data = ticketMap[w.id] || { all: [], completed: [], inProgress: [], pending: [], thisMonth: [] };
            const totalAssigned = data.all.length;
            const completedCount = data.completed.length;
            const inProgressCount = data.inProgress.length;
            const pendingCount = data.pending.length;
            const thisMonthCompleted = data.thisMonth.length;
            const completionRate = totalAssigned > 0
                ? Math.round((completedCount / totalAssigned) * 100)
                : 0;

            return {
                workerId: w.id,
                name: w.name,
                totalAssigned,
                completedCount,
                inProgressCount,
                pendingCount,
                completionRate,
                thisMonthCompleted,
            };
        });

        performance.sort((a, b) => b.completionRate - a.completionRate);
        res.status(200).json(performance);
    } catch (error) {
        console.error("Worker performance error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * List all workers
 * GET /api/admin/workers
 */
exports.getWorkers = async (req, res) => {
    try {
        const workers = await prisma.user.findMany({
            where: { role: 'WORKER' },
            select: { id: true, name: true, email: true, phone: true, createdAt: true },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(workers);
    } catch (error) {
        console.error("Get workers error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Create a new worker
 * POST /api/admin/create-worker
 */
exports.createWorker = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: "Name, email and password are required" });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters" });
        }

        const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        if (existingUser) {
            return res.status(400).json({ error: "Email already in use" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const worker = await prisma.user.create({
            data: {
                name,
                email: email.toLowerCase(),
                phone: phone || null,
                password: hashedPassword,
                role: 'WORKER'
            },
            select: { id: true, name: true, email: true, phone: true, role: true }
        });

        res.status(201).json(worker);
    } catch (error) {
        console.error("Create worker error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Delete/Deactivate a worker
 * DELETE /api/admin/worker/:id
 */
exports.deleteWorker = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if worker has assigned tickets
        const assignedTickets = await prisma.ticket.count({ where: { workerId: id } });
        if (assignedTickets > 0) {
            return res.status(400).json({ error: "Cannot delete worker with assigned tickets. Reassign tickets first." });
        }

        await prisma.user.delete({ where: { id } });
        res.status(200).json({ message: "Worker deleted successfully" });
    } catch (error) {
        console.error("Delete worker error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Reset worker password
 * PATCH /api/admin/reset-password/:id
 */
exports.resetWorkerPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: "New password must be at least 6 characters" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id },
            data: { password: hashedPassword }
        });

        res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

