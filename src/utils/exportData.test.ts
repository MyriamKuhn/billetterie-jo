// src/utils/exportData.test.ts

// 1) Mock modules before any imports, so Vitest hoists them correctly:
vi.mock('xlsx', () => {
  const aoa_to_sheet = vi.fn();
  const json_to_sheet = vi.fn();
  const sheet_to_csv = vi.fn(() => 'csv-content');
  const book_new = vi.fn(() => ({}));
  const book_append_sheet = vi.fn();
  const write = vi.fn(() => new Uint8Array([1, 2, 3]));

  return {
    __esModule: true,
    utils: {
      aoa_to_sheet,
      json_to_sheet,
      sheet_to_csv,
      book_new,
      book_append_sheet,
    },
    write,
  };
});

vi.mock('file-saver', () => ({
  __esModule: true,
  saveAs: vi.fn(),
}));

// 2) Now import the util under test (it will pick up the mocks)
import { exportData } from './exportData';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import type { Mock } from 'vitest';

describe('exportData', () => {
  const data = [
    { a: 1, b: 2 },
    { a: 3, b: 4 },
  ];
  const headersMap = { a: 'A', b: 'B' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports CSV using headersMap', () => {
    exportData(data, 'testfile', 'csv', 'SheetName', headersMap);

    expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith([
      ['A', 'B'],
      [1, 2],
      [3, 4],
    ]);
    expect(XLSX.utils.sheet_to_csv).toHaveBeenCalled();

    expect(saveAs).toHaveBeenCalledTimes(1);
    const [blob, filename] = (saveAs as any).mock.calls[0];
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('text/csv;charset=utf-8;');
    expect(filename).toBe('testfile.csv');
  });

  it('exports CSV fallback when no headersMap', () => {
    exportData(data, 'nofallback', 'csv');

    expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith(data);
    expect(XLSX.utils.sheet_to_csv).toHaveBeenCalled();

    const [, filename] = (saveAs as any).mock.calls[0];
    expect(filename).toBe('nofallback.csv');
  });

  it('exports XLSX using headersMap', () => {
    exportData(data, 'excel', 'xlsx', 'MySheet', headersMap);

    expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith([
      ['A', 'B'],
      [1, 2],
      [3, 4],
    ]);
    expect(XLSX.utils.book_new).toHaveBeenCalled();
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalled();
    // Check sheetName argument:
    const appendArgs = (XLSX.utils.book_append_sheet as Mock).mock.calls[0];
    expect(appendArgs[2]).toBe('MySheet');

    expect(XLSX.write).toHaveBeenCalledWith(
      expect.any(Object),
      { bookType: 'xlsx', type: 'array' }
    );

    const [blob, filename] = (saveAs as any).mock.calls[0];
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    expect(filename).toBe('excel.xlsx');
  });

  it('exports XLSX fallback when no headersMap', () => {
    exportData(data, 'nohdr', 'xlsx', 'DefaultSheet');

    expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith(data);
    expect(XLSX.utils.book_new).toHaveBeenCalled();
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalled();
    const appendArgs = (XLSX.utils.book_append_sheet as Mock).mock.calls[0];
    expect(appendArgs[2]).toBe('DefaultSheet');

    expect(XLSX.write).toHaveBeenCalled();

    const [, filename] = (saveAs as any).mock.calls[0];
    expect(filename).toBe('nohdr.xlsx');
  });

  it('exports XLSX using default type and sheetName when only filename provided', () => {
    // here we omit type and sheetName to use defaults: type='xlsx', sheetName='Sheet1'
    exportData(data, 'defaults');

    // fallback to json_to_sheet
    expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith(data);
    // workbook created & sheet appended
    expect(XLSX.utils.book_new).toHaveBeenCalled();
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalled();
    const appendArgs = (XLSX.utils.book_append_sheet as Mock).mock.calls[0];
    // default sheetName = 'Sheet1'
    expect(appendArgs[2]).toBe('Sheet1');

    expect(XLSX.write).toHaveBeenCalled();

    const [, filename] = (saveAs as any).mock.calls[0];
    expect(filename).toBe('defaults.xlsx');
  });
});
