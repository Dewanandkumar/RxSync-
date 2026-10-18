/**
 * Node.js CLI test runner for RxSync
 * Mirrors browser test suite in test-data/test-suite.html
 */

const assert = require('assert');
const path = require('path');

// Load sample prescriptions and modules via require
const SAMPLE_PRESCRIPTIONS = require('../sample-prescriptions.js');
const MedicalParser = require('../core/medical-parser.js');
const CalendarHelper = require('../core/calendar-helper.js');
const ImageReader = require('../core/image-reader.js');

console.log('🧪 Running RxSync Node.js Unit Tests...\n');

let passed = 0;
let failed = 0;

function it(desc, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${desc}`);
    console.error(`     Error: ${err.message}`);
    failed++;
  }
}

// Test 1: Acute sample parsing
it('Extracts medications from Acute sample (Augmentin 625mg & Dolo 650mg)', () => {
  const acuteSample = SAMPLE_PRESCRIPTIONS.find(s => s.id === 'sample-acute');
  const meds = MedicalParser.parsePrescriptionText(acuteSample.text);
  assert.ok(meds.length >= 3, `Expected at least 3 medications, got ${meds.length}`);

  const augmentin = meds.find(m => m.name.toLowerCase().includes('augmentin'));
  assert.ok(!!augmentin, 'Augmentin extracted');
  assert.strictEqual(augmentin.dosage, '625mg');
  assert.strictEqual(augmentin.frequency, '1-0-1');
  assert.strictEqual(augmentin.durationDays, 5);
  assert.ok(augmentin.instructions.toLowerCase().includes('after'));

  const dolo = meds.find(m => m.name.toLowerCase().includes('dolo'));
  assert.ok(!!dolo, 'Dolo 650mg extracted');
  assert.strictEqual(dolo.dosage, '650mg');
  assert.strictEqual(dolo.times.length, 3);
});

// Test 2: Chronic sample parsing
it('Extracts Metformin from Chronic sample with 30-day course', () => {
  const chronicSample = SAMPLE_PRESCRIPTIONS.find(s => s.id === 'sample-chronic');
  const meds = MedicalParser.parsePrescriptionText(chronicSample.text);
  assert.ok(meds.length >= 3);

  const metformin = meds.find(m => m.name.toLowerCase().includes('metformin'));
  assert.ok(!!metformin);
  assert.strictEqual(metformin.durationDays, 30);
});

// Test 3: Google Calendar Web Intent URL Generation
it('Generates Google Calendar Intent URLs with RRULE recurrence', () => {
  const acuteSample = SAMPLE_PRESCRIPTIONS.find(s => s.id === 'sample-acute');
  const meds = MedicalParser.parsePrescriptionText(acuteSample.text);
  const augmentin = meds.find(m => m.name.toLowerCase().includes('augmentin'));

  const gcalUrls = CalendarHelper.generateMedicationCalendarUrls(augmentin);
  assert.strictEqual(gcalUrls.length, 2);
  const mornUrl = gcalUrls[0].url;
  assert.ok(mornUrl.startsWith('https://calendar.google.com/calendar/render?action=TEMPLATE'));
  assert.ok(mornUrl.includes('text=%F0%9F%92%8A%20Take%20Augmentin'));
  assert.ok(mornUrl.includes('recur=RRULE%3AFREQ%3DDAILY%3BCOUNT%3D5'));
});

// Test 4: iCalendar (.ICS) Export Generation
it('Generates valid iCalendar (.ics) with VEVENT and VALARM', () => {
  const acuteSample = SAMPLE_PRESCRIPTIONS.find(s => s.id === 'sample-acute');
  const meds = MedicalParser.parsePrescriptionText(acuteSample.text);
  const ics = CalendarHelper.generateIcs(meds);
  assert.ok(ics.includes('BEGIN:VCALENDAR'));
  assert.ok(ics.includes('BEGIN:VEVENT'));
  assert.ok(ics.includes('RRULE:FREQ=DAILY;COUNT=5'));
  assert.ok(ics.includes('BEGIN:VALARM'));
});

// Test 5: Alternate Days Schedule Pattern
it('Parses Alternate Days schedule with INTERVAL=2 recurrence', () => {
  const altSample = SAMPLE_PRESCRIPTIONS.find(s => s.id === 'sample-alternate-schedule');
  assert.ok(!!altSample);
  const altMeds = MedicalParser.parsePrescriptionText(altSample.text);

  const azithroAlt = altMeds.find(m => m.name.toLowerCase().includes('azithromycin'));
  assert.ok(!!azithroAlt);
  assert.strictEqual(azithroAlt.scheduleType, 'ALTERNATE_DAYS');

  const azithroGcal = CalendarHelper.generateMedicationCalendarUrls(azithroAlt);
  assert.ok(azithroGcal[0].url.includes('INTERVAL%3D2'));
});

// Test 6: 3 Days a Week Schedule Pattern (Mon, Wed, Fri)
it('Parses 3 Days a Week schedule with BYDAY=MO,WE,FR recurrence', () => {
  const altSample = SAMPLE_PRESCRIPTIONS.find(s => s.id === 'sample-alternate-schedule');
  const altMeds = MedicalParser.parsePrescriptionText(altSample.text);

  const calcium3D = altMeds.find(m => m.name.toLowerCase().includes('calcium'));
  assert.ok(!!calcium3D);
  assert.strictEqual(calcium3D.scheduleType, 'THREE_DAYS_A_WEEK');

  const calciumGcal = CalendarHelper.generateMedicationCalendarUrls(calcium3D);
  assert.ok(calciumGcal[0].url.includes('BYDAY%3DMO%2CWE%2CFR'));
});

// Test 7: Evening / Night Only Pattern
it('Parses Evening / Night Only schedule with single night slot', () => {
  const altSample = SAMPLE_PRESCRIPTIONS.find(s => s.id === 'sample-alternate-schedule');
  const altMeds = MedicalParser.parsePrescriptionText(altSample.text);

  const montairEve = altMeds.find(m => m.name.toLowerCase().includes('montair'));
  assert.ok(!!montairEve);
  assert.strictEqual(montairEve.scheduleType, 'EVENING_ONLY');
  assert.strictEqual(montairEve.times.length, 1);
  assert.strictEqual(montairEve.times[0].slot, 'Night');
});

// Test 8: File Size Limit (5 MB) validation
it('Enforces 5 MB file size limit on prescription uploads', () => {
  let rejected = false;
  try {
    ImageReader.validateFile({ name: 'huge_scan.jpg', size: 6 * 1024 * 1024, type: 'image/jpeg' });
  } catch (err) {
    rejected = true;
    assert.ok(err.message.includes('5 MB'));
  }
  assert.ok(rejected);

  const accepted = ImageReader.validateFile({ name: 'rx_photo.png', size: 3.5 * 1024 * 1024, type: 'image/png' });
  assert.ok(accepted.isImage && !accepted.isPdf);
});

console.log(`\n========================================`);
console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log(`========================================\n`);

if (failed > 0) process.exit(1);
console.log('🎉 ALL AUTOMATED TESTS PASSED 100%!\n');
