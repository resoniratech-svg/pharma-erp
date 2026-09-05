import os, re

repo_files = [
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
        
    content = re.sub(r"const\s+\{\s*PrismaClient\s*\}\s*=\s*require\('@prisma/client'\);[\r\n]+const\s+prisma\s*=\s*new\s*PrismaClient\(\);", "const prisma = require('../../config/db');", content)
    
    with open(file_path, 'w') as f:
        f.write(content)
