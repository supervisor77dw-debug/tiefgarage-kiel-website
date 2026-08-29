# Tiefgarage Kiel - Formularintegration mit Vercel + Resend

## Übersicht der Implementierung

Die Website wurde vollständig für den produktiven Formularversand über Vercel und Resend integriert. Alle Demo- und Test-Inhalte wurden entfernt.

---

## 1. Geänderte Dateien

### index.html
**Änderungen:**
- Form erhielt `id="contact-form"` und `novalidate=""`
- **Honeypot-Feld hinzugefügt:** `<input id="company_website" ... style="position:absolute;left:-9999px;" />`
  - Unsichtbar am Rand außerhalb des Viewports positioniert
  - Wird vom Browser nicht angetippt, Spam-Bots aber oft ausgefüllt
  
- **Datenschutz-Checkbox hinzugefügt:**
  ```html
  <div class="field">
    <label style="display:flex;gap:8px;align-items:flex-start;cursor:pointer;">
      <input id="privacy" required="" type="checkbox"/>
      <span>Ich habe die <a href="#datenschutz">Datenschutzerklärung</a> zur Kenntnis genommen...</span>
    </label>
  </div>
  ```
  - Erforderlich (`required=""`), kann nicht ohne Zustimmung abgesendet werden
  - Server-seitig ebenfalls validiert

- **Result-Meldungscontainer hinzugefügt:**
  ```html
  <div aria-live="polite" aria-relevant="additions" id="form-message" role="status" ...></div>
  ```
  - Für Erfolgs-/Fehlermeldungen sichtbar
  - Erfüllt Accessibility-Anforderungen (aria-live)
  - Wird fokussiert nach Formularversand

- **Submit-Button erhielt `id="submit-btn"`** für JavaScript-Steuerung

- **Demo-Note entfernt:** `<div class="demo-note" hidden="" id="form-note">` wurde vollständig gelöscht

- **Client-seitiger Form-Handler hinzugefügt (Ende des `<script>`-Blocks):**
  ```javascript
  - Formularload-Zeit tracken (für Spam-Schutz)
  - POST an /api/anfrage mit JSON-Daten
  - Button deaktivieren während Versand
  - Erfolgs-/Fehlermeldungen anzeigen
  - Bei Erfolg Formular zurücksetzen (inklusive Checkbox)
  ```

### Datenschutzerklärung (index.html)
- **Abschnitt 4 aktualisiert:** Erklärt, dass Formulardaten nur für Anfrageverarbeitung verwendet werden
- **Neuer Abschnitt 5:** Dokumentiert E-Mail-Versand über Resend mit Link zu resend.com
- **Alte Absätze entfernt:** "Die aktuelle Entwurfsfassung ist noch nicht mit einem E-Mail-... verbunden" etc.
- **Placeholder entfernt:** `[vor Veröffentlichung ergänzen]` durch echte Kontaktdaten ersetzt

### Impressum (index.html)
- E-Mail aktualisiert: `anfrage@tiefgarage-kiel.de` (nicht mehr `[vor Veröffentlichung]`)
- Telefon-Zeile entfernt (nur E-Mail relevant)

---

## 2. Neu angelegte Dateien

### api/anfrage.js
**Vercel Serverless Function für Formularverarbeitung**

**Funktionalität:**
- **HTTP-Methoden:** Akzeptiert nur POST (405 für andere Methoden)
- **Validierung:**
  - Feldlängen prüfen (Name: 100, Email: 254, Nachricht: 3000)
  - E-Mail-Format validieren (Regex)
  - Datenschutz-Checkbox muss `true` sein
  - Alle Strings trimmen, keine HTML-Inhalte erlaubt
  
- **Spam-Schutz:**
  - **Honeypot:** Wenn `company_website` gefüllt → stillschweigend erfolgreiche Antwort (keine Mail versendet)
  - **Timing-Check:** Formulare, die <2 Sekunden nach Seitenaufruf versendet werden, ablehnen
  
- **Typ-Normalisierung:**
  - "PKW-Stellplatz..." → "PKW"
  - "Motorradstellplatz..." → "Motorrad"
  - "Ich interessiere mich für beides" → "PKW & Motorrad"

- **Fehlerbehandlung:**
  1. Interne Mail **MUSS** erfolgreich sein → sonst Fehler an User
  2. Bestätigung-Mail scheitert → interne Mail erfolgt trotzdem, User bekommt Erfolgsmeldung, Fehler wird geloggt (ohne personenbezogene Daten)

