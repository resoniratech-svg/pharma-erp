import os

repo_files = [
    'src/modules/exportOperations/exportOperations.repository.js',
    'src/modules/finance/finance.repository.js',
    'src/modules/gst/gst.repository.js',
    'src/modules/hsn/hsn.repository.js',
    'src/modules/location/location.repository.js',
    'src/modules/packing-type/packing-type.repository.js',
    'src/modules/pricing/pricing.repository.js',
    'src/modules/scheme/scheme.repository.js'
]

for file_path in repo_files:
    with open(file_path, 'r') as f:
        content = f.read()
        
    content = content.replace("const { PrismaClient } = require('@prisma/client');\nconst prisma = new PrismaClient();", "const prisma = require('../../config/db');")
    
    with open(file_path, 'w') as f:
        f.write(content)
print('Fixed Prisma imports.')
