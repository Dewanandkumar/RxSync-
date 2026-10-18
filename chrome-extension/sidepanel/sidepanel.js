/**
 * Rx to Google Reminder - Popup Controller
 */

let currentMedicines = [];

document.addEventListener('DOMContentLoaded', async () => {
  initDropzone();
  initSampleChips();
  initEventListeners();

  // Load first sample prescription by default for instant trial
  if (typeof SAMPLE_PRESCRIPTIONS !== 'undefined' && SAMPLE_PRESCRIPTIONS.length > 0) {
    loadSamplePrescription(SAMPLE_PRESCRIPTIONS[0].id);
  }
});

function initDropzone() {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');

  dropzone.addEventListener('click', () => fileInput.click());

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = '#1a73e8';
    dropzone.style.background = '#e8f0fe';
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.style.borderColor = '#4285f4';
    dropzone.style.background = '#f8fbff';
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = '#4285f4';
    dropzone.style.background = '#f8fbff';
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handlePdfFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handlePdfFile(e.target.files[0]);
    }
  });
}

function initSampleChips() {
  const container = document.getElementById('sample-chips');
  if (!container || typeof SAMPLE_PRESCRIPTIONS === 'undefined') return;

  container.innerHTML = '';
  SAMPLE_PRESCRIPTIONS.forEach((sample, index) => {
    const chip = document.createElement('button');
    chip.className = 'chip' + (index === 0 ? ' active' : '');
    chip.innerText = sample.title.split('/')[0].trim();
    chip.dataset.id = sample.id;
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      loadSamplePrescription(sample.id);
    });
    container.appendChild(chip);
  });
}

function initEventListeners() {
  // Toggle text area
  const toggleBtn = document.getElementById('toggle-text-btn');
  const textWrap = document.getElementById('text-input-wrap');
  const toggleArrow = document.getElementById('toggle-arrow');
  toggleBtn.addEventListener('click', () => {
    const isHidden = textWrap.classList.toggle('hidden');
    toggleArrow.innerText = isHidden ? '▼' : '▲';
  });

  // Re-parse button
  document.getElementById('btn-parse-text').addEventListener('click', () => {
    const text = document.getElementById('prescription-text').value;
    parseAndRenderText(text);
  });

  // Open sidepanel button
  const btnSp = document.getElementById('btn-open-sidepanel'); if (btnSp) btnSp.addEventListener('click', async () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        await chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' });
        window.close(); // Close popup when side panel opens
      }
    } catch (err) {
      console.warn('Could not open side panel:', err);
    }
  });

  // Sync All button
  document.getElementById('btn-sync-all').addEventListener('click', () => {
    syncAllReminders();
  });

  // Export ICS button
  document.getElementById('btn-export-ics').addEventListener('click', () => {
    exportScheduleIcs();
  });
}

function loadSamplePrescription(id) {
  const sample = SAMPLE_PRESCRIPTIONS.find(s => s.id === id);
  if (!sample) return;
  document.getElementById('prescription-text').value = sample.text;
  parseAndRenderText(sample.text);
}

async function handlePdfFile(file) {
  const dropzone = document.getElementById('dropzone');
  dropzone.querySelector('.drop-icon').innerText = '⏳';
  dropzone.querySelector('.drop-text').innerText = `Reading ${file.name}...`;

  try {
    const result = await PdfReader.extractTextFromPdf(file);
    document.getElementById('prescription-text').value = result.text;
    
    dropzone.querySelector('.drop-icon').innerText = '✅';
    dropzone.querySelector('.drop-text').innerText = `${file.name} (${result.numPages} page)`;
    dropzone.querySelector('.drop-sub').innerText = 'Prescription successfully parsed';

    parseAndRenderText(result.text);
  } catch (err) {
    console.error('PDF extraction error:', err);
    dropzone.querySelector('.drop-icon').innerText = '❌';
    dropzone.querySelector('.drop-text').innerText = 'Failed to read PDF';
    dropzone.querySelector('.drop-sub').innerText = err.message || 'Please try pasting text';
  } finally {
    const fileInput = document.getElementById('file-input');
    if (fileInput) fileInput.value = '';
  }
}

function parseAndRenderText(text) {
  if (!text || !text.trim()) {
    renderMedications([]);
    return;
  }
  const medicines = MedicalParser.parsePrescriptionText(text);
  renderMedications(medicines);
}

function renderMedications(medicines) {
  currentMedicines = medicines;
  const container = document.getElementById('med-container');
  const counter = document.getElementById('med-counter');
  const btnSyncAll = document.getElementById('btn-sync-all');
  const btnExport = document.getElementById('btn-export-ics');

  if (!medicines || medicines.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>No medications recognized. Check if drug names and dosages (e.g. 500mg, 1-0-1) are clearly listed.</p>
      </div>`;
    counter.innerText = '0 Detected';
    btnSyncAll.disabled = true;
    btnExport.disabled = true;
    return;
  }

  counter.innerText = `${medicines.length} Detected`;
  btnSyncAll.disabled = false;
  btnExport.disabled = false;

  container.innerHTML = '';

  medicines.forEach(med => {
    const card = document.createElement('div');
    card.className = 'med-card';

    const reminderUrls = CalendarHelper.generateMedicationCalendarUrls(med);

    const slotsHtml = reminderUrls.map(rem => `
      <div class="slot-item">
        <div class="slot-desc">⏰ ${rem.slot} (${rem.time})</div>
        <button class="btn-tap-reminder" data-url="${encodeURI(rem.url)}" title="Open 1-Tap Google Reminder">
          + 1-Tap Reminder
        </button>
      </div>
    `).join('');

    card.innerHTML = `
      <div class="med-top">
        <div>
          <div class="med-name">💊 ${escapeHtml(med.name)}</div>
          <div class="tags-row">
            <span class="tag tag-form">${escapeHtml(med.form)}</span>
            <span class="tag tag-dosage">${escapeHtml(med.dosage)}</span>
            <span class="tag tag-freq">${escapeHtml(med.frequency)}</span>
            <span class="tag tag-dur">${escapeHtml(med.durationText)}</span>
          </div>
        </div>
      </div>
      <div class="med-notes">
        <span><strong>Directions:</strong> ${escapeHtml(med.instructions)}</span>
      </div>
      <div class="slots-list">
        ${slotsHtml}
      </div>
    `;

    // Attach click listeners to reminder buttons
    card.querySelectorAll('.btn-tap-reminder').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const url = decodeURI(e.currentTarget.dataset.url);
        openGoogleReminder(url);
      });
    });

    container.appendChild(card);
  });
}

function openGoogleReminder(url) {
  if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
    chrome.tabs.create({ url: url });
  } else {
    window.open(url, '_blank');
  }
}

function syncAllReminders() {
  if (!currentMedicines || currentMedicines.length === 0) return;
  currentMedicines.forEach(med => {
    const urls = CalendarHelper.generateMedicationCalendarUrls(med);
    urls.forEach(u => openGoogleReminder(u.url));
  });
}

function exportScheduleIcs() {
  if (!currentMedicines || currentMedicines.length === 0) return;
  const icsData = CalendarHelper.generateIcs(currentMedicines);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'Prescription_Google_Reminders.ics');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.innerText = str;
  return div.innerHTML;
}

