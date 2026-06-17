import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

interface Product {
  id: number;
  name: string;
  genericName: string;
  category: string;
  packaging: string;
  price: number;
  indications: string;
  dosage: string;
  stock: number;            // Stock Count
  composition: string[];    // Composition listing
  formType: 'tablet' | 'capsule' | 'liquid'; // Avatar type
}

const MASTER_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Augmentin 625 Duo',
    genericName: 'Amoxicillin + Clavulanic Acid',
    category: 'Antibiotics',
    packaging: '10 Tablets / Strip',
    price: 201.50,
    indications: 'Severe bacterial infections of the respiratory tract, skin, joints, and urinary tract.',
    dosage: '1 tablet twice daily after meals.',
    stock: 250,
    composition: ['Amoxicillin IP 500mg', 'Potassium Clavulanate IP 125mg'],
    formType: 'tablet',
  },
  {
    id: 2,
    name: 'Calpol 650',
    genericName: 'Paracetamol',
    category: 'Analgesics',
    packaging: '15 Tablets / Strip',
    price: 33.40,
    indications: 'Symptomatic relief of mild-to-moderate pain and fever.',
    dosage: '1 tablet every 4-6 hours as needed (Max 4 tablets daily).',
    stock: 80,
    composition: ['Paracetamol IP 650mg'],
    formType: 'tablet',
  },
  {
    id: 3,
    name: 'Lipitor 10mg',
    genericName: 'Atorvastatin',
    category: 'Cardiology',
    packaging: '15 Tablets / Strip',
    price: 120.00,
    indications: 'Management of primary hypercholesterolemia and cardiovascular risk reduction.',
    dosage: '1 tablet once daily, preferably at bedtime.',
    stock: 150,
    composition: ['Atorvastatin Calcium Trihydrate IP 10mg'],
    formType: 'tablet',
  },
  {
    id: 4,
    name: 'Pan-D Capsule',
    genericName: 'Pantoprazole + Domperidone',
    category: 'Gastroenterology',
    packaging: '15 Capsules / Strip',
    price: 142.00,
    indications: 'Gastroesophageal Reflux Disease (GERD), hyperacidity, bloating, and stomach ulcers.',
    dosage: '1 capsule daily in the morning, 30 minutes before breakfast.',
    stock: 0, // Out of Stock demo
    composition: ['Pantoprazole Sodium Sesquihydrate IP 40mg', 'Domperidone IP 30mg'],
    formType: 'capsule',
  },
  {
    id: 5,
    name: 'Amlokind-5',
    genericName: 'Amlodipine',
    category: 'Cardiology',
    packaging: '15 Tablets / Strip',
    price: 18.50,
    indications: 'Management of essential hypertension and chronic stable angina.',
    dosage: '1 tablet once daily in the morning.',
    stock: 310,
    composition: ['Amlodipine Besylate IP 5mg'],
    formType: 'tablet',
  },
  {
    id: 6,
    name: 'Azithral 500',
    genericName: 'Azithromycin',
    category: 'Antibiotics',
    packaging: '5 Tablets / Strip',
    price: 119.00,
    indications: 'Acute bacterial sinusitis, tonsillitis, and community-acquired pneumonia.',
    dosage: '1 tablet once daily for 3 consecutive days.',
    stock: 45,
    composition: ['Azithromycin Dihydrate IP 500mg'],
    formType: 'tablet',
  },
  {
    id: 7,
    name: 'Neurobion Forte',
    genericName: 'Vitamin B-Complex',
    category: 'Vitamins',
    packaging: '30 Tablets / Strip',
    price: 45.10,
    indications: 'Treatment of Vitamin B deficiencies, diabetic neuropathy, and boosting immunity.',
    dosage: '1 tablet once daily after a meal.',
    stock: 500,
    composition: [
      'Thiamine Mononitrate (Vit B1) 10mg',
      'Riboflavin (Vit B2) 10mg',
      'Pyridoxine HCl (Vit B6) 3mg',
      'Cyanocobalamin (Vit B12) 15mcg',
      'Nicotinamide (Vit B3) 45mg',
      'Calcium Pantothenate 50mg'
    ],
    formType: 'tablet',
  },
  {
    id: 8,
    name: 'Gaviscon Liquid',
    genericName: 'Sodium Alginate + Sodium Bicarbonate',
    category: 'Gastroenterology',
    packaging: '150ml Bottle',
    price: 165.00,
    indications: 'Fast relief from heartburn, acid indigestion, and reflux esophagitis.',
    dosage: '10-20ml liquid after meals and at bedtime.',
    stock: 95,
    composition: ['Sodium Alginate 250mg', 'Sodium Bicarbonate 133.5mg', 'Calcium Carbonate 80mg'],
    formType: 'liquid',
  }
];

