const nodemailer = require('nodemailer');

let transporter;
let isEthereal = false;

async function initTransporter() {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ,
      port: process.env.SMTP_PORT ,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    // Use Ethereal Email for testing if no credentials are provided
    const testAccount = await nodemailer.createTestAccount();
    isEthereal = true;
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    console.log('Using Ethereal Email for testing. Emails will be logged to console.');
  }
}

// Sends the invoice PDF as an email attachment to the buyer
async function sendInvoiceEmail(to, name, orderId, total, pdfBuffer) {
  if (!transporter) {
    await initTransporter();
  }

  const shortId = orderId.slice(-8).toUpperCase();

  const info = await transporter.sendMail({
    from: process.env.SMTP_USER ? `"Saatinden Store" <${process.env.SMTP_USER}>` : '"Saatinden Test" <test@saatinden.local>',
    replyTo: process.env.SMTP_USER,
    to,
    subject: `Your Saatinden Invoice #${shortId}`,
    text: `Thank you for your purchase, ${name}!\n\nYour order #${shortId} has been confirmed.\nTotal charged: $${total.toLocaleString()}\n\nYour invoice is attached as a PDF.\n\nSaatinden — Premium Watch Marketplace`,
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

  if (isEthereal) {
    console.log(`Invoice email sent via Ethereal: ${nodemailer.getTestMessageUrl(info)}`);
  }
}

async function sendDiscountNotificationEmail(to, name, productName, originalPrice, newPrice, discountRate) {
  if (!transporter) await initTransporter();

  await transporter.sendMail({
    from: process.env.SMTP_USER ? `"Saatinden Store" <${process.env.SMTP_USER}>` : '"Saatinden Test" <test@saatinden.local>',
    replyTo: process.env.SMTP_USER,
    to,
    subject: `Price Drop on Your Wishlist: ${productName}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #0f172a;">Good news, ${name}!</h2>
        <p style="color: #475569;">A watch on your wishlist just got a <strong>${discountRate}% discount</strong>.</p>
        <table style="width:100%; border-collapse:collapse; margin: 16px 0;">
          <tr><td style="color:#64748b; padding: 6px 0;">Product</td><td style="font-weight:600;">${productName}</td></tr>
          <tr><td style="color:#64748b; padding: 6px 0;">Original Price</td><td style="text-decoration:line-through; color:#94a3b8;">$${originalPrice.toLocaleString()}</td></tr>
          <tr><td style="color:#64748b; padding: 6px 0;">New Price</td><td style="font-weight:700; color:#15803d; font-size:1.1em;">$${newPrice.toLocaleString()}</td></tr>
        </table>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 13px;">Saatinden — Premium Watch Marketplace</p>
      </div>
    `
  });
}

module.exports = { sendInvoiceEmail, sendDiscountNotificationEmail };
