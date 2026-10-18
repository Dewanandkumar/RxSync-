# Chrome Web Store Metadata & Publishing Dossier

## 1. Store Listing Metadata

- **Extension Name:** Rx to Google Reminder - 1-Tap Prescription Sync
- **Short Description:** Extract medication schedules from PDF prescriptions and set Google Reminders with one tap.
- **Category:** Productivity / Health & Fitness
- **Default Language:** English

### Detailed Description
Never miss a medicine dose again. Rx to Google Reminder helps patients and caregivers turn complex doctor prescriptions into organized Google Calendar reminders in seconds.

Simply drag and drop your medical prescription PDF or open it in Chrome. The tool extracts each medication name, dosage (e.g., 500mg, 10ml), timing schedule (1-0-1, BID, TDS, once daily), food instructions (before/after meals), and duration (e.g., 5 days, 30 days).

With one tap, click to add alarms and recurring daily reminders straight into your Google Calendar — zero complicated account setup required.

**Key Features:**
- 📄 **1-Tap PDF Extraction:** Works with digital PDF prescriptions from clinics, telehealth services, and hospitals.
- ⚡ **1-Tap Google Reminder:** Opens pre-filled Google Calendar reminders with recurrence rules matching your exact prescription duration.
- ⏰ **Smart Medical Schedule Detection:** Understands doctor abbreviations like BID, TDS, OD, QID, 1-0-1, SOS, before meals, and after food.
- 🔒 **100% Private & Client-Side:** PDF parsing runs completely on your local machine using Mozilla PDF.js. Your sensitive health data never leaves your browser.
- 📅 **One-Click Multi-Dose Import:** Export your full multi-week medication schedule to standard .ICS calendar format.

---

## 2. Permissions Justification

| Permission | Justification |
|------------|---------------|
| `storage` | Stores user preference settings locally (such as preferred default morning, afternoon, and night notification times). |
| `activeTab` | Allows the extension to read the prescription document currently open in the active browser tab when initiated by the user. |
| `sidePanel` | Displays the medication schedule panel alongside the prescription PDF so the patient can review the doctor notes and reminders side-by-side. |

---

## 3. Privacy & Data Use

- **Single Purpose:** Extract medication dosages and schedules from medical prescriptions and generate Google Calendar reminders.
- **Data Collection:** The extension collects NO user data, NO telemetry, and transmits NO health data to external servers. All text parsing and PDF extraction happens 100% locally on the user device.
- **Authentication:** Web Intent mode requires no OAuth tokens or credentials; calendar events are initiated directly by the user in Google Calendar.

---

## 4. Version History

- **v1.0.0 (2026-09-19):** Initial release of Rx to Google Reminder Prototype Spike featuring local PDF.js parser, 1-tap Google Calendar Web Intent, side panel support, and .ICS schedule export.
