const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Sends the invoice PDF as an email attachment to the buyer
async function sendInvoiceEmail(to, name, orderId, total, pdfBuffer) {
  const shortId = orderId.slice(-8).toUpperCase();

  await transporter.sendMail({
    from: `"Saatinden" <${process.env.SMTP_USER}>`,
    to,
    subject: `Your Saatinden Invoice #${shortId}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #0f172a;">Thank you for your purchase, ${name}!</h2>
        <p style="color: #475569;">Your order <strong>#${shortId}</strong> has been confirmed.</p>
        <p style="color: #475569;">Total charged: <strong>$${total.toLocaleString()}</strong></p>
        <p style="color: #475569;">Your invoice is attached as a PDF.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 13px;">Saatinden — Premium Watch Marketplace</p>
      </div>
    `,
    attachments: [{
      filename: `saatinden-invoice-${shortId}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf'
    }]
  });
}

module.exports = { sendInvoiceEmail };
