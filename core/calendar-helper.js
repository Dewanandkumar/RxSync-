/**
 * Google Calendar & Reminder Generator
 * Generates One-Tap Web Intent URLs, REST API payloads, and standard iCalendar (.ics) files.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CalendarHelper = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  /**
   * Formats a Date object to YYYYMMDDTHHmmSS format (local time)
   */
  function formatGoogleCalendarDate(date) {
    const pad = (n) => String(n).padStart(2, '0');
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
    return `${y}${m}${d}T${hh}${mm}${ss}`;
  }

  /**
   * Generates a 1-Tap Google Calendar Web Intent URL
   * Opens Google Calendar directly with title, timing, recurrence, and prescription instructions pre-filled.
   */
  function generateGoogleCalendarUrl(medication, slot, options = {}) {
    const startDate = options.startDate ? new Date(options.startDate) : new Date();
    
    // Parse slot time (e.g., "08:00", "20:30")
    const timeParts = (slot.customTime || slot.defaultTime || '08:00').split(':');
    const rawH = parseInt(timeParts[0], 10);
    const hours = isNaN(rawH) ? 8 : rawH;
    const rawM = parseInt(timeParts[1], 10);
    const minutes = isNaN(rawM) ? 0 : rawM;

    const eventStart = new Date(startDate);
    eventStart.setHours(hours, minutes, 0, 0);

    const eventEnd = new Date(eventStart);
    eventEnd.setMinutes(eventEnd.getMinutes() + 15); // 15 min reminder block

    const startStr = formatGoogleCalendarDate(eventStart);
    const endStr = formatGoogleCalendarDate(eventEnd);

    const title = `💊 Take ${medication.name} (${medication.dosage})`;
    
    const details = [
      `Medicine: ${medication.name}`,
      `Dosage: ${medication.dosage} (${medication.form})`,
      `Schedule: ${slot.slot} at ${slot.customTime || slot.defaultTime}`,
      `Instructions: ${medication.instructions}`,
      `Duration: ${medication.durationText}`,
      `Prescription frequency: ${medication.frequency}`,
      `\nSet via One-Tap Medical Prescription Reminder`
    ].join('\n');

    let url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startStr}/${endStr}&details=${encodeURIComponent(details)}&location=${encodeURIComponent('Home / Health Routine')}`;

    // Add Recurrence Rule
    if (medication.durationDays && medication.durationDays > 1) {
      const rrule = `RRULE:FREQ=DAILY;COUNT=${medication.durationDays}`;
      url += `&recur=${encodeURIComponent(rrule)}`;
    }

    url += '&sf=true&output=xml';
    return url;
  }

  /**
   * Generates Google Calendar URLs for all slots of a medication
   */
  function generateMedicationCalendarUrls(medication, options = {}) {
    const slots = medication.times && medication.times.length > 0
      ? medication.times
      : [{ slot: 'Dose', defaultTime: '08:00', count: 1 }];

    return slots.map(slot => ({
      slot: slot.slot,
      time: slot.customTime || slot.defaultTime,
      url: generateGoogleCalendarUrl(medication, slot, options)
    }));
  }

  /**
   * Generates a complete iCalendar (.ics) file content for all medicines
   * Allows single-click import of the entire multi-day medical schedule into Google Calendar or Apple Calendar.
   */
  function generateIcs(medications, options = {}) {
    const startDate = options.startDate ? new Date(options.startDate) : new Date();
    const pad = (n) => String(n).padStart(2, '0');

    let ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Medical Prescription Reminder//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Prescription Reminders'
    ];

    medications.forEach(med => {
      const slots = med.times && med.times.length > 0
        ? med.times
        : [{ slot: 'Dose', defaultTime: '08:00', count: 1 }];

      slots.forEach(slot => {
        const timeParts = (slot.customTime || slot.defaultTime || '08:00').split(':');
        const rawH = parseInt(timeParts[0], 10);
        const h = isNaN(rawH) ? 8 : rawH;
        const rawM = parseInt(timeParts[1], 10);
        const m = isNaN(rawM) ? 0 : rawM;

        const eventDate = new Date(startDate);
        eventDate.setHours(h, m, 0, 0);

        const endDate = new Date(eventDate);
        endDate.setMinutes(endDate.getMinutes() + 15);

        const dtStamp = formatGoogleCalendarDate(new Date()) + 'Z';
        const dtStart = formatGoogleCalendarDate(eventDate);
        const dtEnd = formatGoogleCalendarDate(endDate);
        const uid = `med-${med.id}-${slot.slot}-${Date.now()}@rxreminder.local`;

        ics.push('BEGIN:VEVENT');
        ics.push(`UID:${uid}`);
        ics.push(`DTSTAMP:${dtStamp}`);
        ics.push(`DTSTART:${dtStart}`);
        ics.push(`DTEND:${dtEnd}`);
        ics.push(`SUMMARY:💊 Take ${med.name} (${med.dosage})`);
        ics.push(`DESCRIPTION:${med.instructions} - ${med.durationText}. Prescribed dose: ${slot.slot}`);
        ics.push(`LOCATION:Home`);

        if (med.durationDays && med.durationDays > 1) {
          ics.push(`RRULE:FREQ=DAILY;COUNT=${med.durationDays}`);
        }

        // Add 0-minute and 10-minute alarms
        ics.push('BEGIN:VALARM');
        ics.push('TRIGGER:-PT0M');
        ics.push('ACTION:DISPLAY');
        ics.push(`DESCRIPTION:Time to take ${med.name} (${med.dosage})`);
        ics.push('END:VALARM');

        ics.push('END:VEVENT');
      });
    });

    ics.push('END:VCALENDAR');
    return ics.join('\r\n');
  }

  /**
   * Builds a Google Calendar API (v3) Event JSON Resource
   * For direct 1-tap insertion when user is authorized via OAuth or Chrome Identity
   */
  function buildGoogleCalendarApiPayload(medication, slot, options = {}) {
    const startDate = options.startDate ? new Date(options.startDate) : new Date();
    const timeZone = options.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

    const timeParts = (slot.customTime || slot.defaultTime || '08:00').split(':');
    const rawH = parseInt(timeParts[0], 10);
    const h = isNaN(rawH) ? 8 : rawH;
    const rawM = parseInt(timeParts[1], 10);
    const m = isNaN(rawM) ? 0 : rawM;

    const start = new Date(startDate);
    start.setHours(h, m, 0, 0);

    const end = new Date(start);
    end.setMinutes(end.getMinutes() + 15);

    const payload = {
      summary: `💊 Take ${medication.name} (${medication.dosage})`,
      description: `Dosage: ${medication.dosage}\nInstructions: ${medication.instructions}\nDuration: ${medication.durationText}\nSlot: ${slot.slot}`,
      start: {
        dateTime: start.toISOString(),
        timeZone: timeZone
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: timeZone
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 0 },
          { method: 'popup', minutes: 10 }
        ]
      }
    };

    if (medication.durationDays && medication.durationDays > 1) {
      payload.recurrence = [`RRULE:FREQ=DAILY;COUNT=${medication.durationDays}`];
    }

    return payload;
  }

  return {
    generateGoogleCalendarUrl,
    generateMedicationCalendarUrls,
    generateIcs,
    buildGoogleCalendarApiPayload
  };
}));
