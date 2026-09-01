const fs = require('fs');
let code = fs.readFileSync('C:/Users/DELL/Documents/pharma-erp-mobile/src/RSM/ASMManagementScreen.tsx', 'utf8');

code = code.replace(/await createEmployee\(\{[\s\S]*?reportsToId: currentUser\?\.employeeId \|\| null,\s*\}\);/, `await createEmployee({
          name: formData.name,
          email: formData.email,
          mobile: formData.mobile,
          password: formData.password,
          designation: 'Area Sales Manager',
          state: formData.state,
          hq: formData.hq,
          gender: formData.gender,
          dob: formData.dob,
          territory: formData.territory,
          status: formData.status,
          joiningDate: formData.joiningDate,
          remarks: formData.remarks,
          reportsToId: currentUser?.employeeId || null,
        });`);

code = code.replace(/const mappedData = teamData\.map\(\(emp: any\) => \(\{[\s\S]*?employmentStatus: emp\.status \|\| 'Active'\s*\}\)\);/, `const mappedData = teamData.map((emp: any) => ({
          id: emp.id?.toString() || Math.random().toString(),
          code: emp.employeeCode || \`EMP-\${emp.id}\`,
          name: emp.user?.name || emp.name || 'Unknown',
          state: (emp.states && emp.states.length > 0) ? emp.states[0] : (emp.state || 'N/A'),
          hq: emp.headquarters || 'N/A',
          status: emp.status || 'Active',
          mobile: emp.user?.mobile || emp.mobile || 'N/A',
          email: emp.user?.email || 'N/A',
          gender: emp.gender || 'N/A',
          dob: emp.dob ? new Date(emp.dob).toISOString().split('T')[0] : 'N/A',
          designation: emp.designation || 'Area Sales Manager',
          joiningDate: emp.joiningDate ? new Date(emp.joiningDate).toISOString().split('T')[0] : 'N/A',
          employmentStatus: emp.status || 'Active',
          territory: emp.territory || '',
          remarks: emp.remarks || ''
        }));`);

fs.writeFileSync('C:/Users/DELL/Documents/pharma-erp-mobile/src/RSM/ASMManagementScreen.tsx', code);
