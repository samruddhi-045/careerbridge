const nodemailer = require("nodemailer");

// lazily created so we don't try to connect to SMTP unless it's actually configured
let transporter = null;
const isSmtpConfigured = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
};

// single entry point for sending mail. With no SMTP_* vars set (default for local dev)
// it just logs the email to the console so links are easy to click/copy while testing —
// fill in SMTP_HOST/PORT/USER/PASS in .env (e.g. Mailtrap or a Gmail app password) to send for real.
const sendEmail = async ({ to, subject, html, text }) => {
  if (!isSmtpConfigured()) {
    console.log("\n===== DEV EMAIL (no SMTP configured) =====");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(text || html);
    console.log("============================================\n");
    return;
  }

  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || `"CareerBridge" <no-reply@careerbridge.local>`,
    to,
    subject,
    html,
    text,
  });
};

module.exports = { sendEmail };
