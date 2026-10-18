# Rx to Google Reminder (Spike Prototypes)

A dual-mode solution (Chrome Extension Tool + Modular JavaScript SDK) that automatically extracts medical prescription schedules from PDFs and sets recurring Google Reminders / Google Calendar events with a single tap.

---

## 🎯 What Problem This Solves

Prescriptions are filled with medical abbreviations (`Tab. Augmentin 625mg 1-0-1 after food x 5 days`, `BID`, `TDS`, `HS`). Manually scheduling every morning, afternoon, and night dose across multiple medications into Google Calendar is tedious and error-prone.

This project delivers:
1. **Zero-Friction 1-Tap Reminders:** Generates direct Google Calendar Web Intent links (`action=TEMPLATE&...`) with pre-calculated recurrence rules (`RRULE:FREQ=DAILY;COUNT=5`), alarms, dosage notes, and food instructions. No OAuth registration or Google Cloud API setup is required for the end user!
2. **100% Client-Side Privacy:** Built-in PDF extraction uses Mozilla PDF.js. Sensitive medical documents never leave the user's browser.
3. **Dual Form Factor:** Test both approaches — an unpacked Chrome Extension (with Popup and Side Panel) and a standalone browser/Node SDK.

---

## 📂 Project Structure

```
rx-google-reminder/
├── chrome-extension/         # Spike 1: Manifest V3 Chrome Extension
│   ├── manifest.json         # Extension configuration (MV3)
│   ├── service-worker.js     # Background service worker
│   ├── CHROMEWEBSTORE.md     # Chrome Web Store metadata & privacy justifications
│   ├── popup/                # Extension popup UI (HTML/CSS/JS)
│   ├── sidepanel/            # Side panel (opens alongside prescription PDF in Chrome)
│   ├── icons/                # 16x16, 48x48, 128x128 icons
│   ├── lib/                  # Standalone Mozilla PDF.js & worker
│   └── core/                 # Shared parser & calendar engine
│
├── sdk/                      # Spike 2: Standalone JavaScript SDK
│   ├── rx-reminder-sdk.js    # Core SDK client library
│   ├── index.html            # Interactive visual testing playground
│   ├── sample-prescriptions.js # Realistic doctor prescription test samples
│   ├── lib/                  # Standalone PDF.js bundle
│   └── core/                 # Shared parser & calendar engine
│
├── core/                     # Shared logic
│   ├── medical-parser.js     # Doctor abbreviation & schedule extractor (OD, BD, 1-0-1, etc.)
│   ├── calendar-helper.js    # Google Calendar Intent URLs, RRULEs & .ICS export
│   └── pdf-reader.js         # Browser-native PDF text extraction
│
└── test-data/                # Automated verification
    ├── sample-prescription.pdf # Generated realistic prescription PDF for testing
    ├── test-suite.html       # Automated unit & integration tests
    └── test-pdf-b64.html     # End-to-end PDF decoding verification
```

---

## 🚀 How to Test Both Prototypes

### Option A: Testing Spike 1 (Chrome Extension)
1. Open Google Chrome.
2. Navigate to `chrome://extensions/`.
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked**.
5. Select the folder:
   `C:\Users\DELL\.gemini\antigravity\scratch\rx-google-reminder\chrome-extension`
6. Click the extension icon in your Chrome toolbar:
   - Drop any prescription PDF (or test `test-data/sample-prescription.pdf`).
   - Or click on any sample chip (**Acute**, **Chronic**, **Allergy**).
   - Click **+ 1-Tap Reminder** on any medicine to instantly open Google Calendar with title, time, and recurrence pre-filled!

### Option B: Testing Spike 2 (SDK Playground)
1. Open `C:\Users\DELL\.gemini\antigravity\scratch\rx-google-reminder\sdk\index.html` in Chrome.
2. Test both the visual UI and the programmatic SDK integration.
3. Test 1-Tap Google Reminders, bulk opening, and `.ICS` calendar download.

---

## 💻 SDK Developer Usage

```javascript
// 1. Parse text from clinical notes or prescription:
const medicines = RxReminderSDK.parseText(`
  Tab. Augmentin 625mg 1-0-1 after food x 5 days
  Tab. Dolo 650mg TDS x 3 days
`);

// 2. Generate 1-tap Google Calendar URLs:
const reminders = RxReminderSDK.getAllReminderUrls(medicines);

// 3. Launch Google Calendar in 1 click:
RxReminderSDK.openReminder(reminders[0].reminders[0].url);

// 4. Or export all doses to an iCalendar (.ics) file:
RxReminderSDK.downloadIcs(medicines, 'My_Schedule.ics');
```
