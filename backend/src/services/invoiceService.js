const prisma = require('../config/prisma');

/**
 * Generate a unique invoice number in format: HTC-YYYY-0001
 */
const generateInvoiceNumber = async () => {
    const year = new Date().getFullYear();
    const prefix = `HTC-${year}-`;

    // Find the latest invoice for this year
    const lastInvoice = await prisma.invoice.findFirst({
        where: {
            invoiceNumber: {
                startsWith: prefix
            }
        },
        orderBy: {
            invoiceNumber: 'desc'
        }
    });

    let nextNumber = 1;
    if (lastInvoice) {
        const lastSerial = parseInt(lastInvoice.invoiceNumber.split('-')[2]);
        nextNumber = lastSerial + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
};

/**
 * Auto-create an invoice record for a completed ticket
 */
const createInvoice = async (ticketId) => {
    try {
        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            include: { assignments: { include: { worker: { select: { id: true, name: true } } } } }
        });

        if (!ticket || ticket.status !== 'COMPLETED') {
            throw new Error('Ticket not found or not completed');
        }

        // Check if invoice already exists
        const existing = await prisma.invoice.findUnique({
            where: { ticketId }
        });
        if (existing) return existing;

        const invoiceNumber = await generateInvoiceNumber();

        const invoice = await prisma.invoice.create({
            data: {
                invoiceNumber,
                ticketId: ticket.id,
                customerName: ticket.clientName,
                customerPhone: ticket.clientPhone,
                totalAmount: ticket.totalAmount || 0,
                amountReceived: ticket.amountReceived || 0,
                balance: (ticket.totalAmount || 0) - (ticket.amountReceived || 0),
                paymentStatus: ticket.paymentStatus || 'PENDING',
                // Optional fields could be added here later (GST, Address)
            }
        });

        return invoice;
    } catch (error) {
        console.error('Error creating invoice:', error);
        throw error;
    }
};

module.exports = {
    generateInvoiceNumber,
    createInvoice
};
