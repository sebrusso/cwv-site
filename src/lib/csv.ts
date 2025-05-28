export interface CSVColumn<T> {
  key: keyof T;
  label: string;
}

export function toCSV<T>(rows: T[], columns: CSVColumn<T>[]): string {
  const header = columns.map((c) => c.label).join(',');
  const body = rows
    .map((row) =>
      columns
        .map((c) => {
          const val = row[c.key];
          const str = val == null ? '' : String(val);
          const escaped = str.replace(/"/g, '""');
          return /[",\n]/.test(str) ? `"${escaped}"` : escaped;
        })
        .join(',')
    )
    .join('\n');
  return `${header}\n${body}`;
}
