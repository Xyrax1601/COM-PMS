import * as XLSX from 'xlsx';

export interface ParsedPatientRow {
  date_registered: Date | null;
  philhealth_number: string;
  complete_name: string;
  age: number | null;
  sex: 'M' | 'F' | 'Other' | '';
  address: string;
  birthday: Date | null;
  contact_number: string;
  date_fpe: Date | null;
  date_consultation: Date | null;
  consultation_status: 'Completed' | 'Pending' | 'No Consultation' | 'Scheduled';
  laboratory_tests: string[];
  raw_laboratories: string;
  medicines: string[];
  raw_medicines: string;
  remarks: string;
  date_follow_up: Date | null;
  source_sheet: string;
  original_row_index: number;
}

export function parseExcelDate(val: any): Date | null {
  if (val === null || val === undefined || val === '') return null;

  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }

  // If number or numeric string (Excel serial)
  const num = typeof val === 'number' ? val : parseFloat(String(val).trim());
  if (!isNaN(num) && num > 1000 && num < 100000) {
    // Excel base date: Dec 30, 1899 due to 1900 leap bug
    const date = new Date(Math.round((num - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime())) return date;
  }

  // String date format (MM/DD/YYYY or YYYY-MM-DD)
  const str = String(val).trim();
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const parts = str.split('/');
    const month = parseInt(parts[0], 10) - 1;
    const day = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export function normalizePhilHealthNumber(val: any): string {
  if (val === null || val === undefined || val === '') return '';
  let str = '';
  if (typeof val === 'number') {
    // Format without scientific notation
    str = val.toLocaleString('fullwide', { useGrouping: false });
  } else {
    str = String(val).trim();
    if (/[eE]/.test(str)) {
      const num = parseFloat(str);
      if (!isNaN(num)) {
        str = num.toLocaleString('fullwide', { useGrouping: false });
      }
    }
  }

  const digits = str.replace(/\D/g, '');
  if (!digits) return '';

  if (digits.length === 12) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 11)}-${digits.slice(11, 12)}`;
  }

  return str;
}

export function normalizeContactNumber(val: any): string {
  if (val === null || val === undefined || val === '') return '';
  let str = '';
  if (typeof val === 'number') {
    str = val.toLocaleString('fullwide', { useGrouping: false });
  } else {
    str = String(val).trim();
    if (/[eE]/.test(str)) {
      const num = parseFloat(str);
      if (!isNaN(num)) {
        str = num.toLocaleString('fullwide', { useGrouping: false });
      }
    }
  }

  const digits = str.replace(/\D/g, '');
  if (!digits) return '';

  if (digits.length === 10 && digits.startsWith('9')) {
    return `0${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('09')) {
    return digits;
  }
  return str;
}

export function normalizeName(val: any): string {
  if (!val) return '';
  let str = String(val).trim();
  // Fix typos like "GALINADA, L;ITO BALAGOT" -> "GALINADA, LITO BALAGOT"
  str = str.replace(/;/g, '');
  // Normalize whitespace
  str = str.replace(/\s+/g, ' ');
  // Ensure space after comma if missing
  str = str.replace(/,([^\s])/g, ', $1');
  return str.toUpperCase();
}

export function parseListItems(val: any): string[] {
  if (!val) return [];
  const str = String(val).trim();
  if (str.toUpperCase() === 'NONE' || str === '-' || str === '') return [];

  return str
    .split(/[,;\n\r]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0 && item.toUpperCase() !== 'NONE');
}

export function calculateAgeFromBirthday(birthday: Date | null, baseDate = new Date()): number | null {
  if (!birthday) return null;
  let age = baseDate.getFullYear() - birthday.getFullYear();
  const m = baseDate.getMonth() - birthday.getMonth();
  if (m < 0 || (m === 0 && baseDate.getDate() < birthday.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

export function parseExcelWorkbook(buffer: Buffer, sheet1Only = false): {
  sheetsParsed: Record<string, ParsedPatientRow[]>;
  unifiedPatients: ParsedPatientRow[];
  summaryStats: Record<string, any>;
} {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetsParsed: Record<string, ParsedPatientRow[]> = {};

  const sheetNames = workbook.SheetNames;

  for (const name of sheetNames) {
    if (name.trim().toUpperCase() === 'SUMMARY') continue;

    const ws = workbook.Sheets[name];
    const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    const rows: ParsedPatientRow[] = [];
    // Row 0 is header, Row 1 is usually empty in the sample, Row 2+ is data
    for (let r = 1; r < data.length; r++) {
      const row = data[r];
      if (!row || row.length === 0) continue;

      const rawDateReg = row[0];
      const rawPhilHealth = row[1];
      const rawName = row[2];
      const rawAge = row[3];
      const rawSex = row[4];
      const rawAddress = row[5];
      const rawBday = row[6];
      const rawContact = row[7];
      const rawFpe = row[8];
      const rawConsult = row[9];
      const rawLab = row[10];
      const rawMeds = row[11];
      const rawRemarks = row[12];
      const rawFollowUp = row[13];

      const cleanName = normalizeName(rawName);
      if (!cleanName && !rawPhilHealth) continue;

      const bday = parseExcelDate(rawBday);
      let age = rawAge !== '' && !isNaN(Number(rawAge)) ? Number(rawAge) : null;
      if (age === null && bday) {
        age = calculateAgeFromBirthday(bday);
      }

      let sex: 'M' | 'F' | 'Other' | '' = '';
      const sexStr = String(rawSex).trim().toUpperCase();
      if (sexStr === 'M' || sexStr === 'MALE') sex = 'M';
      else if (sexStr === 'F' || sexStr === 'FEMALE') sex = 'F';

      const consultStr = String(rawConsult).trim().toUpperCase();
      let consultStatus: 'Completed' | 'Pending' | 'No Consultation' | 'Scheduled' = 'Completed';
      let dateConsult = parseExcelDate(rawConsult);

      if (consultStr.includes('NO CONSULT') || consultStr.includes('NO CONSULTATION')) {
        consultStatus = 'No Consultation';
        dateConsult = null;
      } else if (!dateConsult && !rawConsult) {
        consultStatus = 'Pending';
      }

      let dateReg = parseExcelDate(rawDateReg);
      let dateFpe = parseExcelDate(rawFpe);

      // In the "FPE BUT NOT REGISTERED" worksheet, the encounter date was placed in col 0,
      // but the patient is explicitly unregistered in PhilHealth.
      if (name.trim().toUpperCase().includes('NOT REGISTERED')) {
        if (!dateFpe && dateReg) {
          dateFpe = dateReg;
          dateReg = null;
        }
      }

      rows.push({
        date_registered: dateReg,
        philhealth_number: normalizePhilHealthNumber(rawPhilHealth),
        complete_name: cleanName,
        age,
        sex,
        address: String(rawAddress || '').trim(),
        birthday: bday,
        contact_number: normalizeContactNumber(rawContact),
        date_fpe: dateFpe,
        date_consultation: dateConsult,
        consultation_status: consultStatus,
        laboratory_tests: parseListItems(rawLab),
        raw_laboratories: String(rawLab || '').trim(),
        medicines: parseListItems(rawMeds),
        raw_medicines: String(rawMeds || '').trim(),
        remarks: String(rawRemarks || '').trim(),
        date_follow_up: parseExcelDate(rawFollowUp),
        source_sheet: name,
        original_row_index: r + 1,
      });
    }

    sheetsParsed[name] = rows;
  }

  // Build unified patient list:
  // Sheet1 (or Sheet 2 in workbook) is the comprehensive master list containing 90 entries.
  // Reconcile and enrich with FPE, consults, Sheet4, Sheet5, and Sheet6.
  const masterSheetKey =
    Object.keys(sheetsParsed).find((k) => k.trim().toLowerCase() === 'sheet1') ||
    Object.keys(sheetsParsed)[0];

  const masterList = sheetsParsed[masterSheetKey] || [];
  const unifiedMap = new Map<string, ParsedPatientRow>();

  const getDedupeKey = (row: ParsedPatientRow) => {
    if (row.philhealth_number) return `PH:${row.philhealth_number}`;
    return `NAME:${row.complete_name.replace(/[^A-Z]/g, '')}`;
  };

  for (const row of masterList) {
    const key = getDedupeKey(row);
    unifiedMap.set(key, { ...row });
  }

  // Always include unregistered walk-in/encounter patients from the 'FPE BUT NOT REGISTERED' worksheet
  for (const [sheetName, rows] of Object.entries(sheetsParsed)) {
    if (sheetName.trim().toUpperCase().includes('NOT REGISTERED')) {
      for (const row of rows) {
        const key = getDedupeKey(row);
        if (!unifiedMap.has(key)) {
          unifiedMap.set(key, { ...row });
        }
      }
    }
  }

  // Cross-reference all other sheets to enrich missing data
  // When sheet1Only = true, skip enriching with duplicate sheets
  if (!sheet1Only) {
    for (const [sheetName, rows] of Object.entries(sheetsParsed)) {
      if (sheetName === masterSheetKey) continue;

      for (const row of rows) {
        const key = getDedupeKey(row);
        if (unifiedMap.has(key)) {
          const existing = unifiedMap.get(key)!;
          // Enrich any missing values
          if (!existing.date_fpe && row.date_fpe) existing.date_fpe = row.date_fpe;
          if (!existing.date_consultation && row.date_consultation) {
            existing.date_consultation = row.date_consultation;
            existing.consultation_status = row.consultation_status;
          }
          if (!existing.date_follow_up && row.date_follow_up) existing.date_follow_up = row.date_follow_up;
          if (!existing.remarks && row.remarks) existing.remarks = row.remarks;
          if (existing.laboratory_tests.length === 0 && row.laboratory_tests.length > 0) {
            existing.laboratory_tests = row.laboratory_tests;
            existing.raw_laboratories = row.raw_laboratories;
          }
          if (existing.medicines.length === 0 && row.medicines.length > 0) {
            existing.medicines = row.medicines;
            existing.raw_medicines = row.raw_medicines;
          }
        } else {
          // Patient in another sheet (e.g. Sheet6 Jonathan Khobuntin)
          unifiedMap.set(key, { ...row });
        }
      }
    }
  }

  const unifiedPatients = Array.from(unifiedMap.values());

  return {
    sheetsParsed,
    unifiedPatients,
    summaryStats: {
      totalUnified: unifiedPatients.length,
      sheetsCount: Object.keys(sheetsParsed).length,
    },
  };
}
