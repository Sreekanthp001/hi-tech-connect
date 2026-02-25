const prisma = require('../config/prisma');

/**
 * Get all worker finances
 * GET /api/admin/worker-finance
 */
exports.getWorkerFinances = async (req, res) => {
    try {
        const workers = await prisma.user.findMany({
            where: { role: 'WORKER' },
            select: {
                id: true,
                name: true,
                designation: true,
                finance: true
            }
        });

        const result = workers.map(w => {
            const f = w.finance || { baseSalary: 0, totalEarned: 0, totalAdvance: 0 };
            const netPayable = (f.totalEarned || 0) + (f.baseSalary || 0) - (f.totalAdvance || 0);
            return {
                workerId: w.id,
                name: w.name,
                designation: w.designation || 'Technician',
                baseSalary: f.baseSalary || 0,
                totalEarned: f.totalEarned || 0,
                totalAdvance: f.totalAdvance || 0,
                netPayable
            };
        });

        res.status(200).json(result);
    } catch (error) {
        console.error("Get worker finances error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Update worker base salary
 * PATCH /api/admin/worker-finance/:workerId
 */
exports.updateWorkerFinance = async (req, res) => {
    const { workerId } = req.params;
    const { baseSalary, designation } = req.body;

    try {
        // Update user designation if provided
        if (designation !== undefined) {
            await prisma.user.update({
                where: { id: workerId },
                data: { designation }
            });
        }

        // Upsert finance record
        const finance = await prisma.workerFinance.upsert({
            where: { workerId },
            update: { baseSalary: parseFloat(baseSalary) },
            create: {
                workerId,
                baseSalary: parseFloat(baseSalary),
                totalEarned: 0,
                totalAdvance: 0
            }
        });

        res.status(200).json(finance);
    } catch (error) {
        console.error("Update worker finance error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Add worker advance
 * POST /api/admin/worker-advance
 */
exports.addWorkerAdvance = async (req, res) => {
    const { workerId, amount, reason } = req.body;

    if (!workerId || !amount) {
        return res.status(400).json({ error: "Worker ID and amount are required" });
    }

    try {
        const advanceAmount = parseFloat(amount);

        // Transaction to add advance and update totalAdvance in finance
        const result = await prisma.$transaction(async (tx) => {
            const advance = await tx.workerAdvance.create({
                data: {
                    workerId,
                    amount: advanceAmount,
                    reason
                }
            });

            await tx.workerFinance.upsert({
                where: { workerId },
                update: {
                    totalAdvance: { increment: advanceAmount }
                },
                create: {
                    workerId,
                    totalAdvance: advanceAmount,
                    totalEarned: 0,
                    baseSalary: 0
                }
            });

            return advance;
        });

        res.status(201).json(result);
    } catch (error) {
        console.error("Add worker advance error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
