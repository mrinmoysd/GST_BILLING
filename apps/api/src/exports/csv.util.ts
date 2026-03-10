function escapeCsvCell(value: string) {
  // RFC4180-ish: wrap in quotes if cell contains comma/quote/newline.
  const needsQuotes = /[",\n\r]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

export function toCsv(
  rows: Array<Record<string, string | number | null | undefined>>,
) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const lines: string[] = [];
  lines.push(headers.map(escapeCsvCell).join(','));

  for (const row of rows) {
    const cells = headers.map((h) => {
      const v = row[h];
      return escapeCsvCell(v === null || v === undefined ? '' : String(v));
    });
    lines.push(cells.join(','));
  }

  return lines.join('\n') + '\n';
}