const safeJsonParse = (data: string | null, fallback: any) => {
  if (!data) return fallback;
  try {
    return JSON.parse(data);
  } catch (err) {
    console.log('safeJsonParse error in ProductCatalogScreen:', err);
    return fallback;
  }
};

const ProductCatalogScreen = () => {
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Antibiotics' | 'Analgesics' | 'Cardiology' | 'Gastroenterology' | 'Vitamins'>('All');
  const [expandedCards, setExpandedCards] = useState<{ [key: number]: boolean }>({});
  
  // Sample Quantities state
  const [sampleQty, setSampleQty] = useState<{ [key: number]: number }>({});

  const customAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const toggleCard = (id: number) => {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const adjustQty = (id: number, delta: number) => {
    setSampleQty((prev) => {
      const current = prev[id] || 1;
      const newVal = Math.max(1, Math.min(10, current + delta));
      return { ...prev, [id]: newVal };
    });
  };

  const handleRequestSample = async (product: Product) => {
    const qty = sampleQty[product.id] || 1;
    try {
      const storedRequests = await AsyncStorage.getItem('@sample_requests');
      const requests = safeJsonParse(storedRequests, []);
      
      const newRequest = {
        id: Date.now(),
        productId: product.id,
        productName: product.name,
        qty: qty,
        requestedAt: new Date().toLocaleString(),
        status: 'Requested',
      };

      const updatedRequests = [newRequest, ...requests];
      await AsyncStorage.setItem('@sample_requests', JSON.stringify(updatedRequests));
      customAlert('Sample Requested!', `Requested ${qty} sample(s) of ${product.name}. Stockist will be notified.`);
    } catch (e) {
      customAlert('Error', 'Failed to request sample. Try again.');
    }
  };

  const handleViewBrochure = (product: Product) => {
    customAlert(
      'Opening Brochure',
      `Loading product e-brochure & promotional PDF for ${product.name} (Composition: ${product.genericName}).`
    );
  };

  const filteredProducts = MASTER_PRODUCTS.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.indications.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab = activeTab === 'All' || product.category === activeTab;

    return matchesSearch && matchesTab;
  });

  const getProductAvatar = (formType: string) => {
    switch (formType) {
      case 'capsule':
        return { emoji: '💊', bg: '#FFF3E0' };
      case 'liquid':
        return { emoji: '🧪', bg: '#E0F2F1' };
      default:
        return { emoji: '⚪', bg: '#E8EAF6' };
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>⬅️ Back</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>💊 Medical Product Catalog</Text>
        <Text style={styles.headerSubtitle}>Explore master product range & details</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search brand name, generic formula, drug class..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Category Tabs */}
      <View style={{ height: 45, marginTop: 15 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
        >
          {(['All', 'Antibiotics', 'Analgesics', 'Cardiology', 'Gastroenterology', 'Vitamins'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Products List */}
      <ScrollView contentContainerStyle={styles.listContainer}>
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => {
            const isExpanded = !!expandedCards[product.id];
            const qty = sampleQty[product.id] || 1;
            const avatar = getProductAvatar(product.formType);
            const isOutOfStock = product.stock === 0;

            return (
              <View key={product.id} style={styles.card}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => toggleCard(product.id)}
                  style={styles.cardHeader}
                >
                  {/* Medicine Visual Avatar */}
                  <View style={[styles.avatarContainer, { backgroundColor: avatar.bg }]}>
                    <Text style={styles.avatarEmoji}>{avatar.emoji}</Text>
                  </View>

                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.genericText} numberOfLines={1}>{product.genericName}</Text>
                    <View style={styles.metaRow}>
                      <Text style={styles.categoryBadge}>{product.category}</Text>
                      {/* Stock Badge */}
                      <Text style={[
                        styles.stockBadge,
                        isOutOfStock ? styles.outOfStock : styles.inStock
                      ]}>
                        {isOutOfStock ? '🚫 Out of Stock' : `📦 Stock: ${product.stock} Units`}
                      </Text>
                    </View>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.priceText}>₹{product.price.toFixed(2)}</Text>
                    <Text style={styles.packagingText}>{product.packaging}</Text>
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.expandedContent}>
                    <View style={styles.divider} />
                    
                    {/* Composition list */}
                    <Text style={styles.sectionLabel}>🧪 Product Composition:</Text>
                    <View style={styles.compositionGrid}>
                      {product.composition.map((comp, index) => (
                        <Text key={index} style={styles.compositionItem}>• {comp}</Text>
                      ))}
                    </View>

                    <Text style={[styles.sectionLabel, { marginTop: 8 }]}>🩺 Indication & Usage:</Text>
                    <Text style={styles.bodyText}>{product.indications}</Text>
                    
                    <Text style={[styles.sectionLabel, { marginTop: 8 }]}>⏰ Recommended Dosage:</Text>
                    <Text style={styles.bodyText}>{product.dosage}</Text>

                    {/* View Brochure Action Button */}
                    <TouchableOpacity
                      style={styles.brochureBtn}
                      onPress={() => handleViewBrochure(product)}
                    >
                      <Text style={styles.brochureBtnText}>📄 View E-Brochure & PDF</Text>
                    </TouchableOpacity>

                    {/* Qty Selector when requesting sample */}
                    <View style={styles.sampleQtyRow}>
                      <Text style={styles.qtyLabel}>Sample Qty:</Text>
                      <View style={styles.qtySelector}>
                        <TouchableOpacity style={styles.qtyBtn} onPress={() => adjustQty(product.id, -1)}>
                          <Text style={styles.qtyBtnText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{qty}</Text>
                        <TouchableOpacity style={styles.qtyBtn} onPress={() => adjustQty(product.id, 1)}>
                          <Text style={styles.qtyBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}

                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.sampleBtn]}
                    onPress={() => handleRequestSample(product)}
                  >
                    <Text style={styles.sampleBtnText}>🎁 Request Sample</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.orderBtn]}
                    onPress={() => navigation.navigate('BookOrder')}
                  >
                    <Text style={styles.orderBtnText}>📦 Book Order</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No products found matching your filter criteria.</Text>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

