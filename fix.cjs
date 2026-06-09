const fs = require('fs');
const path = require('path');
const dir = './src/components/ui';

function fixFile(file, importsString) {
  const filePath = path.join(dir, file);
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf-8');
  // Remove all existing react imports
  content = content.replace(/^import.*from 'react';?\r?\n/gm, '');
  content = content.replace(/^import.*from \"react\";?\r?\n/gm, '');
  // add the correct one at the top
  content = importsString + '\n' + content;
  fs.writeFileSync(filePath, content);
}

fixFile('Button.tsx', 'import React, { forwardRef } from \'react\';\nimport type { ButtonHTMLAttributes } from \'react\';');
fixFile('Input.tsx', 'import React, { forwardRef } from \'react\';\nimport type { InputHTMLAttributes } from \'react\';');
fixFile('Textarea.tsx', 'import React, { forwardRef } from \'react\';\nimport type { TextareaHTMLAttributes } from \'react\';');
fixFile('Select.tsx', 'import React, { forwardRef } from \'react\';\nimport type { SelectHTMLAttributes } from \'react\';');
fixFile('Checkbox.tsx', 'import React, { forwardRef } from \'react\';\nimport type { InputHTMLAttributes } from \'react\';');
fixFile('Radio.tsx', 'import React, { forwardRef } from \'react\';\nimport type { InputHTMLAttributes } from \'react\';');
fixFile('DatePicker.tsx', 'import React, { forwardRef } from \'react\';\nimport type { InputHTMLAttributes } from \'react\';');
fixFile('FileUpload.tsx', 'import React, { forwardRef, useState } from \'react\';\nimport type { InputHTMLAttributes } from \'react\';');
fixFile('Card.tsx', 'import React, { forwardRef } from \'react\';\nimport type { HTMLAttributes } from \'react\';');
fixFile('DataTable.tsx', 'import React, { forwardRef } from \'react\';\nimport type { HTMLAttributes } from \'react\';');
fixFile('Pagination.tsx', 'import React from \'react\';');
