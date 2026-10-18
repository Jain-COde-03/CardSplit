import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

function createTransport() {
  if (!env.EMAIL_HOST || !env.EMAIL_USER || !env.EMAIL_PASSWORD || !env.EMAIL_FROM) {
    const error = new Error('Email delivery is not configured. Add the SMTP settings to backend/.env.');
    error.code = 'EMAIL_NOT_CONFIGURED';
    error.statusCode = 503;
    throw error;
  }

  return nodemailer.createTransport({
    host: env.EMAIL_HOST,
    port: env.EMAIL_PORT,
    secure: env.EMAIL_SECURE === 'true',
    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASSWORD,
    },
  });
}

export async function sendAccountEmail({ to, subject, text, html }) {
  const transport = createTransport();
  await transport.sendMail({
    from: env.EMAIL_FROM,
    to,
    subject,
    text,
    html,
  });
}

export function isEmailDeliveryConfigured() {
  return Boolean(env.EMAIL_HOST && env.EMAIL_USER && env.EMAIL_PASSWORD && env.EMAIL_FROM);
}
