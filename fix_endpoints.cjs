const fs = require('fs');
const path = require('path');

const files = [
  'src/services/hsnService.ts',
  'src/services/gstService.ts',
  'src/services/packingTypeService.ts',
  'src/services/pricingService.ts',
  'src/services/schemeService.ts'
];

files.forEach(f => {
  const p = path.join(process.cwd(), f);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    content = content.replace(/'\/api\//g, "'/");
    content = content.replace(/`\/api\//g, "`/");
    content = content.replace(/"\/api\//g, "\"/");
    fs.writeFileSync(p, content);
    console.log('Fixed', f);
  }
});
