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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const contactTo = process.env.CONTACT_TO;
  const contactFrom = process.env.CONTACT_FROM;

  if (!apiKey || !contactTo || !contactFrom) {
    console.error('[anfrage.js] Missing Resend configuration');
    return res.status(500).json({ error: 'Konfiguration nicht vollständig. Bitte später erneut versuchen.' });
  }

  const { type, name, phone, email, start, message, company_website, timestamp } = req.body;

  // Honeypot check
  if (company_website && company_website.trim().length > 0) {
    return res.status(200).json({ success: true, message: 'Anfrage erhalten' });
  }

  // Time check: reject if submitted too quickly
  if (timestamp) {
    const submittedAt = parseInt(timestamp, 10);
    const now = Date.now();
    if (now - submittedAt < 2000) {
      return res.status(400).json({ error: 'Bitte etwas gedulden vor dem Absenden.' });
    }
  }

  // Validate required fields
  if (!name || !email || !type) {
    return res.status(400).json({ error: 'Erforderliche Felder fehlen' });
  }

  // Sanitize and validate
  const sanitizedName = sanitizeString(name, 100);
  const sanitizedPhone = sanitizeString(phone, 50);
  const sanitizedEmail = sanitizeString(email, 254);
  const sanitizedStart = sanitizeString(start, 100);
  const sanitizedMessage = sanitizeString(message, 3000);
  const normalizedType = normalizeType(type);

  if (!sanitizedName || !validateEmail(sanitizedEmail) || !normalizedType) {
    return res.status(400).json({ error: 'Ungültige Eingabedaten' });
  }

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
      const err = await internalRes.text();
      console.error('[anfrage.js] Resend internal email failed:', err);
      return res.status(500).json({ error: 'Anfrage konnte nicht versendet werden. Bitte versuchen Sie es später erneut.' });
    }

    // Send confirmation email to user
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
      const err = await confirmRes.text();
      console.error('[anfrage.js] Resend confirmation email failed:', err);
      // Log but don't fail - internal email was successful
    }

    return res.status(200).json({ success: true, message: 'Anfrage erfolgreich versendet' });
  } catch (error) {
    console.error('[anfrage.js] Unexpected error:', error.message);
    return res.status(500).json({ error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.' });
  }
};
