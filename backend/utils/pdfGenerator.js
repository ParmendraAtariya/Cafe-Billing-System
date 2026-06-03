const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

/**
 * Generate a professional PDF bill
 * @param {Object} bill - Bill document
 * @param {Object} order - Order document
 * @returns {Buffer} PDF buffer
 */
const generateBillPDF = async (bill, order) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const GREEN = '#00704A';
      const DARK = '#1C1C1C';
      const GRAY = '#6B6B6B';

      // ─── Header ─────────────────────────────────────────────────────────────
      doc
        .rect(0, 0, doc.page.width, 100)
        .fill(GREEN);

      doc
        .fontSize(28)
        .font('Helvetica-Bold')
        .fillColor('#FFFFFF')
        .text('☕ CAFE BILLING', 50, 30);

      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#CCFFCC')
        .text(bill.branch?.name || 'Main Branch', 50, 62)
        .text(bill.branch?.address || '', 50, 76)
        .text(bill.branch?.phone || '', 50, 90);

      // Invoice number on right
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#FFFFFF')
        .text(`INVOICE`, doc.page.width - 200, 30, { width: 150, align: 'right' })
        .fontSize(16)
        .text(bill.invoiceNumber, doc.page.width - 200, 48, { width: 150, align: 'right' })
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#CCFFCC')
        .text(new Date(bill.createdAt).toLocaleString('en-IN'), doc.page.width - 200, 72, { width: 150, align: 'right' });

      // ─── Bill To ─────────────────────────────────────────────────────────────
      doc.moveDown(3).fillColor(DARK);

      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor(GRAY)
        .text('BILLED TO', 50, 120);

      doc
        .fontSize(13)
        .font('Helvetica-Bold')
        .fillColor(DARK)
        .text(bill.customerName || 'Walk-in Customer', 50, 135);

      if (bill.customerPhone) {
        doc.fontSize(10).font('Helvetica').fillColor(GRAY).text(bill.customerPhone, 50, 152);
      }

      // Payment method badge
      doc
        .roundedRect(doc.page.width - 160, 120, 110, 30, 5)
        .fill(GREEN);
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#FFFFFF')
        .text((bill.paymentMethod || 'CASH').toUpperCase(), doc.page.width - 155, 129, { width: 100, align: 'center' });

      // ─── Divider ─────────────────────────────────────────────────────────────
      doc.moveTo(50, 175).lineTo(doc.page.width - 50, 175).strokeColor('#E5E5E5').lineWidth(1).stroke();

      // ─── Table Header ─────────────────────────────────────────────────────────
      const tableTop = 185;
      const col = { item: 50, qty: 310, price: 370, total: 460 };

      doc.rect(50, tableTop, doc.page.width - 100, 25).fill('#F5F5F5');

      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor(GRAY)
        .text('ITEM', col.item + 5, tableTop + 8)
        .text('QTY', col.qty, tableTop + 8, { width: 50, align: 'center' })
        .text('PRICE', col.price, tableTop + 8, { width: 70, align: 'right' })
        .text('TOTAL', col.total, tableTop + 8, { width: 70, align: 'right' });

      // ─── Items ───────────────────────────────────────────────────────────────
      let y = tableTop + 35;
      const items = bill.items || order?.items || [];

      for (const item of items) {
        // Alternating rows
        if (items.indexOf(item) % 2 === 0) {
          doc.rect(50, y - 5, doc.page.width - 100, 22).fill('#FAFAFA');
        }

        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor(DARK)
          .text(item.name, col.item + 5, y, { width: 250 });

        if (item.variant?.name) {
          doc.fontSize(8).fillColor(GRAY).text(`  ${item.variant.name}`, col.item + 5, y + 13);
        }

        doc
          .fontSize(10)
          .fillColor(DARK)
          .text(item.quantity.toString(), col.qty, y, { width: 50, align: 'center' })
          .text(`₹${item.unitPrice?.toFixed(2)}`, col.price, y, { width: 70, align: 'right' })
          .text(`₹${item.totalPrice?.toFixed(2)}`, col.total, y, { width: 70, align: 'right' });

        y += item.variant?.name ? 30 : 22;
      }

      // ─── Totals ──────────────────────────────────────────────────────────────
      doc.moveTo(50, y + 5).lineTo(doc.page.width - 50, y + 5).strokeColor('#E5E5E5').stroke();
      y += 15;

      const addTotal = (label, value, bold = false, color = DARK) => {
        doc
          .fontSize(bold ? 11 : 10)
          .font(bold ? 'Helvetica-Bold' : 'Helvetica')
          .fillColor(GRAY)
          .text(label, col.price - 120, y, { width: 160, align: 'right' })
          .fillColor(color)
          .text(`₹${parseFloat(value || 0).toFixed(2)}`, col.total, y, { width: 70, align: 'right' });
        y += 18;
      };

      addTotal('Subtotal:', bill.subtotal);
      if (bill.discountAmount > 0) addTotal('Discount:', -bill.discountAmount, false, '#E74C3C');
      addTotal('GST (18%):', bill.totalTax);

      // Grand total box
      doc.rect(col.price - 130, y, 200, 30).fill(GREEN);
      doc
        .fontSize(13)
        .font('Helvetica-Bold')
        .fillColor('#FFFFFF')
        .text('TOTAL:', col.price - 125, y + 8, { width: 90, align: 'right' })
        .text(`₹${parseFloat(bill.totalAmount || 0).toFixed(2)}`, col.total - 10, y + 8, { width: 80, align: 'right' });

      y += 50;

      // ─── QR Code ─────────────────────────────────────────────────────────────
      try {
        const qrData = JSON.stringify({
          invoice: bill.invoiceNumber,
          amount: bill.totalAmount,
          date: bill.createdAt,
        });
        const qrBuffer = await QRCode.toBuffer(qrData, { width: 80 });
        doc.image(qrBuffer, doc.page.width - 130, y, { width: 80 });
        doc.fontSize(8).fillColor(GRAY).text('Scan to verify', doc.page.width - 130, y + 83, { width: 80, align: 'center' });
      } catch (e) {
        // QR generation failed, skip
      }

      // ─── Footer ──────────────────────────────────────────────────────────────
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor(GREEN)
        .text('Thank you for visiting! ☕', 50, y, { align: 'center' });

      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor(GRAY)
        .text('This is a computer-generated invoice. No signature required.', 50, y + 18, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateBillPDF };
