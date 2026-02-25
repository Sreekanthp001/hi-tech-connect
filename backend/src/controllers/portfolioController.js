const prisma = require('../config/prisma');

// AUTO-SYNC: Completed tickets with before/after photos (Public)
exports.getPublicPortfolio = async (req, res) => {
    try {
        const completedTickets = await prisma.ticket.findMany({
            where: {
                status: 'COMPLETED',
                ticketPhotos: { some: {} }        // only tickets that have at least 1 photo
            },
            orderBy: { updatedAt: 'desc' },
            take: 50,
            select: {
                id: true,
                title: true,
                type: true,
                address: true,
                updatedAt: true,
                clientName: true,                 // first name only shown in frontend
                assignments: {
                    select: {
                        isPrimary: true,
                        worker: { select: { name: true } }
                    }
                },
                ticketPhotos: {
                    select: {
                        id: true,
                        type: true,
                        imageUrl: true,
                        uploadedBy: true,
                        worker: { select: { name: true } }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        // Shape the response: group photos by type, build technician list
        const portfolio = completedTickets.map(t => {
            const beforePhotos = t.ticketPhotos.filter(p => p.type === 'BEFORE');
            const afterPhotos = t.ticketPhotos.filter(p => p.type === 'AFTER');
            const techs = t.assignments.map(a => a.worker.name);

            return {
                id: t.id,
                title: t.title,
                type: t.type,
                location: t.address,
                completedAt: t.updatedAt,
                technicians: techs,
                beforePhotos,
                afterPhotos
            };
        });

        res.json(portfolio);
    } catch (error) {
        console.error('getPublicPortfolio error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get all work photos (legacy WorkPhoto model)
exports.getWorkPhotos = async (req, res) => {
    try {
        const photos = await prisma.workPhoto.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(photos);
    } catch (error) {
        console.error("Get work photos error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Create a work photo (Admin only)
exports.createWorkPhoto = async (req, res) => {
    try {
        const { title, imageUrl } = req.body;

        if (!title || !imageUrl) {
            return res.status(400).json({ error: "Title and Image URL are required" });
        }

        const photo = await prisma.workPhoto.create({
            data: { title, imageUrl }
        });

        res.status(201).json(photo);
    } catch (error) {
        console.error("Create work photo error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Delete a work photo (Admin only)
exports.deleteWorkPhoto = async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.workPhoto.delete({
            where: { id }
        });

        res.json({ message: "Work photo deleted successfully" });
    } catch (error) {
        console.error("Delete work photo error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
