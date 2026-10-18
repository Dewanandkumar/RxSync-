/**
 * RxReminderSDK - Medical Prescription to Google Reminder SDK
 * Lightweight, zero-dependency client library for parsing prescriptions and triggering 1-tap Google Reminders.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['./core/medical-parser', './core/calendar-helper', './core/pdf-reader'], factory);
  } else if (typeof module === 'object' && module.exports) {
    const MedicalParser = require('./core/medical-parser');
    const CalendarHelper = require('./core/calendar-helper');
    const PdfReader = require('./core/pdf-reader');
    module.exports = factory(MedicalParser, CalendarHelper, PdfReader);
  } else {
    root.RxReminderSDK = factory(root.MedicalParser, root.CalendarHelper, root.PdfReader);
  }
}(typeof self !== 'undefined' ? self : this, function (MedicalParser, CalendarHelper, PdfReader) {

  const SDK = {
    version: '1.0.0',

    /**
     * Parses freeform or structured prescription text into normalized medication schedules
     * @param {string} text
     * @returns {Array<Object>} List of parsed medicines
     */
    parseText(text) {
      if (!MedicalParser) {
        throw new Error('MedicalParser core module is missing.');
      }
      return MedicalParser.parsePrescriptionText(text);
    },

    /**
     * Reads a PDF prescription file/buffer and extracts medication schedules
     * @param {File|Blob|ArrayBuffer} fileOrBuffer
     * @returns {Promise<{ medicines: Array<Object>, rawText: string, numPages: number, isScanned: boolean }>}
     */
    async parsePdf(fileOrBuffer) {
      if (!PdfReader) {
        throw new Error('PdfReader core module is missing.');
      }
      const pdfResult = await PdfReader.extractTextFromPdf(fileOrBuffer);
      const medicines = this.parseText(pdfResult.text);

      return {
        medicines: medicines,
        rawText: pdfResult.text,
        numPages: pdfResult.numPages,
        isScanned: pdfResult.isScannedLikely
      };
    },

    /**
     * Generates a 1-tap Google Calendar Web Intent URL for a specific medicine time slot
     * @param {Object} medicine
     * @param {Object} slot (e.g. { slot: 'Morning', defaultTime: '08:00' })
     * @param {Object} [options]
     * @returns {string} URL
     */
    getGoogleReminderUrl(medicine, slot, options = {}) {
      if (!CalendarHelper) throw new Error('CalendarHelper module missing');
      return CalendarHelper.generateGoogleCalendarUrl(medicine, slot, options);
    },

    /**
     * Generates 1-tap Google Calendar URLs for each dose slot of a medicine
     * @param {Object} medicine
     * @param {Object} [options]
     * @returns {Array<{ slot: string, time: string, url: string }>}
     */
    getMedicineReminderUrls(medicine, options = {}) {
      if (!CalendarHelper) throw new Error('CalendarHelper module missing');
      return CalendarHelper.generateMedicationCalendarUrls(medicine, options);
    },

    /**
     * Generates Google Calendar reminder URLs for all medicines in the prescription
     * @param {Array<Object>} medicines
     * @param {Object} [options]
     * @returns {Array<Object>}
     */
    getAllReminderUrls(medicines, options = {}) {
      return medicines.map(med => ({
        medicine: med,
        reminders: this.getMedicineReminderUrls(med, options)
      }));
    },

    /**
     * Generates iCalendar (.ics) format string for bulk import into Google Calendar
     * @param {Array<Object>} medicines
     * @param {Object} [options]
     * @returns {string}
     */
    generateIcs(medicines, options = {}) {
      if (!CalendarHelper) throw new Error('CalendarHelper module missing');
      return CalendarHelper.generateIcs(medicines, options);
    },

    /**
     * Triggers browser download of the complete .ics prescription schedule
     * @param {Array<Object>} medicines
     * @param {string} [filename='Prescription_Reminders.ics']
     * @param {Object} [options]
     */
    downloadIcs(medicines, filename = 'Prescription_Reminders.ics', options = {}) {
      const icsData = this.generateIcs(medicines, options);
      const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },

    /**
     * Opens a Google Reminder URL directly in a new window/tab
     * @param {string} url
     */
    openReminder(url) {
      if (typeof window !== 'undefined' && window.open) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    },

    /**
     * Builds Google Calendar REST API event object (for OAuth background insertion)
     */
    buildApiPayload(medicine, slot, options = {}) {
      if (!CalendarHelper) throw new Error('CalendarHelper module missing');
      return CalendarHelper.buildGoogleCalendarApiPayload(medicine, slot, options);
    }
  };

  return SDK;
}));
