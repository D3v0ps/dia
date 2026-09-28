// Tar emot formuläret "Boka ett möte" och skickar det som e-post via Resend (https://resend.com).
//
// Miljövariabler i Vercel (Settings → Environment Variables):
//   RESEND_API_KEY  API-nyckel från Resend
//   KONTAKT_TILL    mottagare, t.ex. info@diakonsult.se (flera separeras med komma)
//   KONTAKT_FRAN    avsändare på en verifierad domän, t.ex. "Dia webbplats <webb@diakonsult.se>"
//
// Saknas konfigurationen svarar funktionen 503 och sidan öppnar i stället besökarens
// e-postprogram med meddelandet ifyllt.

const MAX_LENGTH = { namn: 120, foretag: 160, kontakt: 160, roll: 2000 };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function oneLine(value) {
  return value.replace(/\s+/g, ' ').trim();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  let body;
  try {
    body = req.body;
  } catch {
    return res.status(400).json({ ok: false, error: 'invalid_json' });
  }
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ ok: false, error: 'invalid_body' });
  }

  // Honungsfälla: fältet är dolt för människor, så ifyllt betyder bot. Svara ok men skicka inget.
  if (body.webbplats) {
    return res.status(200).json({ ok: true });
  }

  const data = {};
  for (const [field, max] of Object.entries(MAX_LENGTH)) {
    const value = typeof body[field] === 'string' ? body[field].trim() : '';
    if (value.length > max) {
      return res.status(400).json({ ok: false, error: 'too_long', field });
    }
    data[field] = value;
  }
  if (!data.namn || !data.kontakt) {
    return res.status(400).json({ ok: false, error: 'missing_fields' });
  }

  const { RESEND_API_KEY, KONTAKT_TILL, KONTAKT_FRAN } = process.env;
  if (!RESEND_API_KEY || !KONTAKT_TILL) {
    return res.status(503).json({ ok: false, error: 'not_configured' });
  }

  const text = [
    'Ny förfrågan via webbplatsen',
    '',
    `Namn: ${data.namn}`,
    `Företag: ${data.foretag || '–'}`,
    `Telefon/e-post: ${data.kontakt}`,
    '',
    'Roll de vill tillsätta:',
    data.roll || '–',
  ].join('\n');

  const email = {
    from: KONTAKT_FRAN || 'Dia webbplats <onboarding@resend.dev>',
    to: KONTAKT_TILL.split(',').map((address) => address.trim()).filter(Boolean),
    subject: oneLine(`Ny förfrågan: ${data.foretag || data.namn}`),
    text,
  };
  if (EMAIL.test(data.kontakt)) {
    email.reply_to = data.kontakt;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(email),
    });
    if (!response.ok) {
      console.error('Resend svarade', response.status, await response.text());
      return res.status(502).json({ ok: false, error: 'send_failed' });
    }
  } catch (error) {
    console.error('Kunde inte nå Resend', error);
    return res.status(502).json({ ok: false, error: 'send_failed' });
  }

  return res.status(200).json({ ok: true });
}
