const fs = require('fs');
const path = require('path');
const servicesDir = 'C:/Users/DELL/Documents/pharma-erp-mobile/src/services';
const files = fs.readdirSync(servicesDir).filter(f => f.endsWith('.ts'));

files.forEach(file => {
  const filePath = path.join(servicesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  const regex = /const response = await api\.get\(`\/[^`]*mr\/\$\{mrId\}[^`]*`[^;]*;/g;
  content = content.replace(regex, (match) => {
    changed = true;
    return `if (!mrId || mrId === 'null' || mrId === 'undefined') return [];\n  ` + match;
  });

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed', file);
  }
});
