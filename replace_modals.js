const fs = require('fs');
const path = require('path');

const DIRS = [
  path.join(__dirname, 'src', 'NSM'),
  path.join(__dirname, 'src', 'RSM')
];

const TARGET_REGEX_1 = /<Modal visible=\{dropdownTarget !== null\} transparent animationType="fade">[\s\S]*?<\/Modal>/;
const REPLACEMENT_1 = `<Modal visible={dropdownTarget !== null} transparent animationType="fade">
        <TouchableOpacity style={[styles.modalOverlay, { backgroundColor: 'transparent' }]} activeOpacity={1} onPress={() => setDropdownTarget(null)}>
          <View style={[styles.dropdownModalCard, { position: 'absolute', top: 230, left: 16, maxWidth: 200, paddingVertical: 8, elevation: 5, shadowOpacity: 0.1, shadowRadius: 10 }]}>
            <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
              {getDropdownOptions().map((opt) => (
                <TouchableOpacity 
                  key={opt} 
                  style={{ paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#FFF' }} 
                  onPress={() => handleDropdownSelect(opt)}
                >
                  <Text style={{ fontSize: 13, color: '#334155' }}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>`;

let updatedFiles = [];

DIRS.forEach(dir => {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      if (file.endsWith('.tsx')) {
        const filePath = path.join(dir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        let didUpdate = false;
        if (TARGET_REGEX_1.test(content)) {
          content = content.replace(TARGET_REGEX_1, REPLACEMENT_1);
          didUpdate = true;
        }
        if (didUpdate) {
          fs.writeFileSync(filePath, content);
          updatedFiles.push(file);
        }
      }
    });
  }
});

console.log("Updated files: ", updatedFiles.join(", "));