- **Umweltvariablen:**
  ```
  RESEND_API_KEY    - Resend API-Schlüssel (erforderlich)
  CONTACT_TO        - Interne Empfänger-E-Mail (erforderlich)
  CONTACT_FROM      - Absender-E-Mail (erforderlich)
  ```
  Falls eine Variable fehlt → HTTP 500 mit generischer Fehlermeldung, kein API-Key exponiert

### .env.example
**Template-Datei für Umweltvariablen:**
```
RESEND_API_KEY=
CONTACT_TO=anfrage@tiefgarage-kiel.de
CONTACT_FROM=Tiefgarage Kiel <website@tiefgarage-kiel.de>
```
- **Wird commitet** (kein echter Key, nur Template)
- In Produktion: `.env` in Vercel-Dashboard setzen

### .gitignore
**Verhindert, dass Secrets committed werden:**
```
.env
.env.local
.env.*.local
node_modules/
```

### package.json
**Abhängigkeiten und Projekt-Metadaten:**
```json
{
  "name": "tiefgarage-kiel-website",
  "version": "1.0.0",
  "private": true,
  "engines": { "node": ">=18.0.0" },
  "dependencies": { "node-fetch": "^3.3.1" }
}
```
- Node 18+ required (für native `fetch()` in Funktionen)
- `node-fetch` als Fallback-Abhängigkeit

### vercel.json
**Vercel-Konfiguration:**
```json
{
  "buildCommand": "echo 'Static website with serverless functions'",
  "outputDirectory": ".",
  "functions": {
    "api/anfrage.js": {
      "memory": 1024,
      "maxDuration": 10
    }
  }
}
```
- Definiert API-Funktion mit 1GB RAM, 10s Timeout
- Teilt Vercel mit, dass die Wurzel als Output-Verzeichnis verwendet wird (statische Website + Funktionen)

---

## 3. Erforderliche Vercel Environment Variables

Diese müssen im Vercel-Dashboard unter "Settings → Environment Variables" gesetzt werden:

| Variable | Wert | Beispiel |
|----------|------|---------|
| `RESEND_API_KEY` | API-Schlüssel von Resend | `re_XXXXXXXXX...` |
| `CONTACT_TO` | Interne Anfrage-Empfänger-E-Mail | `anfrage@tiefgarage-kiel.de` |
| `CONTACT_FROM` | Absender-E-Mail | `Tiefgarage Kiel <website@tiefgarage-kiel.de>` |

**Wichtig:** Solange `RESEND_API_KEY` nicht gesetzt oder Resend-Domain nicht verified:
- Form wird optisch angezeigt, kann aber nicht versendet werden
- Server gibt generische Fehlermeldung zurück
- Keine technischen Details an Browser

---

## 4. Entfernte Demo-/Testtexte

### Aus index.html entfernt:
1. **Form Demo-Note:** `"Vor Veröffentlichung wird dieses Formular noch mit dem endgültigen E-Mail-/CRM-Ziel verbunden."`
2. **Datenschutzerklärung:**
   - "Die aktuelle Entwurfsfassung ist noch nicht mit einem E-Mail-, CRM- oder sonstigen Übermittlungsdienst verbunden..."
   - "Vor Livegang wird dieser Abschnitt an die tatsächliche technische Lösung angepasst."
   - "Der aktuelle Stand setzt keine Analyse- oder Marketingtools ein..." (Abschnitt 5)
   - Gesamter `<div class="legal-note">` Block
3. **Impressum:**
   - E-Mail: `[vor Veröffentlichung ergänzen]` → `anfrage@tiefgarage-kiel.de`
   - Telefon: `[optional ergänzen]` → entfernt

---

## 5. Wie das Formular jetzt funktioniert

### Frontend (Browser)
1. **Seitenaufruf:**
   - Formularlade-Zeit wird in `formLoadTime` gespeichert
   - Honeypot-Feld wird außerhalb des Viewports versteckt

2. **Nutzer füllt Formular aus und klickt "Anfrage senden":**
   - `contact-form` submits
   - `event.preventDefault()` stoppt normales Verhalten

3. **JavaScript-Handler:**
   ```javascript
   - Sammelt Formularfelder in JSON-Objekt
   - Submit-Button wird deaktiviert, Text ändert zu "Anfrage wird gesendet …"
   - POST-Request an /api/anfrage mit Content-Type: application/json
   - Wartet auf Response
   ```

