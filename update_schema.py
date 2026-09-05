import re

with open('prisma/schema.prisma', 'r') as f:
    schema = f.read()

models = re.findall(r'model\s+(\w+)\s+\{(.*?)\}', schema, re.DOTALL)

exempt_models = ['Company', 'Module', 'Feature', 'CompanyFeaturePermission', 'RolePermission', 'CompanySubscription']

new_schema = schema

for model_name, body in models:
    if model_name in exempt_models:
        continue
    
    if 'companyId' not in body:
        # Add companyId Int @default(1) right after the opening brace
        old_decl = f'model {model_name} {{'
        new_decl = f'model {model_name} {{\n  companyId Int @default(1)'
        new_schema = new_schema.replace(old_decl, new_decl)

with open('prisma/schema.prisma', 'w') as f:
    f.write(new_schema)
print("Schema updated successfully.")
