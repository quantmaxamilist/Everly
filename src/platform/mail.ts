/**
 * Email via Resend (https://resend.com). Set RESEND_API_KEY in Vercel and verify asteria-events.com in Resend.
 * Without a key, emails are skipped silently and everything else keeps working.
 */
const FROM = process.env.MAIL_FROM || 'Asteria <hello@asteria-events.com>';
export const mailConfigured = () => !!process.env.RESEND_API_KEY;

const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export function wrap(title: string, body: string, cta?: { href: string; label: string }) {
  return `<!doctype html><html><body style="margin:0;background:#f4efe8;font-family:Arial,sans-serif;color:#1c1c1c">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">
    <p style="font-family:Georgia,serif;font-size:22px;letter-spacing:.08em;color:#43432f;margin:0 0 24px">ASTERIA</p>
    <div style="background:#fff;border-radius:18px;padding:28px">
      <h1 style="font-family:Georgia,serif;font-weight:normal;font-size:24px;color:#2a2a1e;margin:0 0 12px">${esc(title)}</h1>
      <div style="font-size:15px;line-height:1.6;color:#444">${body}</div>
      ${cta ? `<p style="margin:24px 0 0"><a href="${cta.href}" style="background:#58583f;color:#fff;text-decoration:none;padding:12px 22px;border-radius:99px;display:inline-block">${esc(cta.label)}</a></p>` : ''}
    </div>
    <p style="font-size:12px;color:#6b6a5c;margin:18px 4px 0">Asteria · asteria-events.com</p>
  </div></body></html>`;
}

export async function sendMail(to: string, subject: string, html: string): Promise<boolean> {
  if (!process.env.RESEND_API_KEY || !to) return false;
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [to], subject, html }),
    });
    return r.ok;
  } catch { return false; }
}
export const escapeHtml = esc;