4. **Bei Erfolg (HTTP 200, success: true):**
   - Grüne Erfolgsmeldung anzeigen
   - Formular komplett zurücksetzen (auch Datenschutz-Checkbox)
   - Button wieder aktivieren

5. **Bei Fehler:**
   - Rote Fehlermeldung anzeigen (generische Meldung, keine technischen Details)
   - Button wieder aktivieren
   - Benutzer kann erneut versuchen oder manuel schreiben

### Backend (Vercel Serverless)
1. **Request-Empfang:**
   - Prüfe HTTP-Methode (nur POST erlaubt)
   - Prüfe Umweltvariablen-Verfügbarkeit

2. **Honeypot-Prüfung:**
   - Wenn `company_website` gefüllt → HTTP 200 ohne Mail versendet (Sicherheit)

3. **Timing-Prüfung:**
   - Wenn `timestamp` und jetzt - timestamp < 2000ms → HTTP 400 ablehnen

4. **Validierung:**
   - Erforderliche Felder: `type`, `name`, `email`
   - E-Mail-Format prüfen
   - Feldlängen prüfen
   - Alle Strings trimmen

5. **Typ-Normalisierung:**
   - Parse das `type`-Feld (Stellplatzart) und normalisiere auf kurze Form

6. **E-Mail-Versand:**
   - **Interne Mail** an CONTACT_TO:
     ```
     An: anfrage@tiefgarage-kiel.de
     Von: Tiefgarage Kiel <website@tiefgarage-kiel.de>
     Reply-To: <nutzer-e-mail>
     Betreff: Neue Stellplatzanfrage – PKW (oder Motorrad)
     
     Inhalt: HTML + Plain-Text mit Anfragedaten, professionelle Formatierung
     ```
   - Falls intern fehlschlägt → HTTP 500, Fehler an User

   - **Bestätigung-Mail** an User-E-Mail:
     ```
     An: <nutzer-e-mail>
     Von: Tiefgarage Kiel <website@tiefgarage-kiel.de>
     Betreff: Ihre Stellplatzanfrage – Tiefgarage Kiel
     
     Inhalt: Danke-Text, Kontaktangaben, Anweisung nicht zu antworten
     ```
   - Falls Bestätigung fehlschlägt → trotzdem HTTP 200, Fehler nur geloggt

7. **Response:**
   - Erfolg: `{ success: true, message: "Anfrage erfolgreich versendet" }`
   - Fehler: `{ error: "Generische Fehlermeldung (auf Deutsch)" }`

---

## 6. Honeypot-Spam-Schutz

**Feld:** `company_website`

**HTML (unsichtbar):**
```html
<input aria-hidden="true" autocomplete="off" id="company_website" 
       name="company_website" 
       style="position:absolute;left:-9999px;" 
       tabindex="-1" type="text"/>
```

**Funktion:**
- Feld ist `9999px` links versteckt (außerhalb des Bildschirms, nicht `display:none` für a11y)
- Menschen sehen es nicht und füllen es nicht aus
- Spam-Bots füllen es oft automatisch aus
- **Server-seitig:** Wenn Feld nicht leer → HTTP 200 zurückgeben (ohne Mail), Angreifer denkt, es hat geklappt

**Zusätzlicher Schutz: Timing-Check**
- Client sendet `timestamp: formLoadTime` (Seitenaufruf)
- Server: Wenn `Date.now() - timestamp < 2000ms` → ablehnen
- Sehr schnelle Formulare (Bots) werden blockiert

---

## 7. Interne Anfrage-Mail

**Struktur:**

**Plain-Text-Version:**
```
Neue Stellplatzanfrage über tiefgarage-kiel.de

Stellplatzart:
PKW

Name:
Max Mustermann

Telefon:
040 1234567

E-Mail:
max@beispiel.de

Gewünschter Mietbeginn:
15.11.2026

Nachricht:
Ich interessiere mich besonders für einen Stellplatz in der 2. Etage.

—

Quelle:
tiefgarage-kiel.de
```

**HTML-Version:**
- Dunkelblauer Header (`#10243b`) mit grünem Unterstrich (`#8bc53f`)
- Klare Feldstruktur (Name: Wert)
- Weiße Hintergrundfläche mit leichtem Schatten
- Responsive für Outlook, Apple Mail, mobil
- Footer mit Hinweis (Auto-E-Mail)

