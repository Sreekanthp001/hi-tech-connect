const prisma = require('../config/prisma');

// Get worker assigned tickets
exports.getWorkerTickets = async (req, res) => {
    try {

        const workerId = req.user.userId;

        const tickets = await prisma.ticket.findMany({
            where: {
                OR: [
                    { planningWorkerId: workerId },
                    { installationWorkerId: workerId }
                ]
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        res.status(200).json(tickets);

    } catch (error) {
        console.error("Worker tickets error:", error);
        res.status(500).json({ error: "Failed to fetch worker tickets" });
    }
};
