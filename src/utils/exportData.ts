import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

/**
 * @param data       Array of flat objects to export
 * @param filename   Base filename (no extension)
 * @param type       'csv' | 'xlsx'
 * @param sheetName  Name of the Excel sheet (only for xlsx)
 * @param headersMap Optional map { objectKey: columnTitle }, 
 *                   defines both column order and header text.
 */
export function exportData(
  data: Record<string, any>[],
  filename: string,
  type: 'csv' | 'xlsx' = 'xlsx',
  sheetName = 'Sheet1',
  headersMap?: Record<string, string>
) {
  let worksheet: XLSX.WorkSheet;

  if (headersMap) {
    // 1) Build an array-of-arrays for rows: first the header row, then the data rows
    const keys = Object.keys(headersMap);
    const headerRow = keys.map(k => headersMap[k]);
    const dataRows = data.map(item => keys.map(k => item[k]));

    // 2) Convert to sheet
    worksheet = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);
  } else {
    // Fallback: sheet from JSON, headers auto-derived from keys
    worksheet = XLSX.utils.json_to_sheet(data);
  }

  if (type === 'csv') {
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    saveAs(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `${filename}.csv`);
    return;
  }

  // XLSX path
  const workbook = XLSX.utils.book_new();
  // Use the localized sheetName here:
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

  saveAs(
    new Blob([wbout], {
      type:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    `${filename}.xlsx`
  );
}
