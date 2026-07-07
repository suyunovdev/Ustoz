import nodemailer from 'nodemailer';

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendResult {
  to: string;
  success: boolean;
  error?: string;
  id?: string;
}

function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

function isConfigured(): boolean {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

export async function sendOne(input: SendEmailInput): Promise<SendResult> {
  if (!isConfigured()) {
    return { to: input.to, success: false, error: 'GMAIL_USER yoki GMAIL_APP_PASSWORD sozlanmagan' };
  }

  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `Ustoz <${process.env.GMAIL_USER}>`,
      to: input.to,
      subject: input.subject,
      html: input.html,
      ...(input.text ? { text: input.text } : {}),
    });

    return { to: input.to, success: true, id: info.messageId };
  } catch (err) {
    return {
      to: input.to,
      success: false,
      error: err instanceof Error ? err.message : 'Noma\'lum xato',
    };
  }
}

export function isGmailConfigured(): boolean {
  return isConfigured();
}
