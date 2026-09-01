const fs = require('fs');
const files = [
  'C:/Users/DELL/Documents/pharma-erp-mobile/src/RSM/RSMDashboardScreen.tsx',
  'C:/Users/DELL/Documents/pharma-erp-mobile/src/ASM/ASMDashboardScreen.tsx',
  'C:/Users/DELL/Documents/pharma-erp-mobile/src/NSM/DashboardScreen.tsx'
];
for (const file of files) {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf8');
    code = code.replace(/navigation\.navigate\('LeadAssignment'\)/g, "navigation.navigate('Leads')");
    fs.writeFileSync(file, code);
  }
}
