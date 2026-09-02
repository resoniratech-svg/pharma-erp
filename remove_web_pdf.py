import os
import re

directory = r'C:\Users\DELL\Documents\pharma-erp-mobile\src'

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the block starting with if (Platform.OS === 'web') { containing 
ew jsPDF
    # and ending with } else {
    # Then we replace the whole if/else structure with just the else body.
    
    # Simple state machine to parse brackets
    lines = content.split('\n')
    new_lines = []
    
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Check if line contains if (Platform.OS === 'web') {
        if "if (Platform.OS === 'web')" in line and "{" in line:
            # check ahead to see if it has new jsPDF()
            temp_i = i + 1
            has_pdf = False
            bracket_count = 1
            else_start_idx = -1
            
            while temp_i < len(lines):
                bracket_count += lines[temp_i].count('{')
                bracket_count -= lines[temp_i].count('}')
                if 'new jsPDF' in lines[temp_i]:
                    has_pdf = True
                    
                if bracket_count == 0 and temp_i + 1 < len(lines) and '} else {' in lines[temp_i]:
                    else_start_idx = temp_i
                    break
                elif bracket_count == 0:
                    break
                temp_i += 1
                
            if has_pdf and else_start_idx != -1:
                # We found a web PDF block with an else block!
                # Skip the if block
                i = else_start_idx + 1
                
                # Now we need to find the end of the else block to remove its closing bracket
                # But actually, the else block body doesn't need its braces. Wait, the else block's closing brace is at the end.
                # It's easier to just find the closing brace of the else block.
                bracket_count = 1
                else_end_idx = -1
                temp_j = i
                while temp_j < len(lines):
                    bracket_count += lines[temp_j].count('{')
                    bracket_count -= lines[temp_j].count('}')
                    if bracket_count == 0:
                        else_end_idx = temp_j
                        break
                    temp_j += 1
                
                # add the inside of the else block
                if else_end_idx != -1:
                    for k in range(i, else_end_idx):
                        new_lines.append(lines[k])
                    i = else_end_idx + 1
                    continue
        
        new_lines.append(line)
        i += 1
        
    if '\n'.join(new_lines) != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write('\n'.join(new_lines))
        print(f"Updated {filepath}")

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.tsx'):
            process_file(os.path.join(root, file))
