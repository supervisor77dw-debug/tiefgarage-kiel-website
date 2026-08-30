const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email) && email.length <= 254;
};

const sanitizeString = (str, maxLen = 1000) => {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLen);
};

const normalizeType = (typeStr) => {
  if (typeStr.includes('PKW')) return 'PKW';
  if (typeStr.includes('Motorrad')) return 'Motorrad';
  if (typeStr.includes('beides')) return 'PKW & Motorrad';
  return null;
};

const buildInternalEmail = (data) => {
  const typeLabel = data.type;
  const text = `Neue Stellplatzanfrage über tiefgarage-kiel.de

Stellplatzart:
${typeLabel}

Name:
${data.name}

Telefon:
${data.phone}

E-Mail:
${data.email}

Gewünschter Mietbeginn:
${data.start || '(nicht angegeben)'}

Nachricht:
${data.message || '(keine Nachricht)'}

—

Quelle:
tiefgarage-kiel.de`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; color: #10243b; background: #f6f8fa; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { border-bottom: 3px solid #8bc53f; padding-bottom: 20px; margin-bottom: 20px; }
    .header h1 { margin: 0 0 5px; color: #10243b; font-size: 20px; }
    .field { margin-bottom: 16px; }
    .field strong { color: #10243b; display: block; margin-bottom: 4px; }
    .field-value { color: #5d6b7a; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e9ee; font-size: 12px; color: #5d6b7a; }
    .green { color: #8bc53f; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Neue Stellplatzanfrage</h1>
      <p class="green" style="margin:0; font-weight:bold;">tiefgarage-kiel.de</p>
    </div>
    <div class="field">
      <strong>Stellplatzart:</strong>
      <div class="field-value">${data.type}</div>
    </div>
    <div class="field">
      <strong>Name:</strong>
      <div class="field-value">${data.name}</div>
    </div>
    <div class="field">
      <strong>Telefon:</strong>
      <div class="field-value">${data.phone}</div>
    </div>
    <div class="field">
      <strong>E-Mail:</strong>
      <div class="field-value">${data.email}</div>
    </div>
    <div class="field">
      <strong>Gewünschter Mietbeginn:</strong>
      <div class="field-value">${data.start || '(nicht angegeben)'}</div>
    </div>
    <div class="field">
      <strong>Nachricht:</strong>
      <div class="field-value">${data.message ? data.message.replace(/\n/g, '<br>') : '(keine Nachricht)'}</div>
    </div>
    <div class="footer">
      <p>Diese E-Mail wurde automatisch generiert. Bitte antworten Sie direkt an ${data.email}.</p>
    </div>
  </div>
</body>
</html>`;

  return { text, html };
};

const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const buildConfirmationEmail = (data) => {
  const startRow = data.start
    ? `Gewünschter Mietbeginn: ${data.start}\n`
    : '';
  const startHtml = data.start
    ? `<tr>
              <td style="padding:0 0 10px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:22px;color:#66717D;">Gewünschter Mietbeginn</td>
              <td align="right" style="padding:0 0 10px 20px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:22px;color:#1F2933;font-weight:bold;">${escapeHtml(data.start)}</td>
            </tr>`
    : '';
  const text = `Vielen Dank für Ihre Anfrage zu einem Stellplatz in der Tiefgarage Kiel.

Wir haben Ihre Nachricht erhalten und melden uns kurzfristig zur aktuellen Verfügbarkeit des gewünschten Stellplatzes.

Ihre Anfrage
Stellplatzart: ${data.type}
${startRow}Name: ${data.name}

Tiefgarage Kiel
Eckernförder Straße 85–87
24118 Kiel

PKW-Stellplatz: 108 € / Monat inkl. MwSt.
Motorrad: 59 € / Monat inkl. MwSt.
Zufahrtshöhe PKW: max. 1,90 m

Bei Rückfragen erreichen Sie uns unter anfrage@tiefgarage-kiel.de.
tiefgarage-kiel.de

Diese Nachricht wurde automatisch als Bestätigung Ihrer Stellplatzanfrage versendet.`;

  const html = `<!doctype html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
</head>
<body style="margin:0;padding:0;background-color:#F3F5F7;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background-color:#F3F5F7;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#FFFFFF;">
          <tr>
            <td style="padding:30px 32px 20px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td><img src="https://www.tiefgarage-kiel.de/assets/tiefgarage-kiel-logo.png" width="170" alt="Tiefgarage Kiel" style="display:block;border:0;outline:none;text-decoration:none;width:170px;height:auto;"></td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px;"><div style="height:3px;line-height:3px;background-color:#72C72C;font-size:3px;">&nbsp;</div></td>
          </tr>
          <tr>
            <td style="padding:28px 32px 0 32px;font-family:Arial,Helvetica,sans-serif;color:#1F2933;">
              <h1 style="margin:0;font-size:26px;line-height:34px;font-weight:bold;color:#102F52;">Vielen Dank für Ihre Anfrage!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 32px 0 32px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:25px;color:#1F2933;">
              <p style="margin:0 0 14px 0;">Vielen Dank für Ihre Anfrage zu einem Stellplatz in der Tiefgarage Kiel.</p>
              <p style="margin:0;">Wir haben Ihre Nachricht erhalten und melden uns kurzfristig zur aktuellen Verfügbarkeit des gewünschten Stellplatzes.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 0 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border:1px solid #E2E6EA;background-color:#F9FAFB;">
                <tr>
                  <td style="padding:18px 20px 8px 20px;font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:23px;font-weight:bold;color:#102F52;">Ihre Anfrage</td>
                </tr>
                <tr>
                  <td style="padding:4px 20px 10px 20px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                      <tr>
                        <td style="padding:0 0 10px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:22px;color:#66717D;">Stellplatzart</td>
                        <td align="right" style="padding:0 0 10px 20px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:22px;color:#1F2933;font-weight:bold;">${escapeHtml(data.type)}</td>
                      </tr>
                      ${startHtml}
                      <tr>
                        <td style="padding:0 0 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:22px;color:#66717D;">Name</td>
                        <td align="right" style="padding:0 0 8px 20px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:22px;color:#1F2933;font-weight:bold;">${escapeHtml(data.name)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:26px 32px 0 32px;font-family:Arial,Helvetica,sans-serif;color:#1F2933;">
              <h2 style="margin:0 0 10px 0;font-size:18px;line-height:25px;font-weight:bold;color:#102F52;">Tiefgarage Kiel</h2>
              <p style="margin:0;font-size:15px;line-height:23px;color:#66717D;">Eckernförder Straße 85–87<br>24118 Kiel</p>
              <p style="margin:14px 0 0 0;font-size:15px;line-height:23px;color:#1F2933;"><strong>PKW-Stellplatz:</strong> 108 € / Monat inkl. MwSt.<br><strong>Motorrad:</strong> 59 € / Monat inkl. MwSt.<br><strong>Zufahrtshöhe PKW:</strong> max. 1,90 m</p>
            </td>
          </tr>
          <tr>
            <td style="padding:26px 32px 30px 32px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:23px;color:#1F2933;">
              <p style="margin:0 0 8px 0;">Bei Rückfragen erreichen Sie uns unter</p>
              <p style="margin:0 0 8px 0;"><a href="mailto:anfrage@tiefgarage-kiel.de" style="color:#102F52;font-weight:bold;text-decoration:underline;">anfrage@tiefgarage-kiel.de</a></p>
              <p style="margin:0;"><a href="https://www.tiefgarage-kiel.de" style="color:#102F52;font-weight:bold;text-decoration:underline;">tiefgarage-kiel.de</a></p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 24px 32px;border-top:1px solid #E2E6EA;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#66717D;">
              <strong style="color:#102F52;">Tiefgarage Kiel</strong><br>
              Eckernförder Straße 85–87 · 24118 Kiel<br>
              <a href="https://www.tiefgarage-kiel.de" style="color:#66717D;text-decoration:underline;">tiefgarage-kiel.de</a><br><br>
              Diese Nachricht wurde automatisch als Bestätigung Ihrer Stellplatzanfrage versendet.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { text, html };
};

export default async (req, res) => {
  const requestId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9);
  const log = (stage) => {
    console.log(`[anfrage:${requestId}] ${stage}`);
  };
  const logError = (stage, type) => {
    console.error(`[anfrage:${requestId}] error stage=${stage} type=${type}`);
  };

  log('request_received');

  if (req.method !== 'POST') {
    logError('request', 'method_not_post');
    return res.status(405).json({ ok: false, error: 'Method not allowed', requestId });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const contactTo = process.env.CONTACT_TO;
  const contactFrom = process.env.CONTACT_FROM;

  if (!apiKey || !contactTo || !contactFrom) {
    logError('environment', 'missing_configuration');
    return res.status(500).json({ ok: false, error: 'Konfiguration nicht vollständig. Bitte später erneut versuchen.', requestId });
  }
  
  log('env_ok');

  const { type, name, phone, email, start, message, company_website, timestamp } = req.body || {};

  log('body_parsed');

  // Honeypot check
  if (company_website && company_website.trim().length > 0) {
    logError('spam_check', 'honeypot');
    return res.status(200).json({ ok: true, message: 'Anfrage erhalten', requestId });
  }

  // Time check: reject if submitted too quickly
  if (timestamp) {
    const submittedAt = parseInt(timestamp, 10);
    const now = Date.now();
    const diff = now - submittedAt;
    if (diff < 2000) {
      logError('validation', 'timing_too_fast');
      return res.status(400).json({ ok: false, error: 'Bitte etwas gedulden vor dem Absenden.', requestId });
    }
  }

  // Validate required fields
  if (!name || !email || !type) {
    logError('validation', 'required_fields_missing');
    return res.status(400).json({ ok: false, error: 'Erforderliche Felder fehlen', requestId });
  }

  // Sanitize and validate
  const sanitizedName = sanitizeString(name, 100);
  const sanitizedPhone = sanitizeString(phone, 50);
  const sanitizedEmail = sanitizeString(email, 254);
  const sanitizedStart = sanitizeString(start, 100);
  const sanitizedMessage = sanitizeString(message, 3000);
  const normalizedType = normalizeType(type);

  if (!sanitizedName || !validateEmail(sanitizedEmail) || !normalizedType) {
    logError('validation', 'invalid_input');
    return res.status(400).json({ ok: false, error: 'Ungültige Eingabedaten', requestId });
  }

  log('validation_ok');

  // Prepare email data
  const emailData = {
    type: normalizedType,
    name: sanitizedName,
    phone: sanitizedPhone || '(nicht angegeben)',
    email: sanitizedEmail,
    start: sanitizedStart,
    message: sanitizedMessage,
  };

  const subject = `Neue Stellplatzanfrage – ${normalizedType}`;
  const { text: internalText, html: internalHtml } = buildInternalEmail(emailData);
  const { text: confirmText, html: confirmHtml } = buildConfirmationEmail(emailData);

  try {
    log('resend_internal_start');
    const internalRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: contactFrom,
        to: contactTo,
        reply_to: sanitizedEmail,
        subject: subject,
        text: internalText,
        html: internalHtml,
      }),
    });

    if (!internalRes.ok) {
      logError('resend_internal', 'request_failed');
      return res.status(500).json({ ok: false, error: 'Anfrage konnte nicht versendet werden. Bitte versuchen Sie es später erneut.', requestId });
    }

    const internalData = await internalRes.json();
    const internalEmailId = internalData.id;
    if (!internalEmailId) {
      logError('resend_internal', 'missing_email_id');
      return res.status(500).json({ ok: false, error: 'Anfrage konnte nicht versendet werden. Bitte versuchen Sie es später erneut.', requestId });
    }
    console.log(`[anfrage:${requestId}] resend_internal_success id=${internalEmailId}`);

    log('resend_confirmation_start');
    const confirmRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: contactFrom,
        to: sanitizedEmail,
        reply_to: 'anfrage@tiefgarage-kiel.de',
        subject: 'Ihre Stellplatzanfrage – Tiefgarage Kiel',
        text: confirmText,
        html: confirmHtml,
      }),
    });

    if (!confirmRes.ok) {
      logError('resend_confirmation', 'request_failed');
      log('response_200');
      return res.status(200).json({ 
        ok: true,
        internalSent: true,
        confirmationSent: false,
        requestId, 
        internalEmailId 
      });
    } else {
      const confirmData = await confirmRes.json();
      const confirmEmailId = confirmData.id;
      if (!confirmEmailId) {
        logError('resend_confirmation', 'missing_email_id');
        log('response_200');
        return res.status(200).json({
          ok: true,
          internalSent: true,
          confirmationSent: false,
          requestId,
          internalEmailId
        });
      }
      console.log(`[anfrage:${requestId}] resend_confirmation_success id=${confirmEmailId}`);
      log('response_200');
      return res.status(200).json({ 
        ok: true,
        internalSent: true,
        confirmationSent: true,
        requestId, 
        internalEmailId,
        confirmEmailId
      });
    }
  } catch (error) {
    logError('handler', 'unexpected_error');
    return res.status(500).json({ ok: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.', requestId });
  }
};
