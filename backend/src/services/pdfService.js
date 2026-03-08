const PDFDocument = require('pdfkit');

class PdfService {
    async generateQuotation(quotation, res) {
        const doc = new PDFDocument({ margin: 50 });

        // Stream the PDF to the response
        doc.pipe(res);

        // Header - Branding
        doc.fillColor('#1e293b').fontSize(24).font('Helvetica-Bold').text('Hi-Tech Connect', { align: 'left' });
        doc.fillColor('#64748b').fontSize(9).font('Helvetica').text('Smart Security Solutions & Advanced CCTV Surveillance', { align: 'left' });
        doc.text('GSTIN: 37AAAAA0000A1Z5 | Contact: +91 99999 88888', { align: 'left' });
        doc.text('Address: Road No. 1, Jubilee Hills, Hyderabad, TS, 500033', { align: 'left' });

        // Quotation Metadata
        doc.moveUp(4);
        doc.fillColor('#0f172a').fontSize(18).font('Helvetica-Bold').text('QUOTATION', { align: 'right' });
        doc.fontSize(10).font('Helvetica').text(`Ref No: ${quotation.quotationNo}`, { align: 'right' });
        doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, { align: 'right' });
        doc.text(`Valid Until: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN')}`, { align: 'right' });

        doc.moveDown(2);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#e2e8f0').lineWidth(2).stroke();
        doc.moveDown(1.5);

        // Customer Info
        const infoY = doc.y;
        doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text('CUSTOMER DETAILS:', 50, infoY);
        doc.fontSize(10).font('Helvetica-Bold').text(quotation.customerName, 50, infoY + 15);
        doc.font('Helvetica').text(`Phone: ${quotation.customerPhone}`, 50, infoY + 30);

        doc.fontSize(11).font('Helvetica-Bold').text('WORK DETAILS:', 350, infoY);
        doc.fontSize(10).font('Helvetica').text(`Ticket ID: ${quotation.ticketId || '#HTC-NEW'}`, 350, infoY + 15);
        doc.text(`System Type: ${quotation.cameraType || 'Premium CCTV'}`, 350, infoY + 30);

        doc.moveDown(4);

        // Table Header
        const tableTop = doc.y;
        doc.fillColor('#1e293b').rect(50, tableTop, 500, 25).fill();
        doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold');
        doc.text('Description', 60, tableTop + 8);
        doc.text('Qty', 350, tableTop + 8, { width: 50, align: 'center' });
        doc.text('Unit Price (Rs)', 410, tableTop + 8, { width: 60, align: 'right' });
        doc.text('Total (Rs)', 480, tableTop + 8, { width: 60, align: 'right' });

        let currentY = tableTop + 30;
        doc.fillColor('#0f172a').font('Helvetica');

        // Table Items
        quotation.items.forEach((item, index) => {
            // Alternate row background
            if (index % 2 !== 0) {
                doc.fillColor('#f8fafc').rect(50, currentY - 5, 500, 25).fill();
            }

            doc.fillColor('#334155').text(item.name, 60, currentY, { width: 280 });
            doc.text(item.quantity, 350, currentY, { width: 50, align: 'center' });
            doc.text(item.unitPrice.toLocaleString('en-IN'), 410, currentY, { width: 60, align: 'right' });
            doc.text(item.totalPrice.toLocaleString('en-IN'), 480, currentY, { width: 60, align: 'right' });

            currentY += 25;
            doc.moveTo(50, currentY - 5).lineTo(550, currentY - 5).strokeColor('#f1f5f9').lineWidth(0.5).stroke();
        });

        doc.moveDown(2);
        const totalsY = doc.y > 650 ? 50 : doc.y; // Simplified overflow check

        // Calculation Block
        const startTotalsX = 350;
        doc.fontSize(10).font('Helvetica').fillColor('#475569');
        doc.text('Subtotal:', startTotalsX, totalsY, { width: 120, align: 'right' });
        doc.fillColor('#0f172a').text(`Rs. ${quotation.subtotal.toLocaleString('en-IN')}`, 480, totalsY, { width: 60, align: 'right' });

        if (quotation.discount > 0) {
            doc.fillColor('#ef4444').text(`Discount (${quotation.discountType}):`, startTotalsX, totalsY + 15, { width: 120, align: 'right' });
            doc.text(`- Rs. ${quotation.discount.toLocaleString('en-IN')}`, 480, totalsY + 15, { width: 60, align: 'right' });
        }

        doc.fillColor('#475569').text('GST (18%):', startTotalsX, totalsY + 30, { width: 120, align: 'right' });
        doc.fillColor('#0f172a').text(`Rs. ${quotation.gstAmount.toLocaleString('en-IN')}`, 480, totalsY + 30, { width: 60, align: 'right' });

        doc.moveDown(1);
        doc.fillColor('#0f172a').fontSize(14).font('Helvetica-Bold').text('NET PAYABLE:', startTotalsX, doc.y, { width: 120, align: 'right' });
        doc.text(`Rs. ${quotation.grandTotal.toLocaleString('en-IN')}`, 450, doc.y - 14, { width: 100, align: 'right' });

        // Notes and T&C
        doc.fontSize(10).font('Helvetica-Bold').text('Terms & Conditions:', 50, totalsY + 80);
        doc.fontSize(8).font('Helvetica').fillColor('#64748b');
        doc.text('1. Payment Terms: 50% Advance for material procurement, 50% on successful installation.', 50, totalsY + 95);
        doc.text('2. Warranty: 1-Year onsite warranty on all hardware items as per brand policy.', 50, totalsY + 107);
        doc.text('3. Validity: This quotation is valid for 7 days from the date of issue.', 50, totalsY + 119);

        if (quotation.notes) {
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a').text('Additional Notes:', 50, totalsY + 135);
            doc.fontSize(9).font('Helvetica').fillColor('#475569').text(quotation.notes, 50, totalsY + 147);
        }

        // Footer Branding
        const footerY = 740;
        doc.moveTo(50, footerY - 10).lineTo(550, footerY - 10).strokeColor('#000').lineWidth(0.5).stroke();
        doc.fontSize(8).fillColor('#64748b').text('Thank you for choosing Hi-Tech Connect. We secure what matters most to you.', 50, footerY, { align: 'center' });

        doc.end();
    }
}

module.exports = new PdfService();
