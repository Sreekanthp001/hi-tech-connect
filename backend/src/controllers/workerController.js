const prisma = require('../config/prisma');

exports.getWorkerTickets = async (req, res) => {
  try {
    const workerId = req.user.userId;
    const tickets = await prisma.ticket.findMany({
      where: {
        OR: [
          { planningWorkerId: workerId },
          { installationWorkerId: workerId },
          { supportWorker1Id: workerId },
          { supportWorker2Id: workerId },
          { assignments: { some: { workerId: workerId } } }
        ],
        NOT: { status: "COMPLETED" }
      },
      include: {
        ticketPhotos: true,
        assignments: {
          include: {
            worker: { select: { id: true, name: true, email: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    res.set("Cache-Control", "no-store, no-cache, must-revalidate");
    res.json(tickets);
  } catch (error) {
    console.error("Worker ticket fetch error:", error);
    res.status(500).json({ error: "Failed to fetch worker tickets" });
  }
};
