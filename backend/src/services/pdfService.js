const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PdfService {
    async generateQuotation(quotation, res) {
        const doc = new PDFDocument({ margin: 50 });

        // Stream the PDF to the response
        doc.pipe(res);

        // Header
        doc.fillColor('#0056b3').fontSize(24).text('Hi-Tech Connect', { align: 'left' });
        doc.fillColor('#333').fontSize(10).text('Security Solutions & CCTV Surveillance', { align: 'left' });
        doc.text('Contact: +91 98765 43210 | info@hitechconnect.com', { align: 'left' });

        doc.moveUp(3);
        doc.fillColor('#555').fontSize(18).text('QUOTATION', { align: 'right' });
        doc.fontSize(10).text(`No: ${quotation.quotationNo}`, { align: 'right' });
        doc.text(`Date: ${new Date(quotation.createdAt).toLocaleDateString()}`, { align: 'right' });

        doc.moveDown(2);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#0056b3').stroke();
        doc.moveDown(1.5);

        // Customer & Requirements
        const startY = doc.y;
        doc.fillColor('#000').fontSize(12).text('Bill To:', 50, startY, { underline: true });
        doc.fontSize(10).text(quotation.customerName, 50, doc.y + 5);
        doc.text(`Phone: ${quotation.customerPhone}`);

        doc.fontSize(12).text('System Requirements:', 300, startY, { underline: true });
        doc.fontSize(10).text(`Cameras: ${quotation.cameraCount} (${quotation.cameraType})`, 300, doc.y + 5);
        doc.text(`Est. Wire: ${quotation.wireLength} Meters`);

        doc.moveDown(3);

        // Table Header
        const tableTop = doc.y;
        doc.fillColor('#f8f9fa').rect(50, tableTop, 500, 20).fill();
        doc.fillColor('#333').fontSize(10);
        doc.text('#', 60, tableTop + 5);
        doc.text('Item Description', 100, tableTop + 5);
        doc.text('Qty', 350, tableTop + 5, { width: 50, align: 'center' });
        doc.text('Unit Price', 400, tableTop + 5, { width: 70, align: 'right' });
        doc.text('Total', 480, tableTop + 5, { width: 70, align: 'right' });

        doc.moveDown(0.5);
        let currentY = tableTop + 25;

        // Table Items
        quotation.items.forEach((item, index) => {
            doc.text(index + 1, 60, currentY);
            doc.text(item.name, 100, currentY, { width: 240 });
            doc.text(item.quantity, 350, currentY, { width: 50, align: 'center' });
            doc.text(item.unitPrice.toFixed(2), 400, currentY, { width: 70, align: 'right' });
            doc.text(item.totalPrice.toFixed(2), 480, currentY, { width: 70, align: 'right' });

            currentY += 20;
            doc.moveTo(50, currentY - 5).lineTo(550, currentY - 5).strokeColor('#eee').lineWidth(0.5).stroke();
        });

        doc.moveDown(2);

        // Totals
        const totalsY = currentY + 20;
        doc.fontSize(10);
        doc.text('Subtotal:', 350, totalsY, { width: 100, align: 'right' });
        doc.text(quotation.subtotal.toFixed(2), 480, totalsY, { width: 70, align: 'right' });

        if (quotation.discount > 0) {
            doc.text('Discount:', 350, totalsY + 15, { width: 100, align: 'right' });
            doc.text(`-${quotation.discount.toFixed(2)}`, 480, totalsY + 15, { width: 70, align: 'right' });
        }

        doc.text('GST (18%):', 350, totalsY + 30, { width: 100, align: 'right' });
        doc.text(quotation.gstAmount.toFixed(2), 480, totalsY + 30, { width: 70, align: 'right' });

        doc.fillColor('#0056b3').fontSize(14).text('Grand Total:', 350, totalsY + 50, { width: 100, align: 'right' });
        doc.text(`Rs. ${quotation.grandTotal.toFixed(2)}`, 450, totalsY + 50, { width: 100, align: 'right', fontStyle: 'bold' });

        // Notes
        if (quotation.notes) {
            doc.moveDown(4);
            doc.fillColor('#333').fontSize(12).text('Notes:', 50, doc.y, { underline: true });
            doc.fontSize(10).text(quotation.notes, 50, doc.y + 5);
        }

        // Footer
        const footerY = 700;
        doc.fontSize(8).fillColor('#777').text('This is a computer-generated quotation and does not require a physical signature.', 50, footerY, { align: 'center' });
        doc.text('Validity: 7 Days | Payment: 50% Advance, 50% on Completion', { align: 'center' });

        doc.end();
    }
}

module.exports = new PdfService();
