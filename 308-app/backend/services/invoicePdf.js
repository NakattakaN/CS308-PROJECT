const PDFDocument = require('pdfkit');
const path = require('path');

const FONT_REGULAR = path.join(__dirname, '..', 'assets', 'fonts', 'Inter-Regular.ttf');
const FONT_BOLD = path.join(__dirname, '..', 'assets', 'fonts', 'Inter-Bold.ttf');

// Generates an A4 invoice PDF and returns it as a Buffer.
// We use Inter (embedded ttf) because the built-in Helvetica can't render Turkish chars.
// order = saved Order doc, user = { firstName, lastName, email }
function generateInvoicePdf(order, user) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Register fonts
    doc.registerFont('Regular', FONT_REGULAR);
    doc.registerFont('Bold', FONT_BOLD);

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Customer';
    const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    const orderId = order._id.toString().slice(-8).toUpperCase();

    // ——— Header ———
    doc.fontSize(24).font('Bold').text('Saatinden', 50, 50);
    doc.fontSize(10).font('Regular').fillColor('#666')
      .text('Premium Watch Marketplace', 50, 78);

    doc.fontSize(20).font('Bold').fillColor('#000')
      .text('INVOICE', 400, 50, { align: 'right' });
    doc.fontSize(10).font('Regular').fillColor('#666')
      .text(`#${orderId}`, 400, 75, { align: 'right' })
      .text(orderDate, 400, 88, { align: 'right' });

    // ——— Divider ———
    doc.moveTo(50, 110).lineTo(545, 110).strokeColor('#e2e8f0').stroke();

    // ——— Bill To ———
    let y = 130;
    doc.fontSize(10).font('Bold').fillColor('#999').text('BILL TO', 50, y);
    y += 16;
    doc.fontSize(11).font('Regular').fillColor('#000').text(fullName, 50, y);
    y += 15;
    doc.fontSize(10).fillColor('#555').text(user.email, 50, y);

    // ——— Ship To ———
    const addr = order.shippingAddress || {};
    y = 130;
    doc.fontSize(10).font('Bold').fillColor('#999').text('SHIP TO', 300, y);
    y += 16;
    doc.fontSize(11).font('Regular').fillColor('#000').text(addr.fullName || fullName, 300, y);
    y += 15;
    doc.fontSize(10).fillColor('#555');
    if (addr.address) { doc.text(addr.address, 300, y); y += 14; }
    if (addr.city || addr.zipCode) { doc.text([addr.city, addr.zipCode].filter(Boolean).join(' '), 300, y); }

    // ——— Items Table ———
    y = 220;
    doc.moveTo(50, y).lineTo(545, y).strokeColor('#e2e8f0').stroke();
    y += 8;

    // Table header
    doc.fontSize(9).font('Bold').fillColor('#999');
    doc.text('ITEM', 50, y);
    doc.text('QTY', 340, y, { width: 50, align: 'right' });
    doc.text('PRICE', 400, y, { width: 70, align: 'right' });
    doc.text('TOTAL', 475, y, { width: 70, align: 'right' });
    y += 18;

    doc.moveTo(50, y).lineTo(545, y).strokeColor('#f1f5f9').stroke();
    y += 8;

    // Table rows
    let subtotal = 0;
    for (const item of order.items) {
      const lineTotal = (item.price || 0) * (item.quantity || 1);
      subtotal += lineTotal;

      doc.fontSize(10).font('Regular').fillColor('#000');
      doc.text(`${item.brand || ''} ${item.name || ''}`.trim(), 50, y, { width: 280 });
      doc.text(String(item.quantity || 1), 340, y, { width: 50, align: 'right' });
      doc.text(`$${(item.price || 0).toLocaleString()}`, 400, y, { width: 70, align: 'right' });
      doc.text(`$${lineTotal.toLocaleString()}`, 475, y, { width: 70, align: 'right' });
      y += 22;
    }

    // ——— Totals ———
    y += 10;
    doc.moveTo(350, y).lineTo(545, y).strokeColor('#e2e8f0').stroke();
    y += 12;

    const shipping = 50;

    doc.fontSize(10).font('Regular').fillColor('#555');
    doc.text('Subtotal', 350, y);
    doc.text(`$${subtotal.toLocaleString()}`, 475, y, { width: 70, align: 'right' });
    y += 18;

    doc.text('Shipping (Insured)', 350, y);
    doc.text(`$${shipping.toLocaleString()}`, 475, y, { width: 70, align: 'right' });
    y += 22;

    doc.moveTo(350, y).lineTo(545, y).strokeColor('#e2e8f0').stroke();
    y += 12;

    doc.fontSize(13).font('Bold').fillColor('#000');
    doc.text('Total', 350, y);
    doc.text(`$${(order.totalAmount || 0).toLocaleString()}`, 475, y, { width: 70, align: 'right' });

    // ——— Footer ———
    doc.fontSize(9).font('Regular').fillColor('#999')
      .text('Thank you for your purchase!', 50, 750, { align: 'center', width: 495 });

    doc.end();
  });
}

module.exports = { generateInvoicePdf };
