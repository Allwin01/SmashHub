// routes/playersTemplate.ts
import { Router } from 'express';

const router = Router();

/**
 * CSV header columns — keep these in the order you expect during import.
 * Use empty values to indicate optional; everything else is expected/validated.
 */
const HEADERS = [
  'firstName',
  'surName',
  'dob',                    // YYYY-MM-DD
  'sex',                    // Male|Female
  'parentName',
  'parentPhone',
  'email',
  'emergencyContactName',
  'emergencyContactPhone',
  'joiningDate',            // YYYY-MM-DD
  'paymentStatus',          // Paid|Due|Partial
  'clubRoles',              // pipe- or comma-separated; you decide in importer
  'playerType',             // Junior Club Member|Coaching only|Coaching and Club Member|Adult Club Member (if used)
  'enableSkillTracking'     // TRUE|FALSE
];

router.get('/api/players/csv-template', (_req, res) => {
  const filename = 'player-upload-template.csv';
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  // Optional: prevent caches serving stale responses
  res.setHeader('Cache-Control', 'no-store');

  // BOM so Excel opens UTF-8 correctly
  const bom = '\uFEFF';

  // one sample row (optional) – keep it commented or blank if you prefer
  const sample = [
    'Aarav',                 // firstName
    'Singh',                 // surName
    '2012-05-03',            // dob
    'Male',                  // sex
    'Ravi Singh',            // parentName
    '+447700900123',         // parentPhone (E.164 suggested)
    'aarav.singh@example.com', // email
    'Meera Singh',           // emergencyContactName
    '+447700900456',         // emergencyContactPhone
    '2025-08-17',            // joiningDate
    'Due',                   // paymentStatus
    'Club Member',           // clubRoles (or multiple: "Club Member|Junior Captain")
    'Junior Club Member',    // playerType
    'TRUE'                   // enableSkillTracking
  ];

  const headerRow = HEADERS.join(',');
  const sampleRow = sample.join(',');

  res.send(bom + headerRow + '\n' + sampleRow + '\n');
});

export default router;
