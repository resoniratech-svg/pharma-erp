with open('src/middlewares/authMiddleware.js', 'r') as f:
    content = f.read()

import_statement = "const { tenantContext } = require('../utils/tenantContext');\n"
if "tenantContext" not in content:
    content = import_statement + content

content = content.replace('next();', '''
    const companyId = decoded.companyId || 1;
    const role = decoded.role;
    
    // Wrap next() in tenantContext
    tenantContext.run({ companyId, role }, () => {
      next();
    });
''')

with open('src/middlewares/authMiddleware.js', 'w') as f:
    f.write(content)
