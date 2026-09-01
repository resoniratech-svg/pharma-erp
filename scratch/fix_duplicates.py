import os
import glob

services_dir = r'C:\Users\DELL\Documents\pharma-erp-mobile\src\services'

for fpath in glob.glob(os.path.join(services_dir, '*.ts')):
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    double_str = "if (!mrId || mrId === 'null' || mrId === 'undefined') return [];\n  if (!mrId || mrId === 'null' || mrId === 'undefined') return [];"
    single_str = "if (!mrId || mrId === 'null' || mrId === 'undefined') return [];"
    
    content = content.replace(double_str, single_str)
    
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(content)
