// Vercel serverless function: receives the contact form and emails the lead via Resend.
// Requires env var RESEND_API_KEY (set in the Vercel project).
// Leads go to noahowsh@gmail.com from Resend's shared sender for now. On real launch:
// verify cocardanderson.com in Resend, then switch `from` to a cocardanderson.com sender
// (and optionally `to` service@cocardanderson.com).
// Email design matches the Strelva house lead-notification template (custom-repo-starter/scaffold-forms.ts).

const LEAD_TO = 'noahowsh@gmail.com';
const FROM = 'CoCard Anderson Website <onboarding@resend.dev>';

// Strelva house palette (clean + neutral: this is an internal notice, not a customer brand email)
const C = {
  ink: '#14181c',
  faint: '#9aa1a8',
  hairline: '#e6e7e9',
  page: '#f3f4f5',
  card: '#ffffff',
  accent: '#447a4f', // Strelva ink sage
  panel: '#f7f8f8',
  font: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
};

const escapeHtml = (s) =>
  String(s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));

function renderFormEmailHtml(meta, fields) {
  const rows = fields
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 0;vertical-align:top;width:34%;color:${C.faint};font-size:13px;">${escapeHtml(label)}</td>` +
        `<td style="padding:8px 0;vertical-align:top;color:${C.ink};font-size:14px;white-space:pre-wrap;word-break:break-word;">${escapeHtml(value)}</td></tr>`
    )
    .join(`<tr><td colspan="2" style="border-top:1px solid ${C.hairline};font-size:0;line-height:0;">&nbsp;</td></tr>`);

  return `<!doctype html><html><body style="margin:0;background:${C.page};font-family:${C.font};">
  <div style="display:none;max-height:0;overflow:hidden;">New ${escapeHtml(meta.formName)} submission from your ${escapeHtml(meta.siteName)} website.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.page};padding:24px 12px;"><tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${C.card};border:1px solid ${C.hairline};border-radius:12px;overflow:hidden;">
      <tr><td style="padding:20px 28px;border-bottom:1px solid ${C.hairline};">
        <p style="margin:0;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:${C.faint};">${escapeHtml(meta.siteName)}</p>
        <p style="margin:4px 0 0;font-size:19px;font-weight:600;color:${C.ink};">New ${escapeHtml(meta.formName)} submission</p>
      </td></tr>
      <tr><td style="padding:20px 28px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
      </td></tr>
      <tr><td style="padding:14px 28px;border-top:1px solid ${C.hairline};background:${C.panel};">
        <p style="margin:0;font-size:12px;color:${C.faint};">Submitted ${escapeHtml(meta.submittedAt)} &middot; sent by your ${escapeHtml(meta.siteName)} site, delivered by <span style="color:${C.accent};">Strelva</span>. Reply to reach them directly.</p>
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
}

function renderFormEmailText(meta, fields) {
  const lines = fields.map(([label, value]) => `${label}: ${value}`).join('\n');
  return (
    `${meta.siteName} — New ${meta.formName} submission\n` +
    `${'-'.repeat(40)}\n` +
    `${lines}\n\n` +
    `Submitted ${meta.submittedAt}. Sent by your ${meta.siteName} site, delivered by Strelva. Reply to reach them directly.`
  );
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) return res.status(500).json({ error: 'Email is not configured yet.' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (_) { body = {}; } }
  body = body || {};

  const get = (k) => (body[k] == null ? '' : String(body[k]).trim());
  const name = get('name'), business = get('business'), email = get('email');
  const phone = get('phone'), interest = get('interest'), message = get('message');

  if (!name || !business || !email) return res.status(400).json({ error: 'Missing required fields.' });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: 'Invalid email.' });

  const meta = {
    siteName: 'CoCard Anderson',
    formName: 'Quote Request',
    submittedAt: new Date().toLocaleString('en-US', {
      timeZone: 'America/New_York', dateStyle: 'medium', timeStyle: 'short',
    }) + ' ET',
  };
  const fields = [
    ['Name', name],
    ['Business', business],
    ['Email', email],
    ['Phone', phone || '(not provided)'],
    ['Interested in', interest || '(not specified)'],
    ['Message', message || '(none)'],
  ];

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to: [LEAD_TO],
        reply_to: email,
        subject: `[CoCard Anderson] Quote Request — ${name}${business ? ' (' + business + ')' : ''}`,
        html: renderFormEmailHtml(meta, fields),
        text: renderFormEmailText(meta, fields),
      }),
    });
    if (!r.ok) {
      const detail = await r.text().catch(() => '');
      return res.status(502).json({ error: 'Send failed.', detail: detail.slice(0, 300) });
    }
    return res.status(200).json({ ok: true });
  } catch (_) {
    return res.status(500).json({ error: 'Server error.' });
  }
}
