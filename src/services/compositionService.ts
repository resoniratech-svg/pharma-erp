const STORAGE_KEY = "compositions";

const defaultCompositions = [
  { id: '1', genericName: 'Amoxicillin Trihydrate', strength: '500mg', dosageForm: 'Capsule', therapeuticClass: 'Antibiotic', schedule: 'Schedule H', description: 'Broad-spectrum antibiotic used to treat bacterial infections.', associatedProducts: 12, status: 'Active', createdBy: 'Admin User', createdDate: '2026-06-01' },
  { id: '2', genericName: 'Paracetamol', strength: '650mg', dosageForm: 'Tablet', therapeuticClass: 'Analgesic', schedule: 'OTC', description: 'Used for fever reduction and pain relief.', associatedProducts: 45, status: 'Active', createdBy: 'System', createdDate: '2026-05-15' },
  { id: '3', genericName: 'Ibuprofen', strength: '400mg', dosageForm: 'Tablet', therapeuticClass: 'NSAID', schedule: 'OTC', description: 'Nonsteroidal anti-inflammatory drug used for reducing fever and treating pain.', associatedProducts: 28, status: 'Active', createdBy: 'Admin User', createdDate: '2026-04-20' },
  { id: '4', genericName: 'Cetirizine Hydrochloride', strength: '10mg', dosageForm: 'Tablet', therapeuticClass: 'Antihistamine', schedule: 'Schedule H', description: 'Used to relieve allergy symptoms such as watery eyes, runny nose, itching eyes/nose, and sneezing.', associatedProducts: 8, status: 'Inactive', createdBy: 'Admin User', createdDate: '2025-12-05' },
  { id: '5', genericName: 'Vitamin C (Ascorbic Acid)', strength: '1000mg', dosageForm: 'Tablet', therapeuticClass: 'Vitamin Supplement', schedule: 'OTC', description: 'Vitamin supplement for immune system support.', associatedProducts: 15, status: 'Active', createdBy: 'System', createdDate: '2026-06-10' },
];

export const compositionService = {
  getAll() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    // Set default compositions if empty
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultCompositions));
    return defaultCompositions;
  },

  saveAll(compositions: any[]) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(compositions)
    );
  },
};