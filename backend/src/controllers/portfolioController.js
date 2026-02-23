const prisma = require('../config/prisma');

// Get all work photos
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
