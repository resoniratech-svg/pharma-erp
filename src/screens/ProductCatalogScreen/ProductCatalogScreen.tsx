import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { getProducts } from '../../services/productService';

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

// All product data loaded exclusively from the Product Master API.
// No hardcoded product list allowed in production.

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
  const [activeTab, setActiveTab] = useState<string>('All');
  const [expandedCards, setExpandedCards] = useState<{ [key: number]: boolean }>({});
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sampleQty, setSampleQty] = useState<{ [key: number]: number }>();

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await getProducts();

      const mappedProducts = data.map((p: any) => ({
        id: p.id,
        name: p.name || p.productName || '',
        genericName: p.genericName || p.code || '',
        category: p.category?.name || p.categoryName || '',
        packaging: p.packaging || p.hsnCode || '',
        price: p.mrp || p.ptr || 0,
        indications: p.indications || '',
        dosage: p.dosage || '',
        stock: p.stock || p.minStock || 0,
        composition: p.composition || [],
        formType: p.formType || p.form || 'tablet',
      }));

      setProducts(mappedProducts);
    } catch (error) {
      console.log('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

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

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      (product.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (product.genericName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (product.indications?.toLowerCase() || '').includes(searchQuery.toLowerCase());

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
        {loading ? (
          <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 40 }} />
        ) : filteredProducts.length > 0 ? (
          filteredProducts.map((product) => {
            const isExpanded = !!expandedCards[product.id];
            const qty = sampleQty[product.id] || 1;
            const avatar = getProductAvatar(product.formType);
            const isOutOfStock = product.minStock === 0;

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
                    <Text style={styles.genericText}>
  {product.code || ''}
</Text>
                    <View style={styles.metaRow}>
                      <Text>{product.category?.name || product.category}</Text>
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
                    <Text style={styles.priceText}>
  PRICE = {JSON.stringify(product.price)}
</Text>
                    <Text style={styles.packagingText}>{product.packaging}</Text>
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.expandedContent}>
                    <View style={styles.divider} />
                    
                    {/* Composition list */}
                    <Text style={styles.sectionLabel}>🧪 Product Composition:</Text>
                    <View style={styles.compositionGrid}>
                      {product.composition && Array.isArray(product.composition) ? (
                        product.composition.map((comp: string, index: number) => (
                          <Text key={index} style={styles.compositionItem}>• {comp}</Text>
                        ))
                      ) : (
                        <Text style={styles.compositionItem}>• Composition info unavailable</Text>
                      )}
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