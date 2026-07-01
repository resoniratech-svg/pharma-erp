const fs = require('fs');
const filePath = 'c:/Users/M.Thirumala/Desktop/Projects/Pharma ERP/apps/web/src/documents/templates/TransportChallanTemplate.tsx';
const base64Path = 'c:/Users/M.Thirumala/Desktop/Projects/Pharma ERP/apps/web/src/documents/templates/logoBase64.txt';

let content = fs.readFileSync(filePath, 'utf8');
let base64 = fs.readFileSync(base64Path, 'utf8').trim();

const startIdx = content.indexOf('const getBase64ImageSync');
const endString = "doc.addImage(base64Logo, 'PNG', 15, 15, 35, 16);\n    }";
const endIdx = content.indexOf(endString) + endString.length;

if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const replacement = `const base64Logo = "data:image/png;base64,${base64}";\n    doc.addImage(base64Logo, 'PNG', 15, 15, 35, 16);`;
    content = content.substring(0, startIdx) + replacement + content.substring(endIdx);
    fs.writeFileSync(filePath, content);
    console.log('Success');
} else {
    console.log('Failed to find bounds');
}