**Header:**
- `From:` `Tiefgarage Kiel <website@tiefgarage-kiel.de>`
- `To:` `anfrage@tiefgarage-kiel.de`
- `Reply-To:` `max@beispiel.de` (Benutzer-E-Mail)
- `Subject:` `Neue Stellplatzanfrage – PKW` (oder Motorrad)

---

## 8. Kundenbestätigung (Confirmation-Mail)

**Plain-Text:**
```
Vielen Dank für Ihre Anfrage.

Wir haben Ihre Nachricht erhalten und melden uns kurzfristig zur 
aktuellen Verfügbarkeit des gewünschten Stellplatzes.

Tiefgarage Kiel
Eckernförder Straße 85–87
24116 Kiel

tiefgarage-kiel.de

Bitte antworten Sie nicht auf diese automatische Nachricht. 
Bei Rückfragen erreichen Sie uns unter anfrage@tiefgarage-kiel.de.
```

**HTML-Version:**
- Gleiche Brand-Farben (Dunkelblau, Grün)
- Größerer, freundlicherer Stil
- Adresse deutlich formatiert
- Hinweis auf Auto-Mail im Footer

**Header:**
- `From:` `Tiefgarage Kiel <website@tiefgarage-kiel.de>`
- `To:` `<nutzer-e-mail>`
- `Subject:` `Ihre Stellplatzanfrage – Tiefgarage Kiel`

**Besonderheit:** Diese Mail wird in `api/anfrage.js` gesendet, auch wenn sie fehlschlägt. Wichtig ist nur, dass die interne Anfrage-Mail ankommt.

---

## 9. Nach Resend-Verifizierung noch nötig (Manuell)

1. **RESEND_API_KEY in Vercel setzen:**
   - Vercel Dashboard → Projekt → Settings → Environment Variables
   - Name: `RESEND_API_KEY`, Wert: API-Key von Resend
   - Production + Preview markieren

2. **Resend DNS-Verifizierung abwarten:**
   - Resend wartet auf DNS-Eintrag in tiefgarage-kiel.de
   - Domain-Admin muss DNS-Record hinzufügen (CNAME oder SPF/DKIM)
   - Resend zeigt den nötigen Record im Dashboard

3. **Test-Formularversand:**
   - Website öffnen
   - Test-Anfrage ausfüllen und absenden
   - Beide E-Mails sollten ankommen:
     - Interne: anfrage@tiefgarage-kiel.de
     - Bestätigung: Nutzer-E-Mail

4. **Honeypot-Test (optional):**
   - Entwickler-Tools öffnen
   - Honeypot-Feld mit JS füllen: `document.getElementById('company_website').value = 'spam';`
   - Formular absenden
   - Erfolg-Meldung sollte zeigen, aber keine Mail ankommen

---

## 10. Sicherheit - Checkliste

✅ **Keine API-Keys im Code:**
- `RESEND_API_KEY` nur in `process.env` in `api/anfrage.js`
- `.env` in `.gitignore`
- `.env.example` committed (nur Template, kein echter Key)

✅ **Keine persönlichen Daten in Logs:**
- `console.error()` zeigt nur generische Meldungen
- E-Mail-Adressen nicht geloggt

✅ **Input-Validierung:**
- Feldlängen prüfen
- E-Mail-Format prüfen
- Typ auf erlaubte Werte prüfen
- HTML-Inhalte verhindern (trim, nicht als HTML interpretiert)

✅ **Spam-Schutz ohne CAPTCHA:**
- Honeypot-Feld
- Timing-Check (2 Sekunden Minimum)

✅ **Fehlerbehandlung:**
- Keine technischen Details an User
- Generische Fehlermeldungen auf Deutsch
- Stack-Traces nur intern (console)

---

## 11. Browser-Kompatibilität

- **Formular-Handling:** Vanilla JS, IE 11+ (falls needed, aber `fetch()` benötigt Polyfill)
- **Honeypot:** CSS `position: absolute; left: -9999px` – alle Browser
- **Aria-Live:** Alle modernen Browser, Apple Accessibility
- **Fetch API:** Chrome 40+, Firefox 39+, Safari 10.1+

---

## 12. Design - Keine Änderungen

✅ **Unverändert:**
- Hero-Sektion
- Logo und Farben
- Navigation + Hamburger-Menü
- Stellplatzpläne
- Bilder und Galeriebilder
- Sticky CTA
- Responsive Breakpoints
- Mobile Layout-Optimierungen
- Lightbox

