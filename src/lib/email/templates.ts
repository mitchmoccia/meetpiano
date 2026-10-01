export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

function layout(heading: string, paragraphs: string[], action: { label: string; url: string } | null): string {
  const body = paragraphs.map((text) => `<p style="margin:0 0 16px">${escapeHtml(text)}</p>`).join('');
  const button = action
    ? `<p style="margin:24px 0"><a href="${escapeHtml(action.url)}" style="background:#29251f;color:#fffdf6;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:700">${escapeHtml(action.label)}</a></p><p style="margin:0 0 16px;font-size:13px;color:#5f574d">If the button does not work, copy this link into your browser:<br>${escapeHtml(action.url)}</p>`
    : '';
  return `<!doctype html><html lang="en"><body style="margin:0;background:#fffdf6;color:#29251f;font-family:Arial,sans-serif;font-size:16px;line-height:1.5"><div style="max-width:520px;margin:0 auto;padding:32px 24px"><p style="font-weight:800;font-size:20px;margin:0 0 24px">meetpiano.</p><h1 style="font-size:22px;margin:0 0 16px">${escapeHtml(heading)}</h1>${body}${button}<p style="margin:32px 0 0;font-size:13px;color:#5f574d">You received this because someone used this address on MeetPiano. If that was not you, you can ignore this email.</p></div></body></html>`;
}

function textBody(paragraphs: string[], url: string | null): string {
  return [...paragraphs, ...(url ? [url] : []), 'If that was not you, you can ignore this email.'].join('\n\n');
}

export function verifyEmailMessage(to: string, url: string): EmailMessage {
  const paragraphs = [
    'Confirm this email address to finish setting up your MeetPiano family account.',
    'The link works once and expires in 24 hours.'
  ];
  return {
    to,
    subject: 'Confirm your MeetPiano email',
    text: textBody(paragraphs, url),
    html: layout('Confirm your email', paragraphs, { label: 'Confirm email', url })
  };
}

export function resetPasswordMessage(to: string, url: string): EmailMessage {
  const paragraphs = [
    'Someone asked to reset the password for this MeetPiano family account.',
    'The link works once and expires in 30 minutes. Resetting signs out every other device.'
  ];
  return {
    to,
    subject: 'Reset your MeetPiano password',
    text: textBody(paragraphs, url),
    html: layout('Reset your password', paragraphs, { label: 'Choose a new password', url })
  };
}

export function existingAccountMessage(to: string, signInUrl: string, resetUrl: string): EmailMessage {
  const paragraphs = [
    'Someone tried to create a MeetPiano family account with this email, but an account already exists.',
    `You can sign in at ${signInUrl}. If you forgot the password, reset it at ${resetUrl}.`
  ];
  return {
    to,
    subject: 'You already have a MeetPiano account',
    text: textBody(paragraphs, null),
    html: layout('You already have an account', paragraphs, { label: 'Sign in', url: signInUrl })
  };
}
