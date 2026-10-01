import { getDb } from '@/db/client';
import { devEmailCapture } from '@/db/schema';
import { appEnv, serverEnv } from '@/lib/env';
import { log } from '@/lib/log';
import type { EmailMessage } from './templates';

const SENDGRID_ENDPOINT = 'https://api.sendgrid.com/v3/mail/send';

async function sendWithSendGrid(message: EmailMessage): Promise<void> {
  const env = serverEnv();
  const response = await fetch(SENDGRID_ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.SENDGRID_API_KEY ?? ''}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: message.to }] }],
      from: { email: env.SENDGRID_FROM_EMAIL, name: env.SENDGRID_FROM_NAME ?? 'MeetPiano' },
      subject: message.subject,
      content: [
        { type: 'text/plain', value: message.text },
        { type: 'text/html', value: message.html }
      ],
      tracking_settings: {
        click_tracking: { enable: false, enable_text: false },
        open_tracking: { enable: false }
      }
    })
  });
  if (!response.ok) {
    log.error('email.sendgrid_rejected', { status: response.status, subject: message.subject });
    throw new Error(`SendGrid rejected the message (${response.status}).`);
  }
}

async function captureForDevelopment(message: EmailMessage): Promise<void> {
  if (appEnv() === 'production') throw new Error('Captured email is not allowed in production.');
  await getDb().insert(devEmailCapture).values({ toAddress: message.to, subject: message.subject, textBody: message.text });
}

/** Sends transactional email. Development and preview capture mail in the development database instead of delivering it. */
export async function sendEmail(message: EmailMessage): Promise<void> {
  try {
    if (serverEnv().EMAIL_TRANSPORT === 'sendgrid') await sendWithSendGrid(message);
    else await captureForDevelopment(message);
    log.info('email.sent', { transport: serverEnv().EMAIL_TRANSPORT, subject: message.subject });
  } catch (error) {
    log.error('email.failed', { subject: message.subject, reason: error instanceof Error ? error.message : 'unknown' });
    throw error;
  }
}
