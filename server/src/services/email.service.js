import nodemailer from "nodemailer";

let cachedTransport = null;

function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;
  if (!cachedTransport) {
    cachedTransport = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }
  return cachedTransport;
}

export async function sendEmail({ to, subject, text, html }) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@planorka.local";
  const transport = getTransport();

  if (!transport) {
    console.log(`[email disabled] To: ${to}\nSubject: ${subject}\n${text}`);
    return { skipped: true };
  }

  await transport.sendMail({ from, to, subject, text, html });
  return { skipped: false };
}
