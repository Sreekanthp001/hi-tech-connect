const inventoryService = require('../services/inventoryService');
const prisma = require('../config/prisma');

// Add Stock (IN)
exports.addStock = async (req, res) => {
    try {
        const transaction = await inventoryService.addStock(req.body);
        res.status(201).json(transaction);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Issue Material (OUT)
exports.issueMaterial = async (req, res) => {
    try {
        const transaction = await inventoryService.issueMaterial(req.body);
        res.status(201).json(transaction);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get Dashboard Stats
exports.getDashboard = async (req, res) => {
    try {
        const stats = await inventoryService.getDashboardStats();
        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

// Get Product History
exports.getHistory = async (req, res) => {
    try {
        const { productId } = req.params;
        const history = await inventoryService.getProductHistory(productId);
        const currentStock = await inventoryService.getCurrentStock(productId);
        res.status(200).json({ history, currentStock });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

// Get Low Stock Alerts
exports.getAlerts = async (req, res) => {
    try {
        const alerts = await inventoryService.getLowStockAlerts();
        res.status(200).json(alerts);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

// Get Daily Usage Report
exports.getReport = async (req, res) => {
    try {
        const report = await inventoryService.getDailyUsageReport();
        res.status(200).json(report);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

// Add Material to Ticket
exports.addTicketMaterial = async (req, res) => {
    try {
        const item = await inventoryService.addMaterialToTicket(req.body);
        res.status(201).json(item);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Remove Material from Ticket
exports.removeTicketMaterial = async (req, res) => {
    try {
        const result = await inventoryService.removeMaterialFromTicket(req.body);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// List all workers for issue dropdown
exports.getWorkers = async (req, res) => {
    try {
        const workers = await prisma.user.findMany({
            where: { role: 'WORKER' },
            select: { id: true, name: true, email: true }
        });
        res.status(200).json(workers);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};


exports.deleteProduct = async (req, res) => {
    try {
        await prisma.stockTransaction.deleteMany({ where: { productId: req.params.id } });
        await prisma.ticketMaterial.deleteMany({ where: { productId: req.params.id } });
        await prisma.productMaster.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.downloadReport = async (req, res) => {
    try {
        const { from, to, format } = req.query;
        const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const toDate = to ? new Date(to + 'T23:59:59') : new Date();

        // Get all products with their transactions in date range
        const products = await prisma.productMaster.findMany({
            where: { isActive: true },
            include: {
                transactions: {
                    where: { createdAt: { gte: fromDate, lte: toDate } },
                    include: { worker: { select: { name: true } } },
                    orderBy: { createdAt: 'desc' }
                }
            },
            orderBy: { name: 'asc' }
        });

        if (format === 'excel') {
            const ExcelJS = require('exceljs');
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('Inventory Report');

            // Header
            sheet.mergeCells('A1:G1');
            sheet.getCell('A1').value = `Inventory Report: ${fromDate.toDateString()} - ${toDate.toDateString()}`;
            sheet.getCell('A1').font = { bold: true, size: 14 };

            sheet.addRow([]);
            sheet.addRow(['Item Name', 'Category', 'Current Stock', 'Unit', 'Total IN', 'Total OUT', 'Low Stock?']);
            sheet.getRow(3).font = { bold: true };
            sheet.getRow(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3E4FF' } };

            products.forEach(p => {
                const totalIn = p.transactions.filter(t => t.transactionType === 'IN').reduce((a, b) => a + b.quantity, 0);
                const totalOut = p.transactions.filter(t => t.transactionType === 'OUT').reduce((a, b) => a + b.quantity, 0);
                const isLow = p.currentStock <= p.minimumStockAlert && p.currentStock > 0;
                const row = sheet.addRow([p.name, p.category, p.currentStock, p.unitType, totalIn, totalOut, isLow ? 'YES' : 'No']);
                if (isLow) row.getCell(7).font = { color: { argb: 'FFFF0000' }, bold: true };
                if (p.currentStock === 0) row.getCell(3).font = { color: { argb: 'FFFF6600' } };
            });

            // Transaction detail sheet
            const detailSheet = workbook.addWorksheet('Transaction Details');
            detailSheet.addRow(['Date', 'Item', 'Type', 'Quantity', 'Unit', 'Reference', 'Worker']);
            detailSheet.getRow(1).font = { bold: true };
            detailSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3E4FF' } };

            products.forEach(p => {
                p.transactions.forEach(t => {
                    detailSheet.addRow([
                        new Date(t.createdAt).toLocaleString('en-IN'),
                        p.name, t.transactionType, t.quantity, p.unitType,
                        t.referenceType, t.worker?.name || 'Admin'
                    ]);
                });
            });

            [sheet, detailSheet].forEach(s => {
                s.columns.forEach(col => { col.width = 20; });
            });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=inventory-report-${from||'all'}.xlsx`);
            await workbook.xlsx.write(res);
            res.end();

        } else {
            // PDF
            const PDFDocument = require('pdfkit');
            const doc = new PDFDocument({ margin: 40, size: 'A4' });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=inventory-report-${from||'all'}.pdf`);
            doc.pipe(res);

            doc.fontSize(18).font('Helvetica-Bold').text('Hi-Tech Connect', { align: 'center' });
            doc.fontSize(12).font('Helvetica').text('Inventory Report', { align: 'center' });
            doc.fontSize(10).text(`Period: ${fromDate.toDateString()} to ${toDate.toDateString()}`, { align: 'center' });
            doc.moveDown();

            // Summary table
            doc.fontSize(11).font('Helvetica-Bold').text('Stock Summary');
            doc.moveDown(0.5);

            const colWidths = [180, 80, 70, 60, 60, 60];
            const headers = ['Item Name', 'Category', 'Current Stock', 'IN', 'OUT', 'Low?'];
            let x = 40, y = doc.y;

            // Header row
            doc.fontSize(9).font('Helvetica-Bold');
            doc.rect(x, y, 515, 18).fill('#D3E4FF').stroke();
            headers.forEach((h, i) => {
                doc.fillColor('black').text(h, x + colWidths.slice(0, i).reduce((a, b) => a + b, 0) + 3, y + 4, { width: colWidths[i] - 5 });
            });
            y += 18;

            doc.fontSize(8).font('Helvetica');
            products.forEach((p, idx) => {
                const totalIn = p.transactions.filter(t => t.transactionType === 'IN').reduce((a, b) => a + b.quantity, 0);
                const totalOut = p.transactions.filter(t => t.transactionType === 'OUT').reduce((a, b) => a + b.quantity, 0);
                const isLow = p.currentStock <= p.minimumStockAlert && p.currentStock > 0;

                if (y > 750) { doc.addPage(); y = 40; }
                if (idx % 2 === 0) doc.rect(x, y, 515, 16).fill('#F8F9FA').stroke();
                else doc.rect(x, y, 515, 16).fill('white').stroke();

                const vals = [p.name.substring(0,28), p.category, `${p.currentStock} ${p.unitType}`, totalIn, totalOut, isLow ? 'LOW' : 'OK'];
                vals.forEach((v, i) => {
                    const color = (i === 2 && p.currentStock === 0) ? 'orange' : (i === 5 && isLow) ? 'red' : 'black';
                    doc.fillColor(color).text(String(v), x + colWidths.slice(0, i).reduce((a, b) => a + b, 0) + 3, y + 3, { width: colWidths[i] - 5 });
                });
                y += 16;
            });

            doc.end();
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

exports.downloadReport = async (req, res) => {
    try {
        const { from, to, format } = req.query;
        const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const toDate = to ? new Date(to + 'T23:59:59') : new Date();

        // Get all products with their transactions in date range
        const products = await prisma.productMaster.findMany({
            where: { isActive: true },
            include: {
                transactions: {
                    where: { createdAt: { gte: fromDate, lte: toDate } },
                    include: { worker: { select: { name: true } } },
                    orderBy: { createdAt: 'desc' }
                }
            },
            orderBy: { name: 'asc' }
        });

        if (format === 'excel') {
            const ExcelJS = require('exceljs');
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('Inventory Report');

            // Header
            sheet.mergeCells('A1:G1');
            sheet.getCell('A1').value = `Inventory Report: ${fromDate.toDateString()} - ${toDate.toDateString()}`;
            sheet.getCell('A1').font = { bold: true, size: 14 };

            sheet.addRow([]);
            sheet.addRow(['Item Name', 'Category', 'Current Stock', 'Unit', 'Total IN', 'Total OUT', 'Low Stock?']);
            sheet.getRow(3).font = { bold: true };
            sheet.getRow(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3E4FF' } };

            products.forEach(p => {
                const totalIn = p.transactions.filter(t => t.transactionType === 'IN').reduce((a, b) => a + b.quantity, 0);
                const totalOut = p.transactions.filter(t => t.transactionType === 'OUT').reduce((a, b) => a + b.quantity, 0);
                const isLow = p.currentStock <= p.minimumStockAlert && p.currentStock > 0;
                const row = sheet.addRow([p.name, p.category, p.currentStock, p.unitType, totalIn, totalOut, isLow ? 'YES' : 'No']);
                if (isLow) row.getCell(7).font = { color: { argb: 'FFFF0000' }, bold: true };
                if (p.currentStock === 0) row.getCell(3).font = { color: { argb: 'FFFF6600' } };
            });

            // Transaction detail sheet
            const detailSheet = workbook.addWorksheet('Transaction Details');
            detailSheet.addRow(['Date', 'Item', 'Type', 'Quantity', 'Unit', 'Reference', 'Worker']);
            detailSheet.getRow(1).font = { bold: true };
            detailSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3E4FF' } };

            products.forEach(p => {
                p.transactions.forEach(t => {
                    detailSheet.addRow([
                        new Date(t.createdAt).toLocaleString('en-IN'),
                        p.name, t.transactionType, t.quantity, p.unitType,
                        t.referenceType, t.worker?.name || 'Admin'
                    ]);
                });
            });

            [sheet, detailSheet].forEach(s => {
                s.columns.forEach(col => { col.width = 20; });
            });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=inventory-report-${from||'all'}.xlsx`);
            await workbook.xlsx.write(res);
            res.end();

        } else {
            // PDF
            const PDFDocument = require('pdfkit');
            const doc = new PDFDocument({ margin: 40, size: 'A4' });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=inventory-report-${from||'all'}.pdf`);
            doc.pipe(res);

            doc.fontSize(18).font('Helvetica-Bold').text('Hi-Tech Connect', { align: 'center' });
            doc.fontSize(12).font('Helvetica').text('Inventory Report', { align: 'center' });
            doc.fontSize(10).text(`Period: ${fromDate.toDateString()} to ${toDate.toDateString()}`, { align: 'center' });
            doc.moveDown();

            // Summary table
            doc.fontSize(11).font('Helvetica-Bold').text('Stock Summary');
            doc.moveDown(0.5);

            const colWidths = [180, 80, 70, 60, 60, 60];
            const headers = ['Item Name', 'Category', 'Current Stock', 'IN', 'OUT', 'Low?'];
            let x = 40, y = doc.y;

            // Header row
            doc.fontSize(9).font('Helvetica-Bold');
            doc.rect(x, y, 515, 18).fill('#D3E4FF').stroke();
            headers.forEach((h, i) => {
                doc.fillColor('black').text(h, x + colWidths.slice(0, i).reduce((a, b) => a + b, 0) + 3, y + 4, { width: colWidths[i] - 5 });
            });
            y += 18;

            doc.fontSize(8).font('Helvetica');
            products.forEach((p, idx) => {
                const totalIn = p.transactions.filter(t => t.transactionType === 'IN').reduce((a, b) => a + b.quantity, 0);
                const totalOut = p.transactions.filter(t => t.transactionType === 'OUT').reduce((a, b) => a + b.quantity, 0);
                const isLow = p.currentStock <= p.minimumStockAlert && p.currentStock > 0;

                if (y > 750) { doc.addPage(); y = 40; }
                if (idx % 2 === 0) doc.rect(x, y, 515, 16).fill('#F8F9FA').stroke();
                else doc.rect(x, y, 515, 16).fill('white').stroke();

                const vals = [p.name.substring(0,28), p.category, `${p.currentStock} ${p.unitType}`, totalIn, totalOut, isLow ? 'LOW' : 'OK'];
                vals.forEach((v, i) => {
                    const color = (i === 2 && p.currentStock === 0) ? 'orange' : (i === 5 && isLow) ? 'red' : 'black';
                    doc.fillColor(color).text(String(v), x + colWidths.slice(0, i).reduce((a, b) => a + b, 0) + 3, y + 3, { width: colWidths[i] - 5 });
                });
                y += 16;
            });

            doc.end();
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

exports.downloadReport = async (req, res) => {
    try {
        const { from, to, format } = req.query;
        const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const toDate = to ? new Date(to + 'T23:59:59') : new Date();

        // Get all products with their transactions in date range
        const products = await prisma.productMaster.findMany({
            where: { isActive: true },
            include: {
                transactions: {
                    where: { createdAt: { gte: fromDate, lte: toDate } },
                    include: { worker: { select: { name: true } } },
                    orderBy: { createdAt: 'desc' }
                }
            },
            orderBy: { name: 'asc' }
        });

        if (format === 'excel') {
            const ExcelJS = require('exceljs');
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('Inventory Report');

            // Header
            sheet.mergeCells('A1:G1');
            sheet.getCell('A1').value = `Inventory Report: ${fromDate.toDateString()} - ${toDate.toDateString()}`;
            sheet.getCell('A1').font = { bold: true, size: 14 };

            sheet.addRow([]);
            sheet.addRow(['Item Name', 'Category', 'Current Stock', 'Unit', 'Total IN', 'Total OUT', 'Low Stock?']);
            sheet.getRow(3).font = { bold: true };
            sheet.getRow(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3E4FF' } };

            products.forEach(p => {
                const totalIn = p.transactions.filter(t => t.transactionType === 'IN').reduce((a, b) => a + b.quantity, 0);
                const totalOut = p.transactions.filter(t => t.transactionType === 'OUT').reduce((a, b) => a + b.quantity, 0);
                const isLow = p.currentStock <= p.minimumStockAlert && p.currentStock > 0;
                const row = sheet.addRow([p.name, p.category, p.currentStock, p.unitType, totalIn, totalOut, isLow ? 'YES' : 'No']);
                if (isLow) row.getCell(7).font = { color: { argb: 'FFFF0000' }, bold: true };
                if (p.currentStock === 0) row.getCell(3).font = { color: { argb: 'FFFF6600' } };
            });

            // Transaction detail sheet
            const detailSheet = workbook.addWorksheet('Transaction Details');
            detailSheet.addRow(['Date', 'Item', 'Type', 'Quantity', 'Unit', 'Reference', 'Worker']);
            detailSheet.getRow(1).font = { bold: true };
            detailSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3E4FF' } };

            products.forEach(p => {
                p.transactions.forEach(t => {
                    detailSheet.addRow([
                        new Date(t.createdAt).toLocaleString('en-IN'),
                        p.name, t.transactionType, t.quantity, p.unitType,
                        t.referenceType, t.worker?.name || 'Admin'
                    ]);
                });
            });

            [sheet, detailSheet].forEach(s => {
                s.columns.forEach(col => { col.width = 20; });
            });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=inventory-report-${from||'all'}.xlsx`);
            await workbook.xlsx.write(res);
            res.end();

        } else {
            // PDF
            const PDFDocument = require('pdfkit');
            const doc = new PDFDocument({ margin: 40, size: 'A4' });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=inventory-report-${from||'all'}.pdf`);
            doc.pipe(res);

            doc.fontSize(18).font('Helvetica-Bold').text('Hi-Tech Connect', { align: 'center' });
            doc.fontSize(12).font('Helvetica').text('Inventory Report', { align: 'center' });
            doc.fontSize(10).text(`Period: ${fromDate.toDateString()} to ${toDate.toDateString()}`, { align: 'center' });
            doc.moveDown();

            // Summary table
            doc.fontSize(11).font('Helvetica-Bold').text('Stock Summary');
            doc.moveDown(0.5);

            const colWidths = [180, 80, 70, 60, 60, 60];
            const headers = ['Item Name', 'Category', 'Current Stock', 'IN', 'OUT', 'Low?'];
            let x = 40, y = doc.y;

            // Header row
            doc.fontSize(9).font('Helvetica-Bold');
            doc.rect(x, y, 515, 18).fill('#D3E4FF').stroke();
            headers.forEach((h, i) => {
                doc.fillColor('black').text(h, x + colWidths.slice(0, i).reduce((a, b) => a + b, 0) + 3, y + 4, { width: colWidths[i] - 5 });
            });
            y += 18;

            doc.fontSize(8).font('Helvetica');
            products.forEach((p, idx) => {
                const totalIn = p.transactions.filter(t => t.transactionType === 'IN').reduce((a, b) => a + b.quantity, 0);
                const totalOut = p.transactions.filter(t => t.transactionType === 'OUT').reduce((a, b) => a + b.quantity, 0);
                const isLow = p.currentStock <= p.minimumStockAlert && p.currentStock > 0;

                if (y > 750) { doc.addPage(); y = 40; }
                if (idx % 2 === 0) doc.rect(x, y, 515, 16).fill('#F8F9FA').stroke();
                else doc.rect(x, y, 515, 16).fill('white').stroke();

                const vals = [p.name.substring(0,28), p.category, `${p.currentStock} ${p.unitType}`, totalIn, totalOut, isLow ? 'LOW' : 'OK'];
                vals.forEach((v, i) => {
                    const color = (i === 2 && p.currentStock === 0) ? 'orange' : (i === 5 && isLow) ? 'red' : 'black';
                    doc.fillColor(color).text(String(v), x + colWidths.slice(0, i).reduce((a, b) => a + b, 0) + 3, y + 3, { width: colWidths[i] - 5 });
                });
                y += 16;
            });

            doc.end();
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// Get materials for a ticket
exports.getTicketMaterials = async (req, res) => {
    try {
        const materials = await prisma.ticketMaterial.findMany({
            where: { ticketId: req.params.ticketId },
            include: { product: { select: { name: true, unitType: true, currentStock: true } } },
            orderBy: { createdAt: 'asc' }
        });

        const assignments = await prisma.ticketSerialAssignment.findMany({
            where: { ticketId: req.params.ticketId },
            include: { serial: true }
        });
        
        const serialsByProduct = assignments.reduce((acc, assignment) => {
            if (!acc[assignment.productId]) acc[assignment.productId] = [];
            acc[assignment.productId].push(assignment.serial);
            return acc;
        }, {});

        const materialsWithSerials = materials.map(m => ({
            ...m,
            assignedSerials: serialsByProduct[m.productId] || []
        }));

        res.json(materialsWithSerials);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Add material to ticket
exports.addTicketMaterial = async (req, res) => {
    try {
        const { ticketId, productId, quantity, unitPrice, notes, serialIds } = req.body;
        // Check stock
        const product = await prisma.productMaster.findUnique({ where: { id: productId } });
        if (!product) return res.status(404).json({ error: "Product not found" });
        if (product.currentStock < quantity) return res.status(400).json({ error: `Insufficient stock. Available: ${product.currentStock} ${product.unitType}` });
        
        const result = await prisma.$transaction(async (tx) => {
            if (serialIds && serialIds.length > 0) {
                if (serialIds.length !== quantity) {
                    throw new Error("Quantity must match the number of selected serial numbers.");
                }

                const serials = await tx.productSerial.findMany({ where: { id: { in: serialIds } } });
                if (serials.length !== quantity || serials.some(s => s.status !== 'IN_STOCK')) {
                    throw new Error("Invalid or already issued serial numbers selected.");
                }

                await tx.productSerial.updateMany({
                    where: { id: { in: serialIds } },
                    data: { status: 'ISSUED_TO_WORKER' }
                });

                const assignments = serialIds.map(sid => ({
                    ticketId,
                    productId,
                    serialId: sid,
                    workerId: req.user?.id || null, 
                }));

                await tx.ticketSerialAssignment.createMany({
                    data: assignments
                });
            }

            const material = await tx.ticketMaterial.create({
                data: { ticketId, productId, quantity, unitPrice, notes, workerId: req.user?.role === 'WORKER' ? req.user.id : null },
                include: { product: { select: { name: true, unitType: true } } }
            });
            await tx.productMaster.update({ where: { id: productId }, data: { currentStock: { decrement: quantity } } });
            await tx.stockTransaction.create({
                data: { productId, quantity, transactionType: 'OUT', referenceType: 'WORKER_ISSUE', ticketId, notes: `Ticket material`, createdByAdmin: req.user?.role === 'ADMIN' }
            });
            return material;
        });

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Remove material from ticket
exports.removeTicketMaterial = async (req, res) => {
    try {
        const material = await prisma.ticketMaterial.findUnique({ where: { id: req.params.id } });
        if (!material) return res.status(404).json({ error: "Material not found" });

        await prisma.$transaction(async (tx) => {
            // Unassign serials
            const assignments = await tx.ticketSerialAssignment.findMany({
                where: { ticketId: material.ticketId, productId: material.productId }
            });

            if (assignments.length > 0) {
                const serialIds = assignments.map(a => a.serialId);
                await tx.productSerial.updateMany({
                    where: { id: { in: serialIds }, status: 'ISSUED_TO_WORKER' },
                    data: { status: 'IN_STOCK' }
                });
                await tx.ticketSerialAssignment.deleteMany({
                    where: { ticketId: material.ticketId, productId: material.productId }
                });
            }

            // Remove material
            await tx.ticketMaterial.delete({ where: { id: req.params.id } });
            // Restore stock
            await tx.productMaster.update({ where: { id: material.productId }, data: { currentStock: { increment: material.quantity } } });
            await tx.stockTransaction.create({
                data: { productId: material.productId, quantity: material.quantity, transactionType: 'IN', referenceType: 'MANUAL_ADJUSTMENT', ticketId: material.ticketId, notes: `Reverted material added to ticket`, createdByAdmin: req.user?.role === 'ADMIN' }
            });
        });

        res.json({ message: "Material removed successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getProducts = async (req, res) => {
    try {
        const products = await prisma.productMaster.findMany({
            where: { isActive: true },
            select: { id: true, name: true, unitType: true, currentStock: true, category: true },
            orderBy: { name: 'asc' }
        });
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// =============================================
// Device Serial Tracking
// =============================================

// Get serials for a product
exports.getProductSerials = async (req, res) => {
    try {
        const { productId } = req.params;
        const serials = await prisma.productSerial.findMany({
            where: { productId },
            orderBy: { createdAt: 'desc' },
            include: {
                ticketAssignments: {
                    include: { ticket: { select: { id: true, title: true } }, worker: { select: { name: true } } }
                },
                customerAssets: {
                    include: { ticket: { select: { id: true, clientName: true } } }
                }
            }
        });
        res.json(serials);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Add new serials
exports.addProductSerials = async (req, res) => {
    try {
        const { productId } = req.params;
        const { serialNumbers } = req.body; // Array of formatted strings

        if (!Array.isArray(serialNumbers) || serialNumbers.length === 0) {
            return res.status(400).json({ error: "No serial numbers provided" });
        }

        // Check if any of these serials already exist across any product
        const existingSerials = await prisma.productSerial.findMany({
            where: { serialNumber: { in: serialNumbers } }
        });

        if (existingSerials.length > 0) {
            const duplicates = existingSerials.map(s => s.serialNumber).join(', ');
            return res.status(400).json({ error: `Following serial numbers already exist: ${duplicates}` });
        }

        // Create serials
        const newSerials = await prisma.$transaction(
            serialNumbers.map(serial => prisma.productSerial.create({
                data: {
                    productId,
                    serialNumber: serial,
                    status: 'IN_STOCK' // default
                }
            }))
        );

        res.status(201).json({ message: "Serials added successfully", count: newSerials.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete a serial number
exports.deleteProductSerial = async (req, res) => {
    try {
        const { serialId } = req.params;
        
        // Prevent deleting if it's not IN_STOCK depending on rules, 
        // e.g. can't delete if INSTALLED or ISSUED
        const serial = await prisma.productSerial.findUnique({
            where: { id: serialId },
            include: { ticketAssignments: true, customerAssets: true }
        });

        if (!serial) {
            return res.status(404).json({ error: "Serial not found" });
        }

        if (serial.ticketAssignments.length > 0 || serial.customerAssets.length > 0) {
             return res.status(400).json({ error: "Cannot delete a serial number that has been issued or installed." });
        }

        await prisma.productSerial.delete({
            where: { id: serialId }
        });

        res.json({ success: true, message: "Serial deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Return assigned serials to stock
exports.returnSerials = async (req, res) => {
    try {
        const { ticketId, serialIds, notes } = req.body;
        const workerId = req.user?.id || req.user?.userId;
        const result = await inventoryService.returnSerialMaterials({ ticketId, serialIds, workerId, notes });
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Daily Serial Tracking Report
exports.getSerialTrackingReport = async (req, res) => {
    try {
        const { date } = req.query;
        let queryDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(queryDate.getFullYear(), queryDate.getMonth(), queryDate.getDate());
        const endOfDay = new Date(queryDate.getFullYear(), queryDate.getMonth(), queryDate.getDate(), 23, 59, 59);

        // Fetch assignments issued today
        const issued = await prisma.ticketSerialAssignment.findMany({
            where: { issuedAt: { gte: startOfDay, lte: endOfDay } },
            include: {
                product: { select: { name: true } },
                serial: { select: { serialNumber: true } },
                worker: { select: { name: true } },
                ticket: { select: { id: true, title: true } }
            }
        });

        // Fetch assignments installed today
        const installed = await prisma.ticketSerialAssignment.findMany({
            where: { installedAt: { gte: startOfDay, lte: endOfDay } },
            include: {
                product: { select: { name: true } },
                serial: { select: { serialNumber: true } },
                worker: { select: { name: true } },
                ticket: { select: { id: true, title: true } }
            }
        });

        // Fetch assignments returned today
        const returned = await prisma.ticketSerialAssignment.findMany({
            where: { returnedAt: { gte: startOfDay, lte: endOfDay } },
            include: {
                product: { select: { name: true } },
                serial: { select: { serialNumber: true } },
                worker: { select: { name: true } },
                ticket: { select: { id: true, title: true } }
            }
        });

        res.status(200).json({
            date: queryDate,
            issued,
            installed,
            returned,
            summary: {
                issuedCount: issued.length,
                installedCount: installed.length,
                returnedCount: returned.length
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
