const PDFDocument = require('pdfkit');

/**
 * Generate Invoice PDF
 * @param {Object} data - Invoice, Ticket, and Customer data
 * @returns {Promise<Buffer>}
 */
const generateInvoicePDF = (data) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        let buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        const { invoice, ticket } = data;

        // ─── Header ────────────────────────────────────────────────────────────
        // Drawing a blue circle placeholder for logo
        doc.circle(80, 75, 25).fill("#3B82F6");
        doc.fillColor("#FFFFFF").fontSize(18).font("Helvetica-Bold").text("H", 73, 68);
        doc.fillColor("#FFFFFF").fontSize(8).text("HI-TECH", 63, 85);

        doc.fillColor("#000000")
            .fontSize(20)
            .font("Helvetica-Bold")
            .text("HI-TECH COMMUNICATION SYSTEMS", 120, 55);

        doc.fontSize(10)
            .font("Helvetica")
            .text("Security Solutions & Services", 120, 80)
            .text("Shop no F-18, 1st floor, KAC Plaza", 120, 95)
            .text("R R street, Nellore-524001", 120, 110)
            .text("Phone: 9885680280", 120, 125);

        doc.moveTo(50, 150).lineTo(550, 150).stroke();

        // ─── Invoice Title & Info ───────────────────────────────────────────────
        doc.fillColor("#000000")
            .fontSize(24)
            .font("Helvetica-Bold")
            .text("INVOICE", 50, 170, { align: "right" });

        doc.fontSize(10)
            .font("Helvetica")
            .text(`Invoice #: ${invoice.invoiceNumber}`, 50, 200, { align: "right" })
            .text(`Date: ${new Date(invoice.createdAt).toLocaleDateString('en-IN')}`, 50, 215, { align: "right" })
            .text(`Ticket ID: ${ticket.id.slice(0, 8).toUpperCase()}`, 50, 230, { align: "right" });

        // ─── Customer Info ──────────────────────────────────────────────────────
        doc.fontSize(12).font("Helvetica-Bold").text("BILL TO:", 50, 170);
        doc.fontSize(11).font("Helvetica-Bold").fillColor("#3B82F6").text(invoice.customerName, 50, 190);
        doc.fontSize(10).font("Helvetica").fillColor("#000000")
            .text(`Phone: ${invoice.customerPhone}`, 50, 210)
            .text("Address:", 50, 225)
            .text(ticket.address, 50, 240, { width: 250 });

        // ─── Table Header ──────────────────────────────────────────────────────
        const tableTop = 320;
        doc.rect(50, tableTop, 500, 25).fill("#F1F5F9");
        doc.fillColor("#0F172A").font("Helvetica-Bold").fontSize(10);
        doc.text("Description", 60, tableTop + 8);
        doc.text("Technician", 280, tableTop + 8);
        doc.text("Amount (INR)", 450, tableTop + 8, { align: "right" });

        // ─── Table Row ─────────────────────────────────────────────────────────
        const rowTop = tableTop + 35;
        doc.font("Helvetica").fillColor("#000000");
        doc.text(ticket.title, 60, rowTop, { width: 210 });
        const primaryAssigned = ticket.assignments?.find(a => a.isPrimary);
        const technicianName = primaryAssigned?.worker?.name || ticket.assignments?.[0]?.worker?.name || "Assigned Tech";
        doc.text(technicianName, 280, rowTop);
        doc.text(invoice.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 }), 450, rowTop, { align: "right" });

        // ─── Summary ───────────────────────────────────────────────────────────
        const summaryTop = rowTop + 80;
        doc.moveTo(300, summaryTop).lineTo(550, summaryTop).stroke();

        doc.fontSize(10).font("Helvetica");
        doc.text("Subtotal:", 350, summaryTop + 15);
        doc.text(invoice.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 }), 450, summaryTop + 15, { align: "right" });

        doc.text("Amount Received:", 350, summaryTop + 35);
        doc.text(invoice.amountReceived.toLocaleString('en-IN', { minimumFractionDigits: 2 }), 450, summaryTop + 35, { align: "right" });

        doc.rect(340, summaryTop + 55, 210, 30).fill("#F1F5F9");
        doc.fillColor("#EF4444").font("Helvetica-Bold").fontSize(12);
        doc.text("BALANCE DUE:", 350, summaryTop + 65);
        doc.text(`INR ${invoice.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 450, summaryTop + 65, { align: "right" });

        // ─── Footer ────────────────────────────────────────────────────────────
        doc.fillColor("#64748B")
            .fontSize(9)
            .font("Helvetica-Oblique")
            .text("Thank you for your business! For any queries, call us at 9885680280.", 50, 720, { align: "center", width: 500 });

        doc.text("Generated on " + new Date().toLocaleString(), 50, 740, { align: "center", width: 500 });

        doc.end();
    });
};

module.exports = { generateInvoicePDF };
