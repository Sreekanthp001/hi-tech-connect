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
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=Invoice-${invoice.invoiceNumber}.pdf`);
        doc.pipe(res);

        // Header
        doc.rect(0, 0, 612, 100).fill('#1e3a5f');
        doc.fillColor('white').fontSize(24).font('Helvetica-Bold').text('HI-TECH COMMUNICATIONS', 50, 25, { align: 'center' });
        doc.fontSize(11).font('Helvetica').text('CCTV | Biometric | Security Systems | Nellore', 50, 55, { align: 'center' });
        doc.fontSize(9).text('Phone: +91 98765 43210 | nellore.hitech@gmail.com', 50, 72, { align: 'center' });

        // Invoice title
        doc.fillColor('#1e3a5f').fontSize(16).font('Helvetica-Bold').text('TAX INVOICE', 50, 115, { align: 'right' });
        doc.fontSize(9).font('Helvetica').fillColor('#333');
        doc.text(`Invoice No: ${invoice.invoiceNumber}`, 400, 135);
        doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day:'2-digit', month:'short', year:'numeric' })}`, 400, 150);

        // Customer details box
        doc.rect(50, 175, 250, 90).stroke('#cccccc');
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#1e3a5f').text('BILL TO:', 60, 183);
        doc.font('Helvetica').fillColor('#333');
        doc.fontSize(11).font('Helvetica-Bold').text(invoice.ticket?.clientName || 'N/A', 60, 197);
        doc.fontSize(9).font('Helvetica').text(`Phone: ${invoice.ticket?.clientPhone || 'N/A'}`, 60, 213);
        doc.text(`Service: ${invoice.ticket?.type || 'N/A'}`, 60, 227);
        doc.text(`Address: ${(invoice.ticket?.address || 'N/A').substring(0, 40)}`, 60, 241);

        // Service details table
        doc.rect(50, 285, 512, 25).fill('#1e3a5f');
        doc.fillColor('white').fontSize(9).font('Helvetica-Bold');
        doc.text('DESCRIPTION', 60, 293);
        doc.text('STATUS', 300, 293);
        doc.text('AMOUNT (Rs.)', 440, 293);

        doc.rect(50, 310, 512, 30).fill('#f0f4f8');
        doc.fillColor('#333').fontSize(9).font('Helvetica');
        doc.text(invoice.ticket?.type || 'Security Service', 60, 320);
        doc.text(invoice.ticket?.status || 'COMPLETED', 300, 320);
        doc.text(`${invoice.totalAmount || 0}`, 440, 320);

        // Totals
        doc.moveTo(350, 360).lineTo(562, 360).stroke('#cccccc');
        doc.fontSize(9).text('Subtotal:', 400, 370); doc.text(`Rs.${invoice.totalAmount || 0}`, 490, 370);
        doc.text('Amount Paid:', 400, 385); doc.text(`Rs.${invoice.amountPaid || 0}`, 490, 385);
        doc.moveTo(400, 400).lineTo(562, 400).stroke('#1e3a5f');
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e3a5f');
        doc.text('Balance Due:', 400, 408); doc.text(`Rs.${(invoice.totalAmount||0)-(invoice.amountPaid||0)}`, 490, 408);

        // Footer
        doc.rect(0, 750, 612, 92).fill('#1e3a5f');
        doc.fillColor('white').fontSize(9).font('Helvetica').text('Thank you for choosing Hi-Tech Communications!', 50, 762, { align: 'center' });
        doc.fontSize(8).text('28 Years of Trusted Service in Nellore | Authorized CCTV & Biometric Dealer', 50, 778, { align: 'center' });

        doc.end();
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
