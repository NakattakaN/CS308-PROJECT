const nodemailer = require('nodemailer');

let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    console.log('📧 Email: using Gmail SMTP');
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    console.log('📧 Email: no SMTP credentials — using Ethereal test account');
    console.log('   View sent emails at: https://ethereal.email');
  }

  return transporter;
}

async function sendInvoiceEmail(to, name, orderId, total, pdfBuffer) {
  const transport = await getTransporter();
  const shortId = orderId.slice(-8).toUpperCase();

  const info = await transport.sendMail({
    from: `"Saatinden" <${process.env.SMTP_USER || 'noreply@saatinden.com'}>`,
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

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`📧 Invoice preview (Ethereal): ${previewUrl}`);
  }
}

module.exports = { sendInvoiceEmail };
