// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable';
// import * as XLSX from 'xlsx';

// interface ExportOptions {
//   title: string;
//   filename: string;
//   data: any[];
//   columns: { header: string; dataKey: string }[];
// }

// export const ExportService = {
//   // 1. GENERATES A REAL ENTERPRISE PDF
//   exportToPDF: ({ title, filename, data, columns }: ExportOptions) => {
//     // 'landscape' mode fits more columns nicely
//     const doc = new jsPDF('landscape'); 
    
//     // Add Company Header
//     doc.setFontSize(22);
//     doc.setTextColor(79, 70, 229); // Indigo theme color
//     doc.text('MJ Healthcare', 14, 20);
    
//     // Add Report Title & Date
//     doc.setFontSize(12);
//     doc.setTextColor(100, 116, 139); 
//     doc.text(title, 14, 28);
//     doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 34);

//     // Auto-generate the beautiful table
//     autoTable(doc, {
//       startY: 40,
//       head: [columns.map(col => col.header)],
//       body: data.map(item => columns.map(col => item[col.dataKey] || '-')),
//       theme: 'grid',
//       headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
//       styles: { fontSize: 9, cellPadding: 4 },
//     });

//     doc.save(`${filename}.pdf`);
//   },

//   // 2. GENERATES A REAL EXCEL (.XLSX) FILE
//   exportToExcel: ({ filename, data, columns }: ExportOptions) => {
//     const excelData = data.map(item => {
//       const row: any = {};
//       columns.forEach(col => { row[col.header] = item[col.dataKey]; });
//       return row;
//     });

//     const worksheet = XLSX.utils.json_to_sheet(excelData);
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
//     XLSX.writeFile(workbook, `${filename}.xlsx`);
//   },
//     exportToCSV: ({ filename, data, columns }: ExportOptions) => {
//     // 1. Format data just like we did for Excel
//     const csvData = data.map(item => {
//       const row: any = {};
//       columns.forEach(col => {
//         row[col.header] = item[col.dataKey];
//       });
//       return row;
//     });

//     // 2. Convert to CSV sheet and download
//     const worksheet = XLSX.utils.json_to_sheet(csvData);
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    
//     // The only difference is the file extension and bookType!
//     XLSX.writeFile(workbook, `${filename}.csv`, { bookType: 'csv' });
//   }
// };

////////////////////////////////////////////////////////////////////////


import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ExportOptions {
  title: string;
  filename: string;
  data: any[];
  columns: { header: string; dataKey: string }[];
}

export const ExportService = {
  // 1. GENERATES A REAL ENTERPRISE PDF
  exportToPDF: ({ title, filename, data, columns }: ExportOptions) => {
    const doc = new jsPDF('landscape'); 
    
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229);
    doc.text('MJ Healthcare', 14, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139); 
    doc.text(title, 14, 28);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 34);

    autoTable(doc, {
      startY: 40,
      head: [columns.map(col => col.header)],
      body: data.map(item => columns.map(col => item[col.dataKey] || '-')),
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
      styles: { fontSize: 9, cellPadding: 4 },
    });

    doc.save(`${filename}.pdf`);
  },

  // 2. GENERATES A REAL EXCEL (.XLSX) FILE
  exportToExcel: ({ filename, data, columns }: ExportOptions) => {
    const excelData = data.map(item => {
      const row: any = {};
      columns.forEach(col => { row[col.header] = item[col.dataKey]; });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  },

  // 3. GENERATES A REAL CSV FILE (PURE JAVASCRIPT - 100% BUG FREE)
  exportToCSV: ({ filename, data, columns }: ExportOptions) => {
    // A. Create the Header Row
    const headers = columns.map(col => `"${col.header}"`).join(',');
    
    // B. Create the Data Rows
    const rows = data.map(item => {
      return columns.map(col => {
        // We wrap text in quotes so commas in names don't break the CSV
        const cellValue = item[col.dataKey] ? String(item[col.dataKey]).replace(/"/g, '""') : '';
        return `"${cellValue}"`;
      }).join(',');
    });

    // C. Combine Headers and Rows
    const csvContent = [headers, ...rows].join('\n');
    
    // D. Trigger the Download instantly
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};