import { parse } from 'csv-parse/sync';
import validator from 'validator';
import Player from '../control/models/Player';
import isEmail from 'validator/lib/isEmail';


const HEADERS = [
  'firstName','surName','dob','sex','parentName','parentPhone','email',
  'emergencyContactName','emergencyContactPhone','joiningDate',
  'paymentStatus','clubRoles','playerType','enableSkillTracking'
];

const FIELD_MAP: Record<string, string> = {
  firstName: 'firstName',
  surName: 'surName',
  dob: 'dob',
  sex: 'sex',
  parentName: 'parentName',
  parentPhone: 'parentPhone',
  email: 'email',
  emergencyContactName: 'emergencyContactname',            // DB field
  emergencyContactPhone: 'emergencyContactphonenumber',    // DB field
  joiningDate: 'joinDate',                                 // DB field is joinDate
  paymentStatus: 'paymentStatus',
  clubRoles: 'clubRoles',
  playerType: 'playerType',
  enableSkillTracking: 'skillTracking',
};

const SEX = new Set(['Male', 'Female']);
const PAYMENT = new Set(['Paid', 'Due', 'Partial']);
const PLAYERTYPES = new Set([
  'Junior Club Member',
  'Adult Club Member',
  'Coaching only',
  'Coaching and Club Member',
]);

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());

const toBool = (v: any) => {
  const s = String(v ?? '').trim().toLowerCase();
  return s === 'true' || s === '1' || s === 'yes';
};

const parseDate = (v: any) => {
  const s = String(v ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(s + 'T00:00:00Z');
  return Number.isNaN(d.getTime()) ? null : d;
};

const isJuniorFromDOB = (dob: Date) => {
  const t = new Date();
  let age = t.getFullYear() - dob.getFullYear();
  const m = t.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < dob.getDate())) age--;
  return age < 18;
};

export function buildCsvTemplate() {
  const bom = '\uFEFF';
  const headerRow = HEADERS.join(',');
  const sampleRow = [
    'Aarav','Singh','2012-05-03','Male','Ravi Singh','+447700900123',
    'aarav.singh@example.com','Meera Singh','+447700900456','2025-08-17',
    'Due','Club Member|Junior Captain','Junior Club Member','TRUE'
  ].join(',');
  return {
    filename: 'player-upload-template.csv',
    csv: bom + headerRow + '\n' + sampleRow + '\n',
  };
}

type RowReport = {
  row: number;
  status: 'ok' | 'error';
  errors?: string[];
  data?: Record<string, any>;
};

