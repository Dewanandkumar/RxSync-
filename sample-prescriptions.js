/**
 * Sample Medical Prescriptions for Testing and Demonstration
 */
const SAMPLE_PRESCRIPTIONS = [
  {
    id: 'sample-acute',
    title: 'Post-OP / Acute Infection Prescription',
    doctor: 'Dr. Sarah Jenkins, MD (Internal Medicine)',
    text: `CITY CARE CLINIC & HOSPITAL
Doctor: Dr. Sarah Jenkins, MD
Patient: Alex Johnson (Age: 38, Male)
Date: 19-Sep-2026

Rx (Medications):
1. Tab. Augmentin 625mg - 1-0-1 after food x 5 days
2. Tab. Dolo 650mg - 1 tab TDS after food x 3 days
3. Tab. Pan 40mg - 1-0-0 before breakfast x 7 days
4. Syp. Gelusil 10ml - SOS for heartburn

Advice: Drink plenty of water and complete antibiotic course.`
  },
  {
    id: 'sample-chronic',
    title: 'Chronic Condition / Diabetes & Cardiac Care',
    doctor: 'Dr. Rajesh Patel, MBBS, MD (Endocrinologist)',
    text: `APOLLO METRO HEALTHCARE
Dr. Rajesh Patel, MD (Endocrinology)
Patient: Maria Hernandez (Age: 54, Female)
Date: 19-Sep-2026

Prescription:
1. Tab. Metformin 500mg - BD with meals for 30 days
2. Tab. Telmisartan 40mg - OD in morning after breakfast x 30 days
3. Tab. Atorvastatin 20mg - 0-0-1 HS at bedtime x 30 days
4. Cap. Evion 400mg - 1 cap OD x 15 days

Follow up after 1 month with Fasting Blood Sugar report.`
  },
  {
    id: 'sample-cold-allergy',
    title: 'Seasonal Allergy & Respiratory Relief',
    doctor: 'Dr. Emily Vance, Pulmonology & Allergy',
    text: `ST. JUDE WELLNESS CLINIC
Rx Prescribed:
1. Tab. Montair-LC (Montelukast + Levocetirizine) - 0-0-1 at night for 10 days
2. Tab. Azithromycin 500mg - 1-0-0 empty stomach x 3 days
3. Syp. Ascoril-D 10ml - TDS thrice daily after food x 5 days
4. Tab. Paracetamol 500mg - 1 tab SOS for body ache or fever`
  },
  {
    id: 'sample-alternate-schedule',
    title: 'Alternate Days & 3 Days/Week Special Course',
    doctor: 'Dr. Vikram Malhotra, MD (Rheumatology & Immunology)',
    text: `NATIONAL CARE CLINIC
Doctor: Dr. Vikram Malhotra, MD
Patient: Rakesh Sharma (Age: 46)

Rx:
1. Tab. Azithromycin 500mg - 1 tab on alternate days x 6 days
2. Tab. Calcium 500mg - 3 days a week (Mon, Wed, Fri) in morning x 4 weeks
3. Tab. Montair-LC - Evening only at night x 10 days
4. Tab. Paracetamol 650mg - 1 tab SOS for pain`
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SAMPLE_PRESCRIPTIONS;
}