export default ProductCatalogScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#4F46E5',
    paddingTop: 60,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 15,
    top: 50,
    zIndex: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  backButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#E0E7FF',
    textAlign: 'center',
    marginTop: 6,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: -18,
    zIndex: 10,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    fontSize: 14,
    color: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  tabsScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    alignSelf: 'flex-start',
    height: 34,
  },
  activeTabButton: {
    backgroundColor: '#4F46E5',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#4F46E5',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarEmoji: {
    fontSize: 22,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  genericText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  packagingText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  categoryBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4F46E5',
    backgroundColor: '#EEF2F6',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  stockBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  inStock: {
    color: '#0D9488',
    backgroundColor: '#CCFBF1',
  },
  outOfStock: {
    color: '#E11D48',
    backgroundColor: '#FFE4E6',
  },
  expandedContent: {
    marginTop: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
  },
  compositionGrid: {
    marginTop: 4,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    gap: 3,
  },
  compositionItem: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  bodyText: {
    fontSize: 13,
    color: '#334155',
    marginTop: 4,
    lineHeight: 18,
  },
  brochureBtn: {
    marginTop: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  brochureBtnText: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: 'bold',
  },
  sampleQtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 12,
    gap: 10,
  },
  qtyLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#475569',
  },
  qtySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    overflow: 'hidden',
  },
  qtyBtn: {
    width: 28,
    height: 28,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#334155',
  },
  qtyText: {
    width: 32,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sampleBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  sampleBtnText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: 'bold',
  },
  orderBtn: {
    backgroundColor: '#4F46E5',
  },
  orderBtnText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
});