const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

const MONTH = String.raw`(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)`;
const DAY = String.raw`(\d{1,2})(?:st|nd|rd|th)?`;
const SEP = String.raw`[\s./,-]*`;
const YEAR = String.raw`(\d{4})`;

const MONTH_FIRST = new RegExp(String.raw`\b${MONTH}\.?${SEP}${DAY}${SEP}${YEAR}\b`, "i");
const DAY_FIRST = new RegExp(String.raw`\b${DAY}${SEP}(?:of\s+)?${MONTH}\.?${SEP}${YEAR}\b`, "i");

function build(y: string, m: string, d: string): string | null {
  const month = MONTHS[m.slice(0, 3).toLowerCase()];
  const day = Number(d);
  const year = Number(y);
  if (!month || day < 1 || day > 31) return null;
  const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const check = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(check.getTime()) && check.toISOString().slice(0, 10) === iso
    ? iso
    : null;
}

/** The service date written in a video title, as YYYY-MM-DD, or null.
 *  Handles "OCTOBER 11TH, 2026", "AUG/9TH/2026" and "29TH SEPTEMBER, 2026". */
export function dateFromTitle(title: string): string | null {
  const a = MONTH_FIRST.exec(title);
  if (a) {
    const iso = build(a[3], a[1], a[2]);
    if (iso) return iso;
  }
  const b = DAY_FIRST.exec(title);
  if (b) return build(b[3], b[2], b[1]);
  return null;
}
