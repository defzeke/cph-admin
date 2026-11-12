// RFC 4180 CSV. Applicant fields are untrusted: a cell starting with = + - @ (or tab/CR) would run as a
// formula in Excel/Sheets, so it gets a leading ' to stay plain text.
export function csvCell(value: unknown) {
  let s = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const toCsv = (rows: unknown[][]) => rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
