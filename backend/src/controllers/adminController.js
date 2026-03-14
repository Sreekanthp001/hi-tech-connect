const prisma = require('../config/prisma');
const bcrypt = require('bcrypt');

/**
 * Worker Performance Report
 * GET /api/admin/worker-performance
 */
exports.getWorkerPerformance = async (req, res) => {
    try {
        const workers = await prisma.user.findMany({
            where: { role: 'WORKER' },
            select: { id: true, name: true }
        });

        const now = new Date();
        const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

        const tickets = await prisma.ticket.findMany({
            select: {
                assignments: true,
                status: true,
                updatedAt: true,
            }
        });

        const ticketMap = {};
        for (const t of tickets) {
            for (const assign of t.assignments) {
                const wId = assign.workerId;
                if (!ticketMap[wId]) {
                    ticketMap[wId] = { all: [], completed: [], inProgress: [], pending: [], thisMonth: [] };
                }
                ticketMap[wId].all.push(t);
                if (t.status === 'COMPLETED') {
                    ticketMap[wId].completed.push(t);
                    if (new Date(t.updatedAt) >= monthStart) {
                        ticketMap[wId].thisMonth.push(t);
                    }
                } else if (t.status === 'IN_PROGRESS') {
                    ticketMap[wId].inProgress.push(t);
                } else {
                    ticketMap[wId].pending.push(t);
                }
            }
        }

        const performance = workers.map((w) => {
            const data = ticketMap[w.id] || { all: [], completed: [], inProgress: [], pending: [], thisMonth: [] };
            const totalAssigned = data.all.length;
            const completedCount = data.completed.length;
            const inProgressCount = data.inProgress.length;
            const pendingCount = data.pending.length;
            const thisMonthCompleted = data.thisMonth.length;
            const completionRate = totalAssigned > 0
                ? Math.round((completedCount / totalAssigned) * 100)
                : 0;

            return {
                workerId: w.id,
                name: w.name,
                totalAssigned,
                completedCount,
                inProgressCount,
                pendingCount,
                completionRate,
                thisMonthCompleted,
            };
        });

        performance.sort((a, b) => b.completionRate - a.completionRate);
        res.status(200).json(performance);
    } catch (error) {
        console.error("Worker performance error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * List all workers
 * GET /api/admin/workers
 */
exports.getWorkers = async (req, res) => {
    try {
        const workers = await prisma.user.findMany({
            where: { role: 'WORKER' },
            select: { id: true, name: true, email: true, phone: true, createdAt: true },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(workers);
    } catch (error) {
        console.error("Get workers error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Create a new worker
 * POST /api/admin/create-worker
 */
exports.createWorker = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: "Name, email and password are required" });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters" });
        }

        const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        if (existingUser) {
            return res.status(400).json({ error: "Email already in use" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const worker = await prisma.user.create({
            data: {
                name,
                email: email.toLowerCase(),
                phone: phone || null,
                password: hashedPassword,
                role: 'WORKER'
            },
            select: { id: true, name: true, email: true, phone: true, role: true }
        });

        res.status(201).json(worker);
    } catch (error) {
        console.error("Create worker error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Update Worker Telegram ID
 * PATCH /api/admin/workers/:id/telegram
 */
exports.updateWorkerTelegram = async (req, res) => {
    const { id } = req.params;
    const { telegramId } = req.body;

    try {
        const worker = await prisma.user.findUnique({
            where: { id }
        });

        if (!worker || worker.role !== 'WORKER') {
            return res.status(404).json({ error: "Worker not found" });
        }

        await prisma.user.update({
            where: { id },
            data: { telegramId }
        });

        res.status(200).json({ message: "Worker Telegram ID updated successfully" });
    } catch (error) {
        console.error("Update worker telegram error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Delete/Deactivate a worker
 * DELETE /api/admin/worker/:id
 */
exports.deleteWorker = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if worker has assigned tickets
        const assignedTickets = await prisma.ticketAssignment.count({ where: { workerId: id } });
        if (assignedTickets > 0) {
            return res.status(400).json({ error: "Cannot delete worker with assigned tickets. Reassign tickets first." });
        }

        await prisma.user.delete({ where: { id } });
        res.status(200).json({ message: "Worker deleted successfully" });
    } catch (error) {
        console.error("Delete worker error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Reset worker password
 * PATCH /api/admin/reset-password/:id
 */
exports.resetWorkerPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: "New password must be at least 6 characters" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id },
            data: { password: hashedPassword }
        });

        res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Dashboard Stats
 * GET /api/admin/dashboard-stats
 */
exports.getDashboardStats = async (req, res) => {
    try {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const [totalTickets, pendingTickets, inProgressTickets, completedTickets, todayTicketsCount, maintenanceAlertsCount] = await Promise.all([
            prisma.ticket.count(),
            prisma.ticket.count({ where: { status: 'PENDING' } }),
            prisma.ticket.count({ where: { status: 'IN_PROGRESS' } }),
            prisma.ticket.count({ where: { status: 'COMPLETED' } }),
            prisma.ticket.count({ where: { createdAt: { gte: startOfToday } } }),
            prisma.ticket.count({
                where: {
                    OR: [
                        { warrantyExpiryDate: { lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), gte: now } },
                        { amcRenewalDate: { lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), gte: now } }
                    ]
                }
            })
        ]);

        res.status(200).json({
            totalTickets,
            pendingTickets,
            inProgressTickets,
            completedTickets,
            todayTicketsCount,
            maintenanceAlertsCount
        });
    } catch (error) {
        console.error("Get dashboard stats error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * List all unique customers
 * GET /api/admin/customers
 */
exports.getCustomers = async (req, res) => {
    try {
        const { search } = req.query;

        // Fetch all tickets to aggregate
        const tickets = await prisma.ticket.findMany({
            where: search ? {
                OR: [
                    { clientName: { contains: search, mode: 'insensitive' } },
                    { clientPhone: { contains: search, mode: 'insensitive' } },
                    { clientEmail: { contains: search, mode: 'insensitive' } },
                ]
            } : {},
            orderBy: { createdAt: 'desc' }
        });

        const customerMap = new Map();
        for (const t of tickets) {
            const phone = t.clientPhone;
            if (!customerMap.has(phone)) {
                customerMap.set(phone, {
                    id: `${t.clientName.toLowerCase()}-${t.clientPhone}`,
                    name: t.clientName,
                    phone: t.clientPhone,
                    email: t.clientEmail,
                    address: t.address,
                    totalVisits: 0,
                    totalAmount: 0,
                    totalReceived: 0,
                    balance: 0,
                    lastVisitDate: t.createdAt
                });
            }
            const c = customerMap.get(phone);
            c.totalVisits += 1;
            c.totalAmount += (t.totalAmount || 0);
            c.totalReceived += (t.amountReceived || 0);
            c.balance = c.totalAmount - c.totalReceived;
            if (new Date(t.createdAt) > new Date(c.lastVisitDate)) {
                c.lastVisitDate = t.createdAt;
            }
        }

        res.status(200).json(Array.from(customerMap.values()));
    } catch (error) {
        console.error("Get customers error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Get customer profile & history
 * GET /api/admin/customer/:id
 */
exports.getCustomerProfile = async (req, res) => {
    try {
        const { id } = req.params; // Expects "name-phone"
        const parts = id.split('-');
        const phone = parts.pop();
        const name = parts.join('-');

        const tickets = await prisma.ticket.findMany({
            where: {
                clientPhone: phone
            },
            orderBy: { createdAt: 'desc' },
            include: {
                assignments: {
                    include: { worker: { select: { name: true } } }
                },
                payments: { orderBy: { createdAt: 'desc' } },
                ticketPhotos: true,
                invoice: true
            }
        });

        if (tickets.length === 0) {
            return res.status(404).json({ error: "Customer not found" });
        }

        const stats = {
            totalVisits: tickets.length,
            totalAmount: tickets.reduce((sum, t) => sum + (t.totalAmount || 0), 0),
            totalReceived: tickets.reduce((sum, t) => sum + (t.amountReceived || 0), 0),
            balance: 0,
            lastVisit: tickets[0].createdAt
        };
        stats.balance = stats.totalAmount - stats.totalReceived;

        // Flatten all payments from all tickets for a customer-wide payment history
        const allPayments = tickets.flatMap(t => t.payments.map(p => ({
            ...p,
            ticketTitle: t.title,
            paidAt: p.createdAt // For consistency with frontend expectation
        }))).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const profile = {
            id,
            name: tickets[0].clientName,
            phone: tickets[0].clientPhone,
            email: tickets[0].clientEmail,
            address: tickets[0].address,
            totalVisits: stats.totalVisits,
            totalAmount: stats.totalAmount,
            totalReceived: stats.totalReceived,
            balance: stats.balance,
            lastVisitDate: stats.lastVisit,
            tickets: tickets,
            payments: allPayments
        };

        res.status(200).json(profile);
    } catch (error) {
        console.error("Get customer profile error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Download Customer Service Statement (Excel)
 * GET /api/admin/customers/:id/statement
 */
exports.getCustomerStatement = async (req, res) => {
    try {
        const { id } = req.params; // Expects "name-phone"
        const parts = id.split('-');
        const phone = parts.pop();

        const tickets = await prisma.ticket.findMany({
            where: { clientPhone: phone },
            orderBy: { createdAt: 'asc' }, // Ascending for chronological history
            include: {
                assignments: {
                    include: { worker: { select: { name: true } } }
                }
            }
        });

        if (tickets.length === 0) {
            return res.status(404).json({ error: "No service history found for this customer" });
        }

        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Service Statement');

        // Summary Calculations
        const totalRevenue = tickets.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
        const totalReceived = tickets.reduce((sum, t) => sum + (t.amountReceived || 0), 0);
        const pendingAmount = totalRevenue - totalReceived;
        const firstVisit = tickets[0].createdAt;
        const lastVisit = tickets[tickets.length - 1].createdAt;

        // Styling
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'HI-TECH CONNECT - CUSTOMER SERVICE STATEMENT';
        titleCell.font = { size: 16, bold: true, color: { argb: 'FF2563EB' } };
        worksheet.mergeCells('A1:I1');

        worksheet.addRow(['Customer:', tickets[0].clientName]);
        worksheet.addRow(['Phone:', tickets[0].clientPhone]);
        worksheet.addRow(['Generated On:', new Date().toLocaleString()]);
        worksheet.addRow([]);

        // Summary Box
        worksheet.addRow(['SUMMARY SECTION']).font = { bold: true, underline: true };
        worksheet.addRow(['Total Services', tickets.length]);
        worksheet.addRow(['Total Billed', `₹${totalRevenue}`]);
        worksheet.addRow(['Total Paid', `₹${totalReceived}`]);
        worksheet.addRow(['Pending Amount', `₹${pendingAmount}`]);
        worksheet.addRow(['First Visit', new Date(firstVisit).toLocaleDateString('en-IN')]);
        worksheet.addRow(['Last Visit', new Date(lastVisit).toLocaleDateString('en-IN')]);
        worksheet.addRow([]);

        // Table Headers
        const headerRow = worksheet.addRow([
            'Ticket ID', 'Service Type', 'Date', 'Status', 'Technicians', 'Amount (₹)', 'Payment Status', 'Warranty Expiry', 'AMC Expiry'
        ]);
        headerRow.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
            cell.alignment = { horizontal: 'center' };
        });

        // Add Data
        tickets.forEach(t => {
            const techs = t.assignments.map(a => a.worker.name).join(', ') || 'Unassigned';
            worksheet.addRow([
                t.id.slice(0, 8).toUpperCase(),
                t.type,
                new Date(t.createdAt).toLocaleDateString('en-IN'),
                t.status,
                techs,
                t.totalAmount || 0,
                t.paymentStatus || 'PENDING',
                t.warrantyExpiryDate ? new Date(t.warrantyExpiryDate).toLocaleDateString('en-IN') : 'N/A',
                t.amcRenewalDate ? new Date(t.amcRenewalDate).toLocaleDateString('en-IN') : 'N/A'
            ]);
        });

        // Formatting
        worksheet.columns.forEach(col => { col.width = 15; });
        worksheet.getColumn(1).width = 12; // Ticket ID
        worksheet.getColumn(5).width = 25; // Technicians
        worksheet.getColumn(9).width = 15; // AMC

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=HTC_Statement_${phone}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error("Excel Statement Error:", error);
        res.status(500).json({ error: "Failed to generate Excel statement" });
    }
};

/**
 * Get Maintenance Alerts (Expiring in 30 days)
 * GET /api/admin/maintenance-alerts
 */
exports.getMaintenanceAlerts = async (req, res) => {
    try {
        const now = new Date();
        const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        const alerts = await prisma.ticket.findMany({
            where: {
                OR: [
                    { warrantyExpiryDate: { lte: thirtyDaysLater, gte: now } },
                    { amcRenewalDate: { lte: thirtyDaysLater, gte: now } }
                ]
            },
            select: {
                id: true,
                title: true,
                clientName: true,
                clientPhone: true,
                warrantyExpiryDate: true,
                amcRenewalDate: true,
                amcEnabled: true,
                ticketPhotos: true,
                invoice: true
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });

        res.status(200).json(alerts);
    } catch (error) {
        console.error("Get maintenance alerts error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Revenue & Collection Analytics
 * GET /api/admin/revenue-stats
 */
exports.getRevenueStats = async (req, res) => {
    try {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // 1. Collections (from PaymentHistory)
        const todayPayments = await prisma.paymentHistory.aggregate({
            _sum: { amount: true },
            where: { createdAt: { gte: startOfToday } }
        });

        const monthPayments = await prisma.paymentHistory.aggregate({
            _sum: { amount: true },
            where: { createdAt: { gte: startOfMonth } }
        });

        const allTimePayments = await prisma.paymentHistory.aggregate({
            _sum: { amount: true }
        });

        // 2. Pending Collection (from Tickets)
        const pendingTickets = await prisma.ticket.findMany({
            where: {
                paymentStatus: { in: ['PENDING', 'PARTIAL'] }
            },
            select: { totalAmount: true, amountReceived: true }
        });

        const pendingCollection = pendingTickets.reduce((sum, t) => {
            return sum + ((t.totalAmount || 0) - (t.amountReceived || 0));
        }, 0);

        // 3. Top Worker (by completed tickets)
        const topWorkerData = await prisma.ticketAssignment.groupBy({
            by: ['workerId'],
            where: { ticket: { status: 'COMPLETED' } },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 1
        });

        let topWorker = "N/A";
        if (topWorkerData.length > 0) {
            const worker = await prisma.user.findUnique({
                where: { id: topWorkerData[0].workerId },
                select: { name: true }
            });
            topWorker = worker ? worker.name : "N/A";
        }

        const totalCustomers = await prisma.ticket.groupBy({
            by: ['clientPhone'],
            _count: { _all: true }
        });

        const repeatCustomers = await prisma.ticket.groupBy({
            by: ['clientPhone'],
            _count: { _all: true },
            having: {
                clientPhone: {
                    _count: { gt: 1 }
                }
            }
        });

        const repeatCustomerPercentage = totalCustomers.length > 0
            ? Math.round((repeatCustomers.length / totalCustomers.length) * 100)
            : 0;

        // 5. Profit Calculation (Phase 6)
        const totalExpenses = await prisma.expense.aggregate({
            _sum: { amount: true }
        });

        const revenue = allTimePayments._sum.amount || 0;
        const expenses = totalExpenses._sum.amount || 0;
        const profit = revenue - expenses;

        // 6. Monthly Trends (Last 6 months)
        const trends = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
            const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

            const mPayments = await prisma.paymentHistory.aggregate({
                _sum: { amount: true },
                where: { createdAt: { gte: mStart, lte: mEnd } }
            });

            trends.push({
                month: d.toLocaleString('default', { month: 'short' }),
                revenue: mPayments._sum.amount || 0
            });
        }

        res.status(200).json({
            todayCollection: todayPayments._sum.amount || 0,
            monthCollection: monthPayments._sum.amount || 0,
            pendingCollection,
            totalRevenue: revenue,
            topWorker,
            repeatCustomerPercentage,
            totalExpenses: expenses,
            profit,
            trends
        });
    } catch (error) {
        console.error("Get revenue stats error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Get internal notifications
 * GET /api/admin/notifications
 */
exports.getNotifications = async (req, res) => {
    try {
        const notifications = await prisma.internalNotification.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        res.status(200).json(notifications);
    } catch (error) {
        console.error("Get notifications error:", error);
        res.status(500).json({ error: "Failed to fetch notifications" });
    }
};

/**
 * Mark notification as read
 * PATCH /api/admin/notifications/:id/read
 */
exports.markNotificationRead = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.internalNotification.update({
            where: { id },
            data: { isRead: true }
        });
        res.status(200).json({ message: "Notification marked as read" });
    } catch (error) {
        console.error("Mark notification read error:", error);
        res.status(500).json({ error: "Failed to update notification" });
    }
};

/**
 * Revenue Breakdown
 * GET /api/admin/revenue-breakdown
 */
exports.getRevenueBreakdown = async (req, res) => {
    try {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const invoices = await prisma.invoice.findMany({
            where: {
                ticket: { status: 'COMPLETED' }
            },
            select: {
                customerName: true,
                totalAmount: true,
                createdAt: true
            }
        });

        const todayMap = {};
        const monthMap = {};

        invoices.forEach(inv => {
            const date = new Date(inv.createdAt);

            if (date >= startOfMonth) {
                const name = inv.customerName;
                if (!monthMap[name]) monthMap[name] = { customerName: name, totalAmount: 0, ticketCount: 0 };
                monthMap[name].totalAmount += inv.totalAmount;
                monthMap[name].ticketCount += 1;

                if (date >= startOfToday) {
                    if (!todayMap[name]) todayMap[name] = { customerName: name, totalAmount: 0, ticketCount: 0 };
                    todayMap[name].totalAmount += inv.totalAmount;
                    todayMap[name].ticketCount += 1;
                }
            }
        });

        res.status(200).json({
            today: Object.values(todayMap),
            thisMonth: Object.values(monthMap)
        });
    } catch (error) {
        console.error("Revenue breakdown error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Get Customer Assets by Phone
 * GET /api/admin/customer/:phone/assets
 */
exports.getCustomerAssets = async (req, res) => {
    try {
        const { phone } = req.params;
        const assets = await prisma.customerAsset.findMany({
            where: { customerPhone: phone },
            include: {
                product: { select: { id: true, name: true, category: true } },
                serial: { select: { serialNumber: true } },
                ticket: { select: { id: true, title: true, createdAt: true, warrantyExpiryDate: true, amcRenewalDate: true } }
            },
            orderBy: { installationDate: 'desc' }
        });
        res.status(200).json(assets);
    } catch (error) {
        console.error("Get customer assets error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Download Customer Installation Report (PDF)
 * GET /api/admin/customer/:phone/assets/pdf
 */
exports.downloadCustomerInstallationReport = async (req, res) => {
    try {
        const { phone } = req.params;
        const assets = await prisma.customerAsset.findMany({
            where: { customerPhone: phone },
            include: {
                product: { select: { name: true, category: true } },
                serial: { select: { serialNumber: true } },
                ticket: { select: { clientName: true, address: true, installationDate: true, warrantyExpiryDate: true } }
            },
            orderBy: { installationDate: 'desc' }
        });

        if (assets.length === 0) {
            return res.status(404).json({ error: "No installed equipment found for this customer" });
        }

        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({ margin: 40, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Installation-Report-${phone}.pdf`);

        doc.pipe(res);

        // Header
        doc.fontSize(20).font('Helvetica-Bold').text('Hi-Tech Connect', { align: 'center' });
        doc.fontSize(14).font('Helvetica').text('Customer Installation Report', { align: 'center' });
        doc.moveDown();

        const customerName = assets[0].ticket?.clientName || 'Unknown Customer';
        const address = assets[0].ticket?.address || 'Unknown Address';

        doc.fontSize(11).font('Helvetica-Bold').text('Customer Details:');
        doc.font('Helvetica').text(`Name: ${customerName}`);
        doc.text(`Phone: ${phone}`);
        doc.text(`Address: ${address}`);
        doc.moveDown();

        // Table
        const colWidths = [150, 100, 120, 70, 70];
        const headers = ['Product', 'Category', 'Serial No', 'Install Date', 'Status'];
        let x = 40, y = doc.y;

        // Header Row
        doc.fontSize(10).font('Helvetica-Bold');
        doc.rect(x, y, 510, 20).fill('#D3E4FF').stroke();
        headers.forEach((h, i) => {
            doc.fillColor('black').text(h, x + colWidths.slice(0, i).reduce((a, b) => a + b, 0) + 5, y + 5, { width: colWidths[i] - 10 });
        });
        y += 20;

        // Data Rows
        doc.fontSize(9).font('Helvetica');
        assets.forEach((asset, idx) => {
            if (y > 750) { doc.addPage(); y = 40; }
            if (idx % 2 === 0) doc.rect(x, y, 510, 20).fill('#F8F9FA').stroke();
            else doc.rect(x, y, 510, 20).fill('white').stroke();

            const installDate = asset.installationDate ? new Date(asset.installationDate).toLocaleDateString() : 'N/A';
            const vals = [
                asset.product.name.substring(0, 30),
                asset.product.category || 'N/A',
                asset.serial?.serialNumber || 'N/A',
                installDate,
                asset.status
            ];

            vals.forEach((v, i) => {
                doc.fillColor('black').text(String(v), x + colWidths.slice(0, i).reduce((a, b) => a + b, 0) + 5, y + 5, { width: colWidths[i] - 10 });
            });
            y += 20;
        });

        doc.moveDown(2);
        doc.fontSize(10).font('Helvetica-Oblique').text('Generated by Hi-Tech Connect Admin System.', { align: 'center', color: 'gray' });

        doc.end();
    } catch (error) {
        console.error("PDF Report Error:", error);
        res.status(500).json({ error: "Failed to generate report" });
    }
};
