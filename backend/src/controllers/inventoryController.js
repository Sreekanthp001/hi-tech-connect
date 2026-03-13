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
        res.json(materials);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Add material to ticket
exports.addTicketMaterial = async (req, res) => {
    try {
        const { ticketId, productId, quantity, unitPrice, notes } = req.body;
        // Check stock
        const product = await prisma.productMaster.findUnique({ where: { id: productId } });
        if (!product) return res.status(404).json({ error: "Product not found" });
        if (product.currentStock < quantity) return res.status(400).json({ error: `Insufficient stock. Available: ${product.currentStock} ${product.unitType}` });
        // Add material record
        const material = await prisma.ticketMaterial.create({
            data: { ticketId, productId, quantity, notes },
            include: { product: { select: { name: true, unitType: true } } }
        });
        // Deduct stock
        await prisma.productMaster.update({ where: { id: productId }, data: { currentStock: { decrement: quantity } } });
        await prisma.stockTransaction.create({
            data: { productId, quantity, transactionType: 'OUT', referenceType: 'WORKER_ISSUE', ticketId, notes: `Ticket material`, createdByAdmin: true }
        });
        res.json(material);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Remove material from ticket
exports.removeTicketMaterial = async (req, res) => {
    try {
        const material = await prisma.ticketMaterial.findUnique({ where: { id: req.params.id } });
        if (!material) return res.status(404).json({ error: "Not found" });
        // Restore stock
        await prisma.productMaster.update({ where: { id: material.productId }, data: { currentStock: { increment: material.quantity } } });
        await prisma.ticketMaterial.delete({ where: { id: req.params.id } });
        res.json({ success: true });
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
