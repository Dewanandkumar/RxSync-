/**
 * Medical Prescription Pattern Parser
 * Extracts medications, dosages, frequency (1-0-1, BID, TDS, etc.), food instructions, and duration.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MedicalParser = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  // Common dosage forms
  const FORM_PATTERNS = [
    { type: 'Tablet', regex: /\b(tab(?:let)?s?|caplet)\b/i },
    { type: 'Capsule', regex: /\b(cap(?:sule)?s?)\b/i },
    { type: 'Syrup', regex: /\b(syp|syrup|susp(?:ension)?|sol(?:ution)?|liquid)\b/i },
    { type: 'Injection', regex: /\b(inj(?:ection)?|iv|im)\b/i },
    { type: 'Drops', regex: /\b(drop(?:s)?|eye\s*drops?|ear\s*drops?|nasal\s*drops?)\b/i },
    { type: 'Inhaler', regex: /\b(inhaler|puff(?:s)?|rotacap)\b/i },
    { type: 'Ointment', regex: /\b(oint(?:ment)?|cream|gel)\b/i }
  ];

  // Frequency Patterns and Mappings
  const FREQ_PATTERNS = [
    // Matrix style: 1-0-1, 1-1-1, 0-0-1, 1-0-0, 1 - 0 - 1, 1+0+1
    {
      regex: /\b([0-2])\s*[-+–/]\s*([0-2])\s*[-+–/]\s*([0-2])(?:\s*[-+–/]\s*([0-2]))?\b/,
      handler: (m) => {
        const morn = parseInt(m[1], 10);
        const noon = parseInt(m[2], 10);
        const night = parseInt(m[3], 10);
        const fourth = m[4] ? parseInt(m[4], 10) : 0;
        const times = [];
        if (morn > 0) times.push({ slot: 'Morning', defaultTime: '08:00', count: morn });
        if (noon > 0) times.push({ slot: 'Afternoon', defaultTime: '13:00', count: noon });
        if (night > 0) times.push({ slot: 'Night', defaultTime: '20:30', count: night });
        if (fourth > 0) times.push({ slot: 'Bedtime', defaultTime: '22:30', count: fourth });
        return {
          notation: m[0],
          times: times,
          description: formatSlotsDesc(times)
        };
      }
    },
    // Standard Latin / Medical abbreviations
    {
      regex: /\b(OD|ONCE\s+DAILY|ONCE\s+A\s+DAY|QD)\b/i,
      handler: () => ({
        notation: 'OD (Once Daily)',
        times: [{ slot: 'Morning', defaultTime: '08:00', count: 1 }],
        description: 'Once daily (Morning)'
      })
    },
    {
      regex: /\b(BD|BID|TWICE\s+DAILY|TWICE\s+A\s+DAY)\b/i,
      handler: () => ({
        notation: 'BD (Twice Daily)',
        times: [
          { slot: 'Morning', defaultTime: '08:00', count: 1 },
          { slot: 'Night', defaultTime: '20:30', count: 1 }
        ],
        description: 'Twice daily (Morning & Night)'
      })
    },
    {
      regex: /\b(TDS|TID|THRICE\s+DAILY|THREE\s+TIMES\s+A\s+DAY)\b/i,
      handler: () => ({
        notation: 'TDS (Three Times Daily)',
        times: [
          { slot: 'Morning', defaultTime: '08:00', count: 1 },
          { slot: 'Afternoon', defaultTime: '13:30', count: 1 },
          { slot: 'Night', defaultTime: '20:30', count: 1 }
        ],
        description: '3 times daily (Morning, Afternoon, Night)'
      })
    },
    {
      regex: /\b(QID|FOUR\s+TIMES\s+A\s+DAY|4\s+TIMES\s+A\s+DAY)\b/i,
      handler: () => ({
        notation: 'QID (Four Times Daily)',
        times: [
          { slot: 'Morning', defaultTime: '08:00', count: 1 },
          { slot: 'Noon', defaultTime: '12:30', count: 1 },
          { slot: 'Evening', defaultTime: '17:00', count: 1 },
          { slot: 'Night', defaultTime: '21:30', count: 1 }
        ],
        description: '4 times daily'
      })
    },
    {
      regex: /\b(HS|BEDTIME|AT\s+NIGHT)\b/i,
      handler: () => ({
        notation: 'HS (Bedtime)',
        times: [{ slot: 'Night', defaultTime: '21:30', count: 1 }],
        description: 'At bedtime'
      })
    },
    {
      regex: /\b(SOS|PRN|AS\s+NEEDED|WHEN\s+REQUIRED)\b/i,
      handler: () => ({
        notation: 'SOS (As Needed)',
        times: [{ slot: 'As Needed', defaultTime: '09:00', count: 1 }],
        description: 'Take only as needed / when required'
      })
    },
    {
      regex: /\bEVERY\s*([0-9]+)\s*HOURS?\b/i,
      handler: (m) => {
        const hours = parseInt(m[1], 10);
        return {
          notation: `Every ${hours} hours`,
          times: [{ slot: 'Recurring Interval', defaultTime: '08:00', count: 1, intervalHours: hours }],
          description: `Take every ${hours} hours`
        };
      }
    }
  ];

  // Food Instruction Patterns
  const FOOD_PATTERNS = [
    { regex: /\b(after\s+(?:food|meals?|eating|breakfast|dinner|lunch)|p\.?c\.?)\b/i, instruction: 'After meals (post-food)' },
    { regex: /\b(before\s+(?:food|meals?|eating|breakfast|dinner|lunch)|empty\s+stomach|a\.?c\.?)\b/i, instruction: 'Before meals (empty stomach)' },
    { regex: /\b(with\s+(?:food|meals?))\b/i, instruction: 'With food/meals' },
    { regex: /\b(at\s+bedtime|before\s+sleep)\b/i, instruction: 'At bedtime' },
    { regex: /\b(with\s+warm\s+water|with\s+milk)\b/i, instruction: (m) => m[0] }
  ];

  // Duration Patterns
  const DURATION_PATTERNS = [
    { regex: /(?:for|x|–|-)?\s*([0-9]+)\s*(?:days?|d)\b/i, getDays: (m) => parseInt(m[1], 10), text: (m) => `${m[1]} days` },
    { regex: /(?:for|x|–|-)?\s*([0-9]+)\s*(?:weeks?|wk|w)\b/i, getDays: (m) => parseInt(m[1], 10) * 7, text: (m) => `${m[1]} week(s)` },
    { regex: /(?:for|x|–|-)?\s*([0-9]+)\s*(?:months?|m)\b/i, getDays: (m) => parseInt(m[1], 10) * 30, text: (m) => `${m[1]} month(s)` },
    { regex: /\bcontinuous(?:ly)?|ongoing|regularly\b/i, getDays: () => 30, text: () => 'Ongoing (30 days default)' }
  ];

  function formatSlotsDesc(times) {
    return times.map(t => `${t.count > 1 ? t.count + 'x ' : ''}${t.slot} (${t.defaultTime})`).join(', ');
  }

  // Regex for continuation lines (not standalone medications)
  const CONTINUATION_REGEX = /^(?:dosage|directions?|sig|instructions?|route|notes?|remarks?|advice)\s*[:\-]/i;

  function parsePrescriptionText(text) {
    if (!text || typeof text !== 'string') return [];

    const lines = text.split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length > 0);

    const medications = [];

    const IGNORE_PATTERNS = [
      /^(dr\.|doctor|patient|date|rx|clinic|hospital|age|gender|weight|bp|temp|diagnosis|investigation|chief complaint|advice|signature|follow\s*up|sign|reg\s*no)/i,
      /^[\W_]+$/
    ];

    let currentMed = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip obvious metadata/headers
      if (IGNORE_PATTERNS.some(p => p.test(line))) {
        continue;
      }

      // If line is an explicit continuation of previous med
      if (currentMed && CONTINUATION_REGEX.test(line)) {
        enrichMedicationFromLine(currentMed, line);
        continue;
      }

      // Check if line looks like a medication
      const parsed = parseLineForMedication(line);
      if (parsed) {
        currentMed = parsed;
        medications.push(parsed);
      } else if (currentMed) {
        // Check if this line is an instruction or duration for the current med
        enrichMedicationFromLine(currentMed, line);
      }
    }

    if (medications.length === 0) {
      return fallbackExtraction(text);
    }

    return medications;
  }

  function parseLineForMedication(line) {
    // If it starts with continuation prefix, it's not a standalone medication
    if (CONTINUATION_REGEX.test(line)) {
      return null;
    }

    // Check for Form (Tab, Cap, Syp, etc.) or Dosage (mg, ml, etc.)
    let form = 'Medicine';
    for (const f of FORM_PATTERNS) {
      if (f.regex.test(line)) {
        form = f.type;
        break;
      }
    }

    // Check for Dosage (e.g., 500mg, 650 mg, 10ml, 20mcg, 0.5%)
    const dosageMatch = line.match(/\b([0-9]+(?:\.[0-9]+)?\s*(?:mg|ml|mcg|gm|g|iu|%))\b/i);
    const dosage = dosageMatch ? dosageMatch[1] : '';

    // Check for Frequency (1-0-1, BD, TDS, etc.)
    let frequency = null;
    for (const fp of FREQ_PATTERNS) {
      const match = line.match(fp.regex);
      if (match) {
        frequency = fp.handler(match);
        break;
      }
    }

    // If no form, no dosage, and no frequency, probably not a medication line
    if (form === 'Medicine' && !dosage && !frequency) {
      return null;
    }

    // Extract Food Instructions
    let instruction = 'As directed by physician';
    for (const food of FOOD_PATTERNS) {
      const match = line.match(food.regex);
      if (match) {
        instruction = typeof food.instruction === 'function' ? food.instruction(match) : food.instruction;
        break;
      }
    }

    // Extract Duration
    let durationDays = 5; // Default standard course
    let durationText = '5 days (default)';
    for (const dur of DURATION_PATTERNS) {
      const match = line.match(dur.regex);
      if (match) {
        durationDays = dur.getDays(match);
        durationText = dur.text(match);
        break;
      }
    }

    // Clean Medicine Name
    let cleanName = line
      .replace(/^[0-9]+[.)]\s*/, '')
      .replace(/\b(tab(?:let)?s?|cap(?:sule)?s?|syp(?:rup)?|inj(?:ection)?|drop(?:s)?|ointment|cream)\b\.?\s*/gi, '')
      .trim();

    if (frequency && frequency.notation) {
      cleanName = cleanName.replace(new RegExp(escapeRegex(frequency.notation), 'i'), '');
    }

    cleanName = cleanName
      .replace(/(?:[-+–/]\s*[0-2]\s*)+/g, ' ')
      .replace(/\b(?:for|x)\s*[0-9]+\s*(?:days?|weeks?|months?)\b/gi, ' ')
      .replace(/\b(?:after|before)\s+(?:food|meals?|breakfast|dinner|lunch)\b/gi, ' ')
      .replace(/\b(?:SOS|OD|BD|BID|TDS|TID|QID|HS)\b/gi, ' ')
      .replace(/[-–—,;:.]+\s*$/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

    if (!cleanName || cleanName.length < 2) {
      cleanName = `${form} ${dosage || 'Prescription'}`.trim();
    }

    if (!frequency) {
      frequency = {
        notation: 'OD (Once Daily)',
        times: [{ slot: 'Morning', defaultTime: '08:00', count: 1 }],
        description: 'Once daily (Morning 08:00)'
      };
    }

    // Advanced Schedule Pattern Detection
    let scheduleType = 'DAILY';
    let scheduleLabel = 'Daily';

    if (/\b(alternate\s+days?|every\s+(?:other|alternate)\s+day|q\.?o\.?d\.?|q2d)\b/i.test(line)) {
      scheduleType = 'ALTERNATE_DAYS';
      scheduleLabel = 'Alternate Days (Every 2 days)';
    } else if (/\b(3\s+days?\s*(?:a|per)\s*week|thrice\s+a\s+week|mon(?:day)?\s*[-–,\s]+\s*wed(?:nesday)?\s*[-–,\s]+\s*fri(?:day)?|mwf)\b/i.test(line)) {
      scheduleType = 'THREE_DAYS_A_WEEK';
      scheduleLabel = '3 Days a Week (Mon, Wed, Fri)';
    } else if (/\b(evening\s+only|night\s+only|only\s+at\s+night|at\s+bedtime|hs)\b/i.test(line) || (frequency && frequency.notation === '0-0-1')) {
      scheduleType = 'EVENING_ONLY';
      scheduleLabel = 'Evening / Night Only';
      // Ensure only evening/night slot exists
      if (!frequency.times.some(t => t.slot === 'Night' || t.slot === 'Evening')) {
        frequency.times = [{ slot: 'Night', defaultTime: '20:30', count: 1 }];
      } else {
        frequency.times = frequency.times.filter(t => t.slot === 'Night' || t.slot === 'Evening' || t.slot === 'Bedtime');
      }
      frequency.description = 'Evening / Night Only (20:30)';
    } else if (/\b(once\s+a\s+week|weekly|every\s+week)\b/i.test(line)) {
      scheduleType = 'WEEKLY';
      scheduleLabel = 'Once a Week';
    }

    return {
      id: 'rx_' + Math.random().toString(36).substring(2, 9),
      name: cleanName,
      form: form,
      dosage: dosage || '1 dose',
      frequency: frequency.notation,
      scheduleType: scheduleType,
      scheduleLabel: scheduleLabel,
      times: frequency.times,
      timingDescription: frequency.description,
      instructions: instruction,
      durationDays: durationDays,
      durationText: durationText,
      rawLine: line
    };
  }

  function enrichMedicationFromLine(med, line) {
    // Check if extra line has food instructions
    for (const food of FOOD_PATTERNS) {
      const match = line.match(food.regex);
      if (match && (med.instructions === 'As directed by physician' || !med.instructions)) {
        med.instructions = typeof food.instruction === 'function' ? food.instruction(match) : food.instruction;
      }
    }

    // Check if extra line has duration
    for (const dur of DURATION_PATTERNS) {
      const match = line.match(dur.regex);
      if (match && med.durationText.includes('default')) {
        med.durationDays = dur.getDays(match);
        med.durationText = dur.text(match);
      }
    }

    // Check if extra line has frequency if not already set
    if (!med.frequency || med.frequency.includes('default') || med.frequency === 'OD (Once Daily)') {
      for (const fp of FREQ_PATTERNS) {
        const match = line.match(fp.regex);
        if (match) {
          const freq = fp.handler(match);
          med.frequency = freq.notation;
          med.times = freq.times;
          med.timingDescription = freq.description;
          break;
        }
      }
    }

    // Check dosage if missing
    if (med.dosage === '1 dose') {
      const dosageMatch = line.match(/\b([0-9]+(?:\.[0-9]+)?\s*(?:mg|ml|mcg|gm|g|iu|%))\b/i);
      if (dosageMatch) {
        med.dosage = dosageMatch[1];
      }
    }

    // Check if extra line has advanced schedule info
    if (/\b(alternate\s+days?|every\s+(?:other|alternate)\s+day|q\.?o\.?d\.?|q2d)\b/i.test(line)) {
      med.scheduleType = 'ALTERNATE_DAYS';
      med.scheduleLabel = 'Alternate Days (Every 2 days)';
    } else if (/\b(3\s+days?\s*(?:a|per)\s*week|thrice\s+a\s+week|mon(?:day)?\s*[-–,\s]+\s*wed(?:nesday)?\s*[-–,\s]+\s*fri(?:day)?|mwf)\b/i.test(line)) {
      med.scheduleType = 'THREE_DAYS_A_WEEK';
      med.scheduleLabel = '3 Days a Week (Mon, Wed, Fri)';
    } else if (/\b(evening\s+only|night\s+only|only\s+at\s+night|at\s+bedtime|hs)\b/i.test(line)) {
      med.scheduleType = 'EVENING_ONLY';
      med.scheduleLabel = 'Evening / Night Only';
    }
  }

  function fallbackExtraction(text) {
    const matches = [];
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      if (/\b(?:mg|ml|mcg|tab|cap|syp)\b/i.test(line)) {
        const item = parseLineForMedication(line);
        if (item) matches.push(item);
      }
    }
    return matches;
  }

  function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  return {
    parsePrescriptionText,
    parseLineForMedication
  };
}));

