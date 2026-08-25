const fs = require('fs');
const path = require('path');

function walk(dir) {
  fs.readdirSync(dir).forEach(f => {
    let p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      walk(p);
    } else if (p.endsWith('.tsx')) {
      let c = fs.readFileSync(p, 'utf8');
      if (c.includes('jspdf')) {
        c = c.replace(/import.*?from\s+['"]jspdf.*?['"];?/g, '// REMOVED JSPDF');
        fs.writeFileSync(p, c);
        console.log('Fixed', p);
      }
    }
  });
}

walk('./src');
