import re

with open('src/modules/finance/finance.repository.js', 'r') as f:
    content = f.read()

content = re.sub(r"const\s+\{\s*PrismaClient\s*\}\s*=\s*require\('@prisma/client'\);[\r\n]+const\s+prisma\s*=\s*new\s*PrismaClient\(\);", "const prisma = require('../../config/db');", content)

with open('src/modules/finance/finance.repository.js', 'w') as f:
    f.write(content)
