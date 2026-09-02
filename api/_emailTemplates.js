/**
 * Branded CCDesigner / Rhythmstix email bodies (HTML + plain text).
 * Used when sending via Resend SDK from serverless routes.
 * Supabase Auth emails (verify / reset) should also be branded in the Dashboard —
 * see docs/EMAIL_TEMPLATES.md.
 */

const BRAND = {
  name: 'CCDesigner',
  org: 'Rhythmstix',
  site: 'https://www.ccdesigner.co.uk',
  rhythmstix: 'https://www.rhythmstix.co.uk',
  support: 'mailto:hello@rhythmstix.co.uk',
  primary: '#002D24',
  accent: '#008272',
};

function wrapHtml(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f4f4f2;font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f2;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:560px;">
        <tr><td style="background:${BRAND.primary};padding:20px 28px;">
          <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:0.02em;">${BRAND.name}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#b8d4cc;">from ${BRAND.org}</p>
        </td></tr>
        <tr><td style="padding:28px;">
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:16px 28px 24px;border-top:1px solid #e8e8e4;font-size:12px;color:#666;">
          <p style="margin:0;">© ${new Date().getFullYear()} ${BRAND.name} · <a href="${BRAND.rhythmstix}" style="color:${BRAND.accent};">${BRAND.org}</a></p>
          <p style="margin:8px 0 0;">This email relates to your CCDesigner account. If you did not expect it, you can ignore this message.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function accountCreatedEmail({ displayName, email, temporaryPassword, loginUrl }) {
  const name = displayName || 'there';
  const subject = `Your ${BRAND.name} account is ready`;
  const html = wrapHtml(
    subject,
    `<p style="margin:0 0 12px;font-size:16px;">Hello ${escapeHtml(name)},</p>
     <p style="margin:0 0 12px;">An account has been created for you on <strong>${BRAND.name}</strong> (${escapeHtml(email)}).</p>
     ${
       temporaryPassword
         ? `<p style="margin:0 0 12px;">Temporary password: <code style="background:#f0f0ec;padding:2px 6px;border-radius:4px;">${escapeHtml(temporaryPassword)}</code></p>
            <p style="margin:0 0 12px;">You will be asked to choose a new password when you first sign in.</p>`
         : `<p style="margin:0 0 12px;">Check your inbox for an activation link, or sign in if you already set a password.</p>`
     }
     <p style="margin:20px 0;"><a href="${escapeAttr(loginUrl)}" style="display:inline-block;background:${BRAND.accent};color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;">Sign in to ${BRAND.name}</a></p>`,
  );
  const text = [
    `Hello ${name},`,
    '',
    `An account has been created for you on ${BRAND.name} (${email}).`,
    temporaryPassword
      ? `Temporary password: ${temporaryPassword}\nYou will be asked to choose a new password when you first sign in.`
      : 'Check your inbox for an activation link, or sign in if you already set a password.',
    '',
    `Sign in: ${loginUrl}`,
    '',
    `— ${BRAND.name} / ${BRAND.org}`,
  ].join('\n');
  return { subject, html, text };
}

export function verifyEmailTemplate({ displayName, verifyUrl }) {
  const name = displayName || 'there';
  const subject = `Verify your ${BRAND.name} email`;
  const html = wrapHtml(
    subject,
    `<p style="margin:0 0 12px;font-size:16px;">Hello ${escapeHtml(name)},</p>
     <p style="margin:0 0 12px;">Please confirm your email address to activate your ${BRAND.name} account.</p>
     <p style="margin:20px 0;"><a href="${escapeAttr(verifyUrl)}" style="display:inline-block;background:${BRAND.accent};color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;">Verify email</a></p>
     <p style="margin:0;font-size:13px;color:#666;">If the button does not work, copy this link:<br/>${escapeHtml(verifyUrl)}</p>`,
  );
  const text = `Hello ${name},\n\nVerify your email for ${BRAND.name}:\n${verifyUrl}\n\n— ${BRAND.name} / ${BRAND.org}`;
  return { subject, html, text };
}

export function activateAccountEmail({ displayName, activateUrl }) {
  const name = displayName || 'there';
  const subject = `Activate your ${BRAND.name} account`;
  const html = wrapHtml(
    subject,
    `<p style="margin:0 0 12px;font-size:16px;">Hello ${escapeHtml(name)},</p>
     <p style="margin:0 0 12px;">You have been invited to ${BRAND.name}. Click below to set your password and activate your account.</p>
     <p style="margin:20px 0;"><a href="${escapeAttr(activateUrl)}" style="display:inline-block;background:${BRAND.accent};color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;">Activate account</a></p>`,
  );
  const text = `Hello ${name},\n\nActivate your ${BRAND.name} account:\n${activateUrl}\n\n— ${BRAND.name} / ${BRAND.org}`;
  return { subject, html, text };
}

export function resetPasswordEmail({ displayName, resetUrl }) {
  const name = displayName || 'there';
  const subject = `Reset your ${BRAND.name} password`;
  const html = wrapHtml(
    subject,
    `<p style="margin:0 0 12px;font-size:16px;">Hello ${escapeHtml(name)},</p>
     <p style="margin:0 0 12px;">We received a request to reset your password. This link expires soon.</p>
     <p style="margin:20px 0;"><a href="${escapeAttr(resetUrl)}" style="display:inline-block;background:${BRAND.accent};color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;">Reset password</a></p>
     <p style="margin:0;font-size:13px;color:#666;">If you did not request this, you can ignore this email.</p>`,
  );
  const text = `Hello ${name},\n\nReset your password:\n${resetUrl}\n\nIf you did not request this, ignore this email.\n\n— ${BRAND.name} / ${BRAND.org}`;
  return { subject, html, text };
}

export function passwordChangedEmail({ displayName }) {
  const name = displayName || 'there';
  const subject = `Your ${BRAND.name} password was changed`;
  const html = wrapHtml(
    subject,
    `<p style="margin:0 0 12px;font-size:16px;">Hello ${escapeHtml(name)},</p>
     <p style="margin:0 0 12px;">Your ${BRAND.name} password was changed successfully. If you did not make this change, contact support immediately and reset your password.</p>
     <p style="margin:0;"><a href="${BRAND.support}" style="color:${BRAND.accent};">Contact support</a></p>`,
  );
  const text = `Hello ${name},\n\nYour ${BRAND.name} password was changed. If this was not you, contact support.\n\n— ${BRAND.name} / ${BRAND.org}`;
  return { subject, html, text };
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/'/g, '&#39;');
}

/**
 * Send via Resend REST API when RESEND_API_KEY is set.
 * Returns { sent: boolean, id?: string, skipped?: string, error?: string }
 */
export async function sendResendEmail({ to, subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { sent: false, skipped: 'RESEND_API_KEY not set' };
  }
  const from =
    process.env.RESEND_FROM_EMAIL ||
    'CCDesigner <noreply@ccdesigner.co.uk>';
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to: [to], subject, html, text }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { sent: false, error: data?.message || `Resend ${res.status}` };
    }
    return { sent: true, id: data.id };
  } catch (e) {
    return { sent: false, error: e instanceof Error ? e.message : 'send failed' };
  }
}

export { BRAND };
