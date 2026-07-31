import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportColumn<T> {
  key: string;
  label: string;
  // Note: We ignore React render functions during export to avoid dumping JSX tags into CSV/Excel.
  // We strictly rely on the key for data mapping.
}

/**
 * Extracts raw string values from objects based on dot-notation column keys.
 */
function extractData<T>(data: T[], columns: ExportColumn<T>[]) {
  return data.map(row => {
    const rowData: Record<string, string> = {};
    columns.forEach(col => {
      // Handle "actions" or purely UI columns
      if (col.key === 'actions' || !col.key) return;

      const keys = col.key.split('.');
      let val: any = row;
      for (const k of keys) {
        if (val == null) break;
        val = val[k];
      }
      rowData[col.label] = val !== undefined && val !== null ? String(val) : '';
    });
    return rowData;
  });
}

export function exportToCSV<T>(data: T[], columns: ExportColumn<T>[], filename: string) {
  if (!data || data.length === 0) {
    alert("No data available to export.");
    return;
  }
  const extracted = extractData(data, columns);
  const worksheet = XLSX.utils.json_to_sheet(extracted);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
  
  const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToExcel<T>(data: T[], columns: ExportColumn<T>[], filename: string) {
  if (!data || data.length === 0) {
    alert("No data available to export.");
    return;
  }
  const extracted = extractData(data, columns);
  const worksheet = XLSX.utils.json_to_sheet(extracted);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Export');
  XLSX.writeFile(workbook, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

export function exportToPDF<T>(data: T[], columns: ExportColumn<T>[], filename: string, title: string = 'Export Report') {
  if (!data || data.length === 0) {
    alert("No data available to export.");
    return;
  }
  const doc = new jsPDF('landscape');
  doc.setFontSize(14);
  doc.text(title, 14, 15);
  doc.setFontSize(10);
  
  // Filter out UI-only columns like "actions"
  const exportCols = columns.filter(c => c.key && c.key !== 'actions');
  const headers = exportCols.map(c => c.label);
  
  const body = data.map(row => {
    return exportCols.map(col => {
      const keys = col.key.split('.');
      let val: any = row;
      for (const k of keys) {
        if (val == null) break;
        val = val[k];
      }
      return val !== undefined && val !== null ? String(val) : '';
    });
  });

  autoTable(doc, {
    head: [headers],
    body: body,
    startY: 25,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [22, 60, 120] } // #163c78
  });
  
  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}
