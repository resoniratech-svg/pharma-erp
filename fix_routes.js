const fs = require('fs');
const path = require('path');

const files = [
  'src/modules/hsn/hsn.routes.js',
  'src/modules/gst/gst.routes.js',
  'src/modules/packing-type/packing-type.routes.js',
  'src/modules/pricing/pricing.routes.js',
  'src/modules/scheme/scheme.routes.js'
];

files.forEach(f => {
  const p = path.join(process.cwd(), f);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    content = content.replace(/auth\.middleware/g, 'authMiddleware');
    content = content.replace(/const \{ authenticateToken \} = require\('\.\.\/\.\.\/middlewares\/authMiddleware'\);/g, 'const authMiddleware = require("../../middlewares/authMiddleware");');
    content = content.replace(/authenticateToken,/g, 'authMiddleware,');
    fs.writeFileSync(p, content);
    console.log('Fixed', f);
  } else {
    console.log('Not found', p);
  }
});
