const prisma = require('../config/prisma');

// Autocomplete search for products
exports.search = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 1) {
            return res.status(200).json([]);
        }

        const products = await prisma.productMaster.findMany({
            where: {
                AND: [
                    { isActive: true },
                    {
                        OR: [
                            { name: { contains: q, mode: 'insensitive' } },
                            { brand: { contains: q, mode: 'insensitive' } },
                            { category: { contains: q, mode: 'insensitive' } }
                        ]
                    }
                ]
            },
            take: 10
        });

        res.status(200).json(products);
    } catch (error) {
        console.error("Product search error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


// Get all products (Admin)
exports.getAll = async (req, res) => {
    try {
        const products = await prisma.productMaster.findMany({
            orderBy: { name: 'asc' }
        });
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

// Create product
exports.create = async (req, res) => {
    try {
        const product = await prisma.productMaster.create({
            data: req.body
        });
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

// Update product
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await prisma.productMaster.update({
            where: { id },
            data: req.body
        });
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

// Delete product
exports.delete = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if there are any transactions for this product
        const txCount = await prisma.stockTransaction.count({ where: { productId: id } });
        
        if (txCount > 0) {
            // Cannot delete if transactions exist, just deactivate
            await prisma.productMaster.update({
                where: { id },
                data: { isActive: false }
            });
            return res.status(200).json({ message: "Product has transaction history and cannot be deleted. It has been marked as inactive." });
        }

        await prisma.productMaster.delete({ where: { id } });
        res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
        console.error("Delete product error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.catalogSearch = exports.search;
