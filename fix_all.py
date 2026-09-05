import re, glob, os

files = glob.glob('src/modules/**/*.repository.js', recursive=True)

for file_path in files:
    with open(file_path, 'r') as f:
        content = f.read()
        
    new_content = re.sub(r'const\s+\{\s*PrismaClient\s*\}\s*=\s*require\([\'"]@prisma/client[\'"]\);[\r\n]+const\s+prisma\s*=\s*new\s*PrismaClient\(\);', "const prisma = require('../../config/db');", content)
    
    if new_content != content:
        with open(file_path, 'w') as f:
            f.write(new_content)
        print(f"Fixed {file_path}")
