const prisma = require('../config/prisma');

exports.getWorkerTickets = async (req, res) => {
    try {
        const workerId = req.user.userId;

        const tickets = await prisma.ticket.findMany({
            where: {
                OR: [
                    { planningWorkerId: workerId },
                    { installationWorkerId: workerId }
                ],
                status: {
                    not: "WORK_COMPLETED"
                }
            },
            include: {
                ticketPhotos: true,
                assignments: {
                    include: {
                        worker: { select: { id: true, name: true } }
                    }
                }
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
