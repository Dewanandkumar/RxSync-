# RxSync 💊

> **Prescription to Google Calendar & Smart Medicine Alarm in One Tap.**

A cross-platform healthcare assistant available as a **Mobile PWA (Progressive Web App)**, **Manifest V3 Chrome Extension**, and **Modular JavaScript SDK**. Automatically extracts doctor prescription schedules from PDFs and Photos (PNG/JPG up to 5MB), creates pre-filled recurring Google Calendar reminders with a single tap, and rings a live audio alarm timer.

---

## 📱 Mobile PWA App Features

- **📲 1-Tap Home Screen Install:** Install directly to your phone's home screen (Android & iOS Safari) or desktop Chrome/Edge without needing an App Store.
- **📴 100% Offline Capable:** Built-in Service Worker (`sw.js`) caches all medical parsing algorithms, audio synthesizers, and PDF renderers.
- **🔔 Live Ringing Alarm:** Synthesizes an audio alarm bell (A5 -> C6) with countdown timers, snooze (10m), and "Mark as Taken" tracking.
- **🗓️ Multi-Pattern Doctor Schedules:**
  - **Daily (Har Roz):** Every day at set slots.
  - **Alternate Days (Ek Din Chhorkar):** `RRULE:FREQ=DAILY;INTERVAL=2`.
  - **3 Days a Week (Mon-Wed-Fri):** `RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR`.
  - **Evening / Night Only:** Single dose after dinner (`HS`).
  - **Weekly:** Once every week.
- **🔒 100% Client-Side Privacy:** No photos or sensitive prescription documents ever leave the user's browser.

---

## 📂 Project Structure

```
RxSync/
├── index.html                # Main PWA Web Application (GitHub Pages ready)
├── manifest.webmanifest      # PWA App Manifest (standalone display, icons, shortcuts)
├── sw.js                     # Offline Service Worker & cache manager
├── icons/                    # High-res PWA icons (192x192, 512x512 maskable & any)
├── lib/                      # Mozilla PDF.js & worker engine
├── core/                     # Modular business logic
│   ├── medical-parser.js     # Doctor abbreviation & schedule extractor (OD, BD, 1-0-1, etc.)
│   ├── calendar-helper.js    # Google Calendar Intent URLs, RRULEs & .ICS generator
│   ├── alarm-sound.js        # Web Audio API 2-tone alarm chime synthesizer
│   ├── image-reader.js       # PNG/JPG (up to 5MB) reader & canvas pre-processing
│   └── pdf-reader.js         # Browser-native PDF text extraction
│
├── chrome-extension/         # Manifest V3 Chrome Extension
│   ├── manifest.json         # Extension configuration (MV3)
│   ├── service-worker.js     # Background service worker
│   ├── popup/                # Extension popup UI (HTML/CSS/JS)
│   ├── sidepanel/            # Side panel (opens alongside prescription PDF in Chrome)
│   ├── icons/                # 16x16, 48x48, 128x128 icons
│   └── CHROMEWEBSTORE.md     # Chrome Web Store submission metadata
│
├── sdk/                      # Standalone SDK & Playground
│   ├── index.html            # SDK visual test playground
│   ├── rx-reminder-sdk.js    # Core SDK client library
│   └── sample-prescriptions.js # Realistic doctor prescription test samples
│
└── test-data/                # Automated verification
    ├── sample-prescription.pdf # Realistic test prescription PDF
    └── test-suite.html       # Automated unit & integration test runner (100% passing)
```

---

## 🚀 How to Run & Install

### 1. Mobile PWA (Phone / Tablet / Browser)
1. Open `index.html` in your mobile browser (or host on GitHub Pages: `https://<username>.github.io/RxSync-/`).
2. **On Android / Chrome / Edge:** Tap the **"📲 Install App"** button at the top, or tap browser menu (⋮) -> *"Install app"* or *"Add to Home screen"*.
3. **On iPhone / iPad (Safari):** Tap the **Share button (⎋)** at the bottom of Safari, scroll down and tap **"Add to Home Screen" (होम स्क्रीन में जोड़ें)**.
4. The app icon will appear on your home screen and open in standalone full-screen mode like a native mobile app!

### 2. Chrome Extension (Desktop)
1. Open Google Chrome and go to `chrome://extensions/`.
2. Enable **Developer mode** (toggle in top-right corner).
3. Click **Load unpacked** and select the `chrome-extension` folder.
4. Open the extension icon in your Chrome toolbar.

### 3. Automated Test Suite
Open `test-data/test-suite.html` in any browser to verify:
- Medical parsing (abbreviations, dosages, food timings)
- RRULE recurrence generation (Daily, Alternate Days, Mon-Wed-Fri, Evening)
- 5MB file upload limit protection
- Web Audio synthesizer functions
- PDF & Image extraction

---

## 💻 SDK Developer Usage

```javascript
// 1. Parse text from clinical notes or prescription:
const medicines = RxReminderSDK.parseText(`
  Tab. Augmentin 625mg 1-0-1 after food x 5 days
  Tab. Dolo 650mg TDS x 3 days
  Tab. Azithromycin 500mg on alternate days x 6 days
`);

// 2. Generate 1-tap Google Calendar URLs:
const reminders = RxReminderSDK.getAllReminderUrls(medicines);

// 3. Launch Google Calendar in 1 click:
RxReminderSDK.openReminder(reminders[0].reminders[0].url);

// 4. Or export all doses to an iCalendar (.ics) file:
RxReminderSDK.downloadIcs(medicines, 'My_Schedule.ics');
```
