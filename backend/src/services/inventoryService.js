const prisma = require('../config/prisma');

class InventoryService {
    /**
     * Add stock to the inventory (IN transaction)
     */
    async addStock(data) {
        const { productId, quantity, referenceType, notes, createdByAdmin = true } = data;

        return await prisma.stockTransaction.create({
            data: {
                productId,
                quantity,
                transactionType: 'IN',
                referenceType: referenceType || 'PURCHASE',
                notes,
                createdByAdmin
            },
            include: {
                product: true
            }
        });
    }

    /**
     * Issue material to a worker (OUT transaction)
     */
    async issueMaterial(data) {
        const { productId, quantity, workerId, ticketId, notes, createdByAdmin = true } = data;

        // 1. Check current stock
        const currentStock = await this.getCurrentStock(productId);
        if (currentStock < quantity) {
            throw new Error(`Insufficient stock. Available: ${currentStock}, Required: ${quantity}`);
        }

        // 2. Create OUT transaction
        return await prisma.stockTransaction.create({
            data: {
                productId,
                quantity,
                transactionType: 'OUT',
                referenceType: 'WORKER_ISSUE',
                workerId,
                ticketId,
                notes,
                createdByAdmin
            },
            include: {
                product: true,
                worker: {
                    select: { id: true, name: true }
                }
            }
        });
    }

    /**
     * Calculate current stock for a product: SUM(IN) - SUM(OUT)
     */
    async getCurrentStock(productId) {
        const transactions = await prisma.stockTransaction.findMany({
            where: { productId },
            select: {
                quantity: true,
                transactionType: true
            }
        });

        return transactions.reduce((acc, curr) => {
            if (curr.transactionType === 'IN') return acc + curr.quantity;
            if (curr.transactionType === 'OUT') return acc - curr.quantity;
            return acc; // For ADJUSTMENT, we might need more complex logic based on sign
        }, 0);
    }

    /**
     * Get low stock alerts
     */
    async getLowStockAlerts() {
        const products = await prisma.productMaster.findMany({
            where: { isActive: true },
            include: {
                transactions: {
                    select: { quantity: true, transactionType: true }
                }
            }
        });

        return products
            .map(product => {
                const stock = product.transactions.reduce((acc, curr) => {
                    if (curr.transactionType === 'IN') return acc + curr.quantity;
                    if (curr.transactionType === 'OUT') return acc - curr.quantity;
                    return acc;
                }, 0);
                return { ...product, currentStock: stock };
            })
            .filter(p => p.currentStock <= p.minimumStockAlert);
    }

    /**
     * Get Inventory Dashboard Stats
     */
    async getDashboardStats() {
        const products = await prisma.productMaster.findMany({
            where: { isActive: true },
            include: {
                transactions: {
                    select: { quantity: true, transactionType: true, createdAt: true, workerId: true }
                }
            }
        });

        const stats = {
            totalProducts: products.length,
            lowStockCount: 0,
            monthlyUsage: 0,
            workerUsage: {}
        };

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        products.forEach(product => {
            const stock = product.transactions.reduce((acc, curr) => {
                if (curr.transactionType === 'IN') return acc + curr.quantity;
                if (curr.transactionType === 'OUT') return acc - curr.quantity;
                return acc;
            }, 0);

            if (stock <= product.minimumStockAlert) {
                stats.lowStockCount++;
            }

            product.transactions.forEach(t => {
                const tDate = new Date(t.createdAt);
                if (t.transactionType === 'OUT' && tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
                    stats.monthlyUsage += t.quantity;

                    if (t.workerId) {
                        stats.workerUsage[t.workerId] = (stats.workerUsage[t.workerId] || 0) + t.quantity;
                    }
                }
            });
        });

        return stats;
    }

    /**
     * Get transaction history for a product
     */
    async getProductHistory(productId) {
        return await prisma.stockTransaction.findMany({
            where: { productId },
            include: {
                worker: { select: { name: true } },
                ticket: { select: { title: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
}

module.exports = new InventoryService();
