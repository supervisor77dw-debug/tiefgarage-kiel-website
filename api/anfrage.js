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

const buildConfirmationEmail = (email) => {
  const text = `Vielen Dank für Ihre Anfrage.

Wir haben Ihre Nachricht erhalten und melden uns kurzfristig zur aktuellen Verfügbarkeit des gewünschten Stellplatzes.

Tiefgarage Kiel
Eckernförder Straße 85–87
24116 Kiel

tiefgarage-kiel.de

Bitte antworten Sie nicht auf diese automatische Nachricht. Bei Rückfragen erreichen Sie uns unter anfrage@tiefgarage-kiel.de.`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; color: #10243b; background: #f6f8fa; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { border-bottom: 3px solid #8bc53f; padding-bottom: 20px; margin-bottom: 20px; }
    .header h1 { margin: 0; color: #10243b; font-size: 24px; }
    .content { line-height: 1.6; color: #5d6b7a; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e9ee; font-size: 12px; color: #5d6b7a; }
    .address { font-style: normal; margin: 15px 0; }
    .green { color: #8bc53f; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Vielen Dank!</h1>
    </div>
    <div class="content">
      <p>Vielen Dank für Ihre Anfrage.</p>
      <p>Wir haben Ihre Nachricht erhalten und melden uns kurzfristig zur aktuellen Verfügbarkeit des gewünschten Stellplatzes.</p>
      <div class="address">
        <strong>Tiefgarage Kiel</strong><br>
        Eckernförder Straße 85–87<br>
        24116 Kiel<br><br>
        <span class="green">tiefgarage-kiel.de</span>
      </div>
    </div>
    <div class="footer">
      <p>Bitte antworten Sie nicht auf diese automatische Nachricht. Bei Rückfragen erreichen Sie uns unter anfrage@tiefgarage-kiel.de.</p>
    </div>
  </div>
</body>
</html>`;

  return { text, html };
};

export default async (req, res) => {
  // Generate unique request ID for tracing
  const requestId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9);
  const log = (stage, detail = '') => {
    console.log(`[anfrage:${requestId}] ${stage}${detail ? ' ' + detail : ''}`);
  };

  log('request_received', `method=${req.method}`);

  if (req.method !== 'POST') {
    log('error', 'method_not_post');
    return res.status(405).json({ error: 'Method not allowed', requestId });
  }

  log('method_ok');

  const apiKey = process.env.RESEND_API_KEY;
  const contactTo = process.env.CONTACT_TO;
  const contactFrom = process.env.CONTACT_FROM;

  if (!apiKey || !contactTo || !contactFrom) {
    log('error', `env_missing apiKey=${!!apiKey} contactTo=${!!contactTo} contactFrom=${!!contactFrom}`);
    return res.status(500).json({ error: 'Konfiguration nicht vollständig. Bitte später erneut versuchen.', requestId });
  }
  
  log('env_ok');

  const { type, name, phone, email, start, message, company_website, timestamp } = req.body;

  log('body_parsed');

  // Honeypot check
  if (company_website && company_website.trim().length > 0) {
    log('honeypot_triggered');
    return res.status(200).json({ ok: true, message: 'Anfrage erhalten', requestId });
  }

  // Time check: reject if submitted too quickly
  if (timestamp) {
    const submittedAt = parseInt(timestamp, 10);
    const now = Date.now();
    const diff = now - submittedAt;
    log('timing_check', `diff=${diff}ms`);
    if (diff < 2000) {
      log('error', 'timing_too_fast');
      return res.status(400).json({ error: 'Bitte etwas gedulden vor dem Absenden.', requestId });
    }
  }

  // Validate required fields
  if (!name || !email || !type) {
    log('error', 'required_fields_missing');
    return res.status(400).json({ error: 'Erforderliche Felder fehlen', requestId });
  }

  // Sanitize and validate
  const sanitizedName = sanitizeString(name, 100);
  const sanitizedPhone = sanitizeString(phone, 50);
  const sanitizedEmail = sanitizeString(email, 254);
  const sanitizedStart = sanitizeString(start, 100);
  const sanitizedMessage = sanitizeString(message, 3000);
  const normalizedType = normalizeType(type);

  if (!sanitizedName || !validateEmail(sanitizedEmail) || !normalizedType) {
    log('error', 'validation_failed');
    return res.status(400).json({ error: 'Ungültige Eingabedaten', requestId });
  }

  log('validation_ok', `type=${normalizedType}`);

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
  const { text: confirmText, html: confirmHtml } = buildConfirmationEmail(sanitizedEmail);

  try {
    // Send internal email
    log('calling_resend_internal');
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

    log('resend_internal_responded', `status=${internalRes.status}`);

    if (!internalRes.ok) {
      const err = await internalRes.text();
      log('error', `resend_internal_failed status=${internalRes.status}`);
      return res.status(500).json({ error: 'Anfrage konnte nicht versendet werden. Bitte versuchen Sie es später erneut.', requestId });
    }

    // Parse the response to get email ID
    const internalData = await internalRes.json();
    const internalEmailId = internalData.id || 'unknown';
    log('internal_sent', `emailId=${internalEmailId}`);

    // Send confirmation email to user
    log('calling_resend_confirmation');
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

    log('resend_confirmation_responded', `status=${confirmRes.status}`);

    if (!confirmRes.ok) {
      const err = await confirmRes.text();
      log('warning', `resend_confirmation_failed status=${confirmRes.status}`);
      // Log but don't fail - internal email was successful
      log('response_200_partial');
      return res.status(200).json({ 
        ok: true,
        internalSent: true,
        confirmationSent: false,
        requestId, 
        internalEmailId 
      });
    } else {
      const confirmData = await confirmRes.json();
      const confirmEmailId = confirmData.id || 'unknown';
      log('confirmation_sent', `emailId=${confirmEmailId}`);
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
    log('error', `unexpected_error message=${error.message}`);
    return res.status(500).json({ ok: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.', requestId });
  }
};
