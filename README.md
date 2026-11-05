# ðŸŽŸï¸ QR Event Pass & Real-Time Token Authentication System

[![HTML5/JS](https://img.shields.io/badge/Frontend-HTML5%20%7C%20CSS3%20%7C%20Vanilla%20JS-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](./web/)
[![Google Apps Script](https://img.shields.io/badge/Backend-Google%20Apps%20Script%20API-4285F4?style=flat-square&logo=google)](./backend/Code.gs)
[![QR Engine](https://img.shields.io/badge/QR%20Scanner-html5--qrcode-24292e?style=flat-square)](https://github.com/mebjas/html5-qrcode)
[![Anti-Fraud](https://img.shields.io/badge/Security-Single--Use%20Replay%20Prevention-red?style=flat-square)](./docs/architecture.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

An enterprise-ready, zero-infrastructure event check-in and access management system originally built and deployed for **The Hackers Meetup (THM) Surat**. Combines automated sequential token generation, real-time in-browser camera QR scanning, and single-use cryptographic anti-fraud validation.

---

## ðŸ›ï¸ System Architecture & Event Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Attendee
    participant Form as Google Form / Registration
    participant Sheet as Google Sheets Database
    participant Scanner as Web Camera QR Scanner
    participant API as Verification Webhook (Apps Script)

    Attendee->>Form: Submits Event Registration
    Form->>Sheet: Trigger onFormSubmit()
    Sheet->>Sheet: assignTokenNumber() -> Generate Sequential ID (e.g. THMFOOD042)
    Sheet->>Attendee: Issue Event Pass / QR Code

    Note over Attendee,Scanner: Event Gate / Food Counter Check-in
    Attendee->>Scanner: Presents QR Code on Mobile
    Scanner->>API: POST /exec { token: "THMFOOD042" }
    
    alt Token Valid & Unused
        API->>Sheet: Mark Row Checked-In + Timestamp
        API-->>Scanner: 200 OK { status: "SUCCESS", attendee: "Aryan Pandya" }
        Scanner-->>Attendee: Green Flash + Audio Beep (Entry Approved)
    else Token Already Redeemed (Replay Attack)
        API-->>Scanner: 409 Conflict { status: "ALREADY_USED", checkedInAt: "18:24:10" }
        Scanner-->>Attendee: Red Warning Flash (Fraud Alert: Already Used)
    else Token Non-Existent
        API-->>Scanner: 404 Not Found { status: "INVALID_TOKEN" }
        Scanner-->>Attendee: Red Buzzer (Counterfeit Pass)
    end
```

---

## ðŸš€ Key Features

- **Automated Sequential Tokenization**: Generates non-colliding, standardized IDs (`THMFOOD001`, `THMFOOD002`, etc.) upon form submission with zero manual intervention.
- **Anti-Fraud Single-Use Protection**: Atomically marks tickets as consumed upon scanning, completely preventing duplicate entries, ticket sharing, or food pass reuse.
- **Client-Side Camera QR Scanner**: Built on `html5-qrcode` with live device camera switching, auto-torch toggle, and manual input fallback for unreadable passes.
- **Instant Audio & Haptic Feedback**: Positive frequency audio chime on successful entry, harsh buzzer on invalid/duplicate passes, and vibration alerts on mobile devices.
- **Zero-Cost Hosting Architecture**: Requires no paid servers or database subscriptions; runs on Google Workspace infrastructure with 99.9% uptime.

---

## ðŸ“‚ Project Structure

```text
qr-ticket-auth-system/
â”œâ”€â”€ README.md                      # Central architecture & setup guide
â”œâ”€â”€ web/
â”‚   â”œâ”€â”€ index.html                 # Cyberpunk-styled mobile-friendly check-in gate
â”‚   â”œâ”€â”€ styles.css                 # Responsive HUD theme (Orbitron font, glowing statuses)
â”‚   â””â”€â”€ app.js                     # Camera scanning engine, feedback chimes, and API caller
â”œâ”€â”€ backend/
â”‚   â”œâ”€â”€ Code.gs                    # Complete Google Apps Script (Token Generator + REST API)
â”‚   â”œâ”€â”€ appsscript.json            # Google Apps Script manifest
â”‚   â””â”€â”€ api-spec.md                # Full REST API specification
â”œâ”€â”€ tests/
â”‚   â””â”€â”€ test_verification.py       # Automated test suite for token formatting and replay prevention
â””â”€â”€ docs/
    â”œâ”€â”€ architecture.md            # Detailed security model and state transitions
    â””â”€â”€ deployment-guide.md        # Step-by-step setup in Google Workspace
```

---

## ðŸ› ï¸ Step-by-Step Setup Guide

### 1. Backend (Google Sheets & Apps Script)
1. Create a Google Sheet with columns:
   `Token ID | Timestamp | Full Name | Email | Checked-In | Check-In Time`
2. Open **Extensions > Apps Script** and paste [`backend/Code.gs`](./backend/Code.gs).
3. Set up an `On Form Submit` trigger for `assignFoodTokenNumber`.
4. Click **Deploy > New Deployment > Web App**:
   - Execute as: *Me*
   - Who has access: *Anyone*
5. Copy the generated Web App URL.

### 2. Frontend Gate Scanner
1. Open [`web/app.js`](./web/app.js) and update `API_ENDPOINT` with your Apps Script Web App URL.
2. Host [`web/`](./web/) on any static host (GitHub Pages, Netlify, or local device).
3. Point your smartphone or tablet camera at attendee QR codes for sub-second check-in.

---

## ðŸ‘¨â€ðŸ’» Author & Maintainer
**Aryan Pandya**  
- LinkedIn: [linkedin.com/in/aryanpandya](https://www.linkedin.com/in/aryanpandya)  
- Email: [pandyaaryanp348@gmail.com](mailto:pandyaaryanp348@gmail.com)  
- Portfolio: [github.com/Aryan-136](https://github.com/Aryan-136)