export async function parseAndValidateCsv(
  buffer: Buffer,
  clubId: string,
  mode: 'all' | 'partial'
) {
  const text = buffer.toString('utf8');
  const rows: any[] = parse(text, { columns: true, skip_empty_lines: true, trim: true });

  if (!rows.length) {
    return {
      mode,
      hasErrors: true,
      report: [{ row: 1, status: 'error', errors: ['CSV has no data rows'] }],
      docsToInsert: [] as any[],
    };
  }

  // Prepare duplicate checks against DB
  const emailsInCsv = rows.map(r => String(r.email || '').trim()).filter(Boolean);
  const nameDobInCsv = rows.map(r => {
    const fn = String(r.firstName || '').trim().toLowerCase();
    const sn = String(r.surName || '').trim().toLowerCase();
    const dob = String(r.dob || '').trim();
    return fn && sn && dob ? `${fn}|${sn}|${dob}` : '';
  }).filter(Boolean);

  const existing = await Player.find({
    clubId,
    $or: [
      { email: { $in: emailsInCsv } },
      {
        $expr: {
          $in: [
            {
              $concat: [
                { $toLower: '$firstName' }, '|',
                { $toLower: '$surName' },   '|',
                { $dateToString: { format: '%Y-%m-%d', date: '$dob' } },
              ]
            },
            nameDobInCsv
          ]
        }
      }
    ]
  }).select('email firstName surName dob').lean();

  const existingEmailSet = new Set(
    existing.map((p: any) => String(p.email || '').trim().toLowerCase())
  );
  const existingNameDobSet = new Set(
    existing.map((p: any) => {
      const fn = String(p.firstName || '').trim().toLowerCase();
      const sn = String(p.surName || '').trim().toLowerCase();
      const dob = p.dob ? new Date(p.dob).toISOString().slice(0,10) : '';
      return fn && sn && dob ? `${fn}|${sn}|${dob}` : '';
    })
  );

  // CSV-internal duplicate tracking
  const seenEmails = new Set<string>();
  const seenNameDob = new Set<string>();
  const csvDupEmails = new Set<string>();
  const csvDupNameDob = new Set<string>();

  const report: RowReport[] = [];
  const docsToInsert: any[] = [];

  rows.forEach((raw, idx) => {
    const rowNo = idx + 1;
    const errors: string[] = [];
    const normalized: any = { clubId };

    // map fields
    for (const [csvKey, dbKey] of Object.entries(FIELD_MAP)) {
      normalized[dbKey] = raw[csvKey] ?? '';
    }

    // required basics
    if (!String(normalized.firstName).trim()) errors.push('firstName is required');
    if (!String(normalized.surName).trim()) errors.push('surName is required');

    // dates
    const dob = parseDate(normalized.dob);
    if (!dob) errors.push('dob must be YYYY-MM-DD');
    normalized.dob = dob || null;

    const joinDate = parseDate(normalized.joinDate);
    if (!joinDate) errors.push('joiningDate must be YYYY-MM-DD');
    normalized.joinDate = joinDate || null;

    // sex + payment
    if (!String(normalized.sex).trim()) errors.push('sex is required');
    else if (!SEX.has(normalized.sex)) errors.push('sex must be Male or Female');

    if (!String(normalized.paymentStatus).trim()) errors.push('paymentStatus is required');
    else if (!PAYMENT.has(normalized.paymentStatus)) errors.push('paymentStatus must be Paid|Due|Partial');

    // email
    if (!String(normalized.email).trim()) errors.push('email is required');
    else if (!isValidEmail(String(normalized.email))) errors.push('invalid email');

    // playerType & junior logic
    let playerType = String(normalized.playerType || '').trim();
    if (!playerType) {
      playerType = dob && isJuniorFromDOB(dob) ? 'Junior Club Member' : 'Adult Club Member';
    } else if (!PLAYERTYPES.has(playerType)) {
      errors.push('playerType invalid');
    }
    const isJunior = playerType === 'Junior Club Member' || (dob ? isJuniorFromDOB(dob) : false);

    if (isJunior) {
      if (!String(normalized.parentName).trim()) errors.push('parentName is required for juniors');
      if (!String(normalized.parentPhone).trim()) errors.push('parentPhone is required for juniors');
    } else {
      normalized.parentName = normalized.parentName || '';
      normalized.parentPhone = normalized.parentPhone || '';
    }

    // roles array
    normalized.clubRoles = String(raw.clubRoles || '')
      .split(/[|,]/)
      .map((s: string) => s.trim())
      .filter(Boolean);

    normalized.skillTracking = toBool(raw.enableSkillTracking);

    // dup checks (CSV)
    const emailKey = String(normalized.email || '').trim().toLowerCase();
    if (emailKey) {
      if (seenEmails.has(emailKey)) csvDupEmails.add(emailKey);
      seenEmails.add(emailKey);
    }
    const nameDobKey =
      normalized.firstName && normalized.surName && dob
        ? `${String(normalized.firstName).trim().toLowerCase()}|${String(
            normalized.surName
          ).trim().toLowerCase()}|${dob.toISOString().slice(0,10)}`
        : '';
    if (nameDobKey) {
      if (seenNameDob.has(nameDobKey)) csvDupNameDob.add(nameDobKey);
      seenNameDob.add(nameDobKey);
    }

    // dup checks (DB)
    if (existingEmailSet.has(emailKey)) errors.push('duplicate: email exists in this club');
    if (nameDobKey && existingNameDobSet.has(nameDobKey)) {
      errors.push('duplicate: firstName+surName+dob exists in this club');
    }

    if (errors.length) {
      report.push({ row: rowNo, status: 'error', errors });
    } else {
      docsToInsert.push({
        clubId,
        firstName: normalized.firstName,
        surName: normalized.surName,
        dob: normalized.dob,
        sex: normalized.sex,
        isJunior,
        parentName: normalized.parentName,
        parentPhone: normalized.parentPhone,
        email: normalized.email,
        emergencyContactname: normalized.emergencyContactname,
        emergencyContactphonenumber: normalized.emergencyContactphonenumber,
        joinDate: normalized.joinDate,
        paymentStatus: normalized.paymentStatus,
        clubRoles: normalized.clubRoles,
        playerType,
        skillTracking: normalized.skillTracking,
      });
      report.push({ row: rowNo, status: 'ok', data: { email: normalized.email } });
    }
  });

  // annotate CSV-internal duplicates on error rows
  for (const r of report) {
    if (r.status === 'error') {
      const raw = rows[r.row - 1];
      const emailKey = String(raw.email || '').trim().toLowerCase();
      const nameKey =
        String(raw.firstName || '').trim().toLowerCase() +
        '|' +
        String(raw.surName || '').trim().toLowerCase() +
        '|' +
        String(raw.dob || '').trim();
      if (csvDupEmails.has(emailKey)) r.errors?.push('duplicate in CSV: same email appears multiple times');
      if (csvDupNameDob.has(nameKey)) r.errors?.push('duplicate in CSV: same firstName+surName+dob appears multiple times');
    }
  }

  return {
    mode,
    hasErrors: report.some(r => r.status === 'error'),
    report,
    docsToInsert,
  };
}
