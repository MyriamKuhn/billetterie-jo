import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

/**
 * Exports an array of flat objects as CSV or Excel.
 *
 * @param data       Array of flat objects to export
 * @param filename   Base filename (without extension)
 * @param type       'csv' | 'xlsx'
 * @param sheetName  Name of the Excel sheet (only used for xlsx)
 * @param headersMap Optional map { objectKey: columnTitle },
 *                   defines both the column order and the header text.
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
    // 1) Build a two-dimensional array: first the header row, then each data row
    const keys = Object.keys(headersMap);
    const headerRow = keys.map(k => headersMap[k]);
    const dataRows = data.map(item => keys.map(k => item[k]));

    // 2) Convert the array-of-arrays into a worksheet
    worksheet = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);
  } else {
    // Fallback: generate a sheet from JSON, with headers inferred from object keys
    worksheet = XLSX.utils.json_to_sheet(data);
  }

  if (type === 'csv') {
    // Convert the worksheet to CSV and trigger download
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    saveAs(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `${filename}.csv`);
    return;
  }

  // Otherwise, build and download an XLSX file
  const workbook = XLSX.utils.book_new();
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
