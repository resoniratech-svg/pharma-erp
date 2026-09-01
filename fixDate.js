const fs = require('fs');
let code = fs.readFileSync('C:/Users/DELL/Documents/pharma-erp-mobile/src/RSM/ASMManagementScreen.tsx', 'utf8');

code = code.replace(/const formatted = \`\$\{String\(day\)\.padStart\(2, '0'\)\}-\$\{String\(calMonth \+ 1\)\.padStart\(2, '0'\)\}-\$\{calYear\}\`;/, "const formatted = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;");

fs.writeFileSync('C:/Users/DELL/Documents/pharma-erp-mobile/src/RSM/ASMManagementScreen.tsx', code);