✅ **Nur Form-bezogen (keine Designänderung):**
- Datenschutz-Checkbox hinzugefügt (ein neues Feld, bestehender Stil)
- Meldungsbereich für Erfolg/Fehler (neuer Bereich, bestehende Button/Farben)
- Honeypot versteckt (optisch unsichtbar)

---

## 13. Tests durchführen

### Desktop (1440px+)
```bash
1. Website öffnen
2. Zum "Kontakt"-Bereich scrollen
3. Formular mit Test-Daten füllen
4. Datenschutz-Checkbox aktivieren
5. "Anfrage senden" klicken
6. Grüne Erfolgsmeldung sollte erscheinen
7. Formular sollte geleert sein
8. Zwei E-Mails sollten ankommen (nach Resend-Verifizierung)
```

### Mobile (390px)
```bash
1. Website auf Handy öffnen
2. Zum Kontakt-Bereich scrollen
3. Formular ausfüllen (Einzelspalten-Layout)
4. "Anfrage senden" → sollte wie Desktop funktionieren
5. Sticky CTA sollte nicht über Formular überlagern
```

### Fehlerfall-Test
```bash
1. Entwickler-Tools öffnen (F12)
2. .env-Variablen nicht setzen oder falsch
3. Formular absenden
4. Rote Fehlermeldung sollte erscheinen
5. Console sollte generische Fehler-Message zeigen (kein Stacktrace sichtbar)
```

### Honeypot-Test (optional)
```javascript
document.getElementById('company_website').value = 'SPAM';
// Formular absenden → sollte funktionieren wirken (HTTP 200)
// Aber KEINE E-Mail versendet
```

---

## 14. Dateisystem-Überblick

```
tiefgarage-kiel/
├── index.html              ← Formular + JS-Handler + Datenschutz aktualisiert
├── .env.example            ← ✨ Neu: Umweltvariablen-Template
├── .gitignore              ← ✨ Neu: .env ausgeschlossen
├── package.json            ← ✨ Neu: Dependencies + Node-Version
├── vercel.json             ← ✨ Neu: Vercel-Konfiguration
├── api/
│   └── anfrage.js          ← ✨ Neu: Serverless Function
├── assets/                 ← (unverändert)
├── .git/                   ← (unverändert)
└── README.txt              ← (unverändert)
```

---

## 15. Häufig gestellte Fragen

**F: Warum kein Database?**  
A: Datenschutz + Anforderung. Nur E-Mail-Notification, keine Speicherung.

**F: Was ist der Unterschied zwischen Honeypot und Timing-Check?**  
A: Honeypot blockt Browser-Bots. Timing-Check blockt automatisierte Formulare, die zu schnell versendet werden.

**F: Wer bekommt die internen Mails?**  
A: `CONTACT_TO` (default: `anfrage@tiefgarage-kiel.de`) bekommt alle Anfragen.

**F: Was passiert, wenn Resend-Domain noch nicht verified ist?**  
A: Mails scheitern serverseitig. User bekommt generische Fehlermeldung. Code ist vorbereitet, wartet nur auf Verifizierung.

**F: Können Benutzer ihre Anfrage tracken?**  
A: Nein. Nur Bestätigung-E-Mail, keine Anfrage-ID oder Link. Das ist gewollt (einfach und datenschutzfreundlich).

---

## 16. Git-Verlauf

```
9b2426f Vercel + Resend Formularintegration: API-Endpunkt, Honeypot, 
        Datenschutz-Checkbox, Client-seitiger Handler, Demo-Inhalte entfernt
```

**Geänderte Dateien in diesem Commit:**
- `index.html` (Formular + JavaScript + Datenschutz)
- `.env.example` (neu)
- `.gitignore` (neu)
- `api/anfrage.js` (neu)
- `package.json` (neu)
- `vercel.json` (neu)

---

## Zusammenfassung

✅ **Fertigstellung:**
Alle technischen Anforderungen der 18-Punkt-Spezifikation sind implementiert.  
Website ist bereit für Resend-Verifizierung und produktiven Betrieb.

🔐 **Sicherheit:** API-Keys geschützt, Spam-Schutz aktiv, Validierung serverseitig.

📧 **E-Mail-Versand:** Interne Anfragen + Kundenbestätigung automatisiert.

🎨 **Design:** Optisch unverändert. Nur funktionale Form-Integration.

⏱️ **Nächste Schritte:**
1. RESEND_API_KEY in Vercel setzen
2. Resend DNS-Verifizierung abwarten
3. Test-Formularversand prüfen
4. Produktiven Betrieb starten
