const prisma = require('../config/prisma');

<<<<<<< HEAD
// Get worker assigned tickets
exports.getWorkerTickets = async (req, res) => {
    try {

=======
exports.getWorkerTickets = async (req, res) => {
    try {
>>>>>>> 6b81175beaeaf12430d05c36ab1ef9e6e9a17528
        const workerId = req.user.userId;

        const tickets = await prisma.ticket.findMany({
            where: {
                OR: [
                    { planningWorkerId: workerId },
                    { installationWorkerId: workerId }
<<<<<<< HEAD
                ]
=======
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
>>>>>>> 6b81175beaeaf12430d05c36ab1ef9e6e9a17528
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        res.status(200).json(tickets);
<<<<<<< HEAD

=======
>>>>>>> 6b81175beaeaf12430d05c36ab1ef9e6e9a17528
    } catch (error) {
        console.error("Worker tickets error:", error);
        res.status(500).json({ error: "Failed to fetch worker tickets" });
    }
};
