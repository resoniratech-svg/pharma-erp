const fs = require('fs');
let code = fs.readFileSync('C:/Users/DELL/Documents/pharma-erp-mobile/src/RSM/ASMManagementScreen.tsx', 'utf8');

code = code.replace(/const \[loading, setLoading\] = useState\(true\);/, `const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);`);

code = code.replace(/<TextInput style=\{\[styles\.input, formErrors\.password && styles\.inputError, Platform\.OS === 'web' && \{ outlineStyle: 'none' \} as any\]\} secureTextEntry value=\{formData\.password\} onChangeText=\{\(t\) => handleTextChange\('password', t\)\} \/>/, `<View style={styles.passwordContainer}>
                      <TextInput style={[styles.input, styles.passwordInput, formErrors.password && styles.inputError, Platform.OS === 'web' && { outlineStyle: 'none' } as any]} secureTextEntry={!showPassword} value={formData.password} onChangeText={(t) => handleTextChange('password', t)} />
                      <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                        <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#94A3B8" />
                      </TouchableOpacity>
                    </View>`);

code = code.replace(/<TextInput style=\{\[styles\.input, formErrors\.confirmPassword && styles\.inputError, Platform\.OS === 'web' && \{ outlineStyle: 'none' \} as any\]\} secureTextEntry value=\{formData\.confirmPassword\} onChangeText=\{\(t\) => handleTextChange\('confirmPassword', t\)\} \/>/, `<View style={styles.passwordContainer}>
                      <TextInput style={[styles.input, styles.passwordInput, formErrors.confirmPassword && styles.inputError, Platform.OS === 'web' && { outlineStyle: 'none' } as any]} secureTextEntry={!showConfirmPassword} value={formData.confirmPassword} onChangeText={(t) => handleTextChange('confirmPassword', t)} />
                      <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                        <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#94A3B8" />
                      </TouchableOpacity>
                    </View>`);

code = code.replace(/const handleOpenEditForm = \(\w+: any\) => \{[\s\S]*?setIsFormModalVisible\(true\);\s*\};/, `const handleOpenEditForm = (item: any) => {
    setFormMode('edit');
    setFormErrors({});
    setFormData({
      id: item.id,
      code: item.code,
      name: item.name,
      mobile: item.mobile === 'N/A' ? '' : item.mobile,
      email: item.email === 'N/A' ? '' : item.email,
      gender: item.gender === 'N/A' ? 'Male' : item.gender,
      dob: item.dob === 'N/A' ? '' : item.dob,
      designation: item.designation || 'Area Sales Manager',
      reportingRsm: item.reportingRsm || 'Amitabh Verma (Regional Sales Manager)',
      state: item.state === 'N/A' ? '' : item.state,
      hq: item.hq === 'N/A' ? '' : item.hq,
      territory: item.territory || '',
      status: item.status || 'Active',
      password: '',
      confirmPassword: '',
      joiningDate: item.joiningDate === 'N/A' ? '' : item.joiningDate,
      employmentStatus: item.employmentStatus || 'Active',
      remarks: item.remarks || ''
    });
    setIsFormModalVisible(true);
  };`);

code = code.replace(/inputError: \{\s*borderColor: '#EF4444',\s*\},/, `inputError: {
    borderColor: '#EF4444',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
  },`);

fs.writeFileSync('C:/Users/DELL/Documents/pharma-erp-mobile/src/RSM/ASMManagementScreen.tsx', code);
