const prisma = require('../config/prisma');
const PDFDocument = require('pdfkit');

/**
 * Get all invoices (Admin)
 */
exports.getAllInvoices = async (req, res) => {
    try {
        const invoices = await prisma.invoice.findMany({
            include: {
                ticket: {
                    select: {
                        title: true,
                        status: true,
                        assignments: {
                            include: { worker: { select: { name: true } } }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(invoices);
    } catch (error) {
        console.error('Get all invoices error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Download Invoice PDF
 */
exports.downloadInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: {
                ticket: {
                    include: {
                        assignments: {
                            include: { worker: { select: { name: true } } }
                        }
                    }
                }
            }
        });

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        const pdfBuffer = await generateInvoicePDF({ invoice, ticket: invoice.ticket });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Invoice-${invoice.invoiceNumber}.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Download invoice error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Get invoice for a specific ticket (Customer/Admin)
 */
exports.getInvoiceByTicket = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const invoice = await prisma.invoice.findUnique({
            where: { ticketId },
            include: {
                ticket: {
                    include: {
                        assignments: {
                            include: { worker: { select: { name: true } } }
                        }
                    }
                }
            }
        });

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        res.status(200).json(invoice);
    } catch (error) {
        console.error('getInvoiceByTicket error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
