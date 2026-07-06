// Vercel serverless function: receives the contact form and emails the lead via Resend.
// Requires env var RESEND_API_KEY (set in the Vercel project).
// "for now" leads go to noahowsh@gmail.com from Resend's shared sender (no domain verification needed,
// as long as that address is the Resend account owner). On real launch: verify cocardanderson.com,
// then switch `from` to a cocardanderson.com sender and `to` to service@cocardanderson.com.

const LEAD_TO = 'noahowsh@gmail.com';
const FROM = 'CoCard Website <onboarding@resend.dev>';

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

  const esc = (s) => String(s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
  const html =
    '<h2>New CoCard Anderson website request</h2>' +
    '<p><strong>Name:</strong> ' + esc(name) + '</p>' +
    '<p><strong>Business:</strong> ' + esc(business) + '</p>' +
    '<p><strong>Email:</strong> ' + esc(email) + '</p>' +
    '<p><strong>Phone:</strong> ' + (esc(phone) || '(not provided)') + '</p>' +
    '<p><strong>Interested in:</strong> ' + (esc(interest) || '(not specified)') + '</p>' +
    '<p><strong>Message:</strong><br>' + (esc(message).replace(/\n/g, '<br>') || '(none)') + '</p>';

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to: [LEAD_TO],
        reply_to: email,
        subject: 'New request from ' + name + (business ? ' (' + business + ')' : ''),
        html
      })
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
