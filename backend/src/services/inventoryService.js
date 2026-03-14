const prisma = require('../config/prisma');

class InventoryService {
    /**
     * Add stock to the inventory (IN transaction)
     */
    async addStock(data) {
        const { productId, quantity, referenceType, notes, createdByAdmin = true } = data;
        const transaction = await prisma.stockTransaction.create({
            data: {
                productId, quantity,
                transactionType: 'IN',
                referenceType: referenceType || 'PURCHASE',
                notes, createdByAdmin
            },
            include: { product: true }
        });
        await prisma.productMaster.update({
            where: { id: productId },
            data: { currentStock: { increment: quantity } }
        });
        return transaction;
    }

    /**
     * Issue material to a worker (OUT transaction)
     */
    async issueMaterial(data) {
        const { productId, quantity, workerId, ticketId, notes, createdByAdmin = true, serialIds = [] } = data;

        // 1. Check current stock
        const currentStock = await this.getCurrentStock(productId);
        if (currentStock < quantity) {
            throw new Error(`Insufficient stock. Available: ${currentStock}, Required: ${quantity}`);
        }

        // 2. Wrap in transaction to ensure serial consistency
        return await prisma.$transaction(async (tx) => {
            if (serialIds && serialIds.length > 0) {
                if (serialIds.length !== quantity) {
                    throw new Error("Quantity must match the number of selected serial numbers.");
                }

                const serials = await tx.productSerial.findMany({ where: { id: { in: serialIds } } });
                if (serials.length !== quantity || serials.some(s => s.status !== 'IN_STOCK')) {
                    throw new Error("Invalid or already issued serial numbers selected.");
                }

                // Update serials and create assignments
                await tx.productSerial.updateMany({
                    where: { id: { in: serialIds } },
                    data: { status: 'ISSUED_TO_WORKER' }
                });

                const assignments = serialIds.map(sid => ({
                    ticketId,
                    productId,
                    serialId: sid,
                    workerId
                }));
                await tx.ticketSerialAssignment.createMany({ data: assignments });
            }

            // Create OUT transaction
            const outTx = await tx.stockTransaction.create({
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
            await tx.productMaster.update({ where: { id: productId }, data: { currentStock: { decrement: quantity } } });
            
            return outTx;
        });
    }

    /**
     * Calculate current stock for a product: SUM(IN) - SUM(OUT)
     * Optional: Pass transaction client (tx) for use within a transaction
     */
    async getCurrentStock(productId, tx = prisma) {
        const transactions = await tx.stockTransaction.findMany({
            where: { productId },
            select: {
                quantity: true,
                transactionType: true
            }
        });

        return transactions.reduce((acc, curr) => {
            if (curr.transactionType === 'IN') return acc + curr.quantity;
            if (curr.transactionType === 'OUT') return acc - curr.quantity;
            return acc;
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
                ticket: { select: { title: true, clientName: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Add material to a ticket (Automatic OUT transaction)
     */
    async addMaterialToTicket(data) {
        const { ticketId, productId, quantity, workerId, notes } = data;

        // 1. Get product details
        const product = await prisma.productMaster.findUnique({ where: { id: productId } });
        if (!product) throw new Error("Product not found");

        // 2. Wrap in transaction
        return await prisma.$transaction(async (tx) => {
            // 3. Stock check inside transaction
            const currentStock = await this.getCurrentStock(productId, tx);
            if (currentStock < quantity) {
                throw new Error(`Insufficient stock for ${product.name}. Available: ${currentStock}`);
            }

            // 4. Create TicketItem
            const ticketItem = await tx.ticketItem.create({
                data: {
                    ticketId,
                    productId,
                    itemName: product.name,
                    quantity,
                    price: 0
                }
            });

            // 5. Create StockTransaction (OUT)
            await tx.stockTransaction.create({
                data: {
                    productId,
                    quantity,
                    transactionType: 'OUT',
                    referenceType: 'TICKET_USAGE',
                    workerId,
                    ticketId,
                    notes: notes || `Used in ticket: ${ticketId}`
                }
            });

            return ticketItem;
        });
    }

    async removeMaterialFromTicket(data) {
        const { ticketId, ticketItemId, workerId } = data;

        // 1. Get ticket item to know what was used
        const ticketItem = await prisma.ticketItem.findUnique({
            where: { id: ticketItemId }
        });
        if (!ticketItem) throw new Error("Ticket item not found");

        // 2. Find the product ID correctly
        const productId = ticketItem.productId;
        if (!productId) {
            // Fallback for legacy items without productId
            const product = await prisma.productMaster.findFirst({
                where: { name: ticketItem.itemName }
            });
            if (!product) throw new Error("Original product not found in master list");
            ticketItem.productId = product.id;
        }

        // 3. Start transaction
        return await prisma.$transaction(async (tx) => {
            // Delete TicketItem
            await tx.ticketItem.delete({ where: { id: ticketItemId } });

            // Create StockTransaction (IN/RETURN)
            await tx.stockTransaction.create({
                data: {
                    productId: ticketItem.productId,
                    quantity: ticketItem.quantity,
                    transactionType: 'IN',
                    referenceType: 'RETURN_FROM_TICKET',
                    workerId,
                    ticketId,
                    notes: `Returned from ticket: ${ticketId}`
                }
            });

            return { success: true };
        });
    }

    /**
     * Return unused serial materials to store
     */
    async returnSerialMaterials(data) {
        const { ticketId, serialIds, workerId, notes } = data;
        
        if (!serialIds || serialIds.length === 0) throw new Error("No serial numbers provided to return.");

        return await prisma.$transaction(async (tx) => {
            const serials = await tx.productSerial.findMany({ 
                where: { id: { in: serialIds } },
                include: { product: true } 
            });
            
            if (serials.length !== serialIds.length || serials.some(s => s.status !== 'ISSUED_TO_WORKER')) {
                throw new Error("Invalid or not-issued serial numbers selected for return.");
            }

            // Update serials to IN_STOCK
            await tx.productSerial.updateMany({
                where: { id: { in: serialIds } },
                data: { status: 'IN_STOCK' }
            });
            
            // Mark assignment as returned
            await tx.ticketSerialAssignment.updateMany({
                where: { ticketId, serialId: { in: serialIds }, returnedAt: null },
                data: { returnedAt: new Date() }
            });

            // Group by product to create stock transactions
            const productCounts = {};
            serials.forEach(s => {
                productCounts[s.productId] = (productCounts[s.productId] || 0) + 1;
            });

            for (const [productId, quantity] of Object.entries(productCounts)) {
                await tx.stockTransaction.create({
                    data: {
                        productId,
                        quantity,
                        transactionType: 'IN',
                        referenceType: 'RETURN_FROM_TICKET',
                        workerId,
                        ticketId,
                        notes: notes || `Returned unused serials from ticket: ${ticketId}`
                    }
                });
                await tx.productMaster.update({
                    where: { id: productId },
                    data: { currentStock: { increment: quantity } }
                });
            }

            return { success: true, returnedCount: serialIds.length };
        });
    }

    /**
     * Map assigned serials to CustomerAsset upon ticket completion
     */
    async installSerialMaterials(ticketId, customerPhone) {
        return await prisma.$transaction(async (tx) => {
            const assignments = await tx.ticketSerialAssignment.findMany({
                where: { ticketId, returnedAt: null, installedAt: null }
            });

            if (assignments.length === 0) return { success: true, count: 0 };

            const serialIds = assignments.map(a => a.serialId);

            // Update assignments
            await tx.ticketSerialAssignment.updateMany({
                where: { id: { in: assignments.map(a => a.id) } },
                data: { installedAt: new Date() }
            });

            // Update serials to INSTALLED
            await tx.productSerial.updateMany({
                where: { id: { in: serialIds } },
                data: { status: 'INSTALLED' }
            });

            // Create Customer assets
            const assets = assignments.map(a => ({
                customerPhone,
                productId: a.productId,
                serialId: a.serialId,
                ticketId,
                installationDate: new Date(),
                status: 'ACTIVE'
            }));

            await tx.customerAsset.createMany({ data: assets });

            return { success: true, count: assets.length };
        });
    }

    /**
     * Get Daily Usage Report
     */
    async getDailyUsageReport() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const transactions = await prisma.stockTransaction.findMany({
            where: {
                transactionType: 'OUT',
                createdAt: { gte: today }
            },
            include: {
                product: true,
                worker: { select: { name: true } },
                ticket: { select: { clientName: true, title: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Group by product for summarized view
        const summary = {};
        transactions.forEach(t => {
            if (!summary[t.product.name]) {
                summary[t.product.name] = 0;
            }
            summary[t.product.name] += t.quantity;
        });

        return {
            date: today,
            transactions,
            summarized: Object.entries(summary).map(([name, qty]) => ({ name, quantity: qty })),
            totalQuantity: transactions.reduce((acc, curr) => acc + curr.quantity, 0)
        };
    }
}

module.exports = new InventoryService();
