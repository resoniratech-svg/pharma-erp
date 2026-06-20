import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

interface ReorderAlert {
  id: string;
  productName: string;
  currentStock: number;
  reorderLevel: number;
  suggestedQty: number;
  priority: 'High' | 'Medium' | 'Low';
  sku?: string;
  category?: string;
}

const SEED_ALERTS: ReorderAlert[] = [
  {
    id: '1',
    productName: 'Paracetamol 500mg Tablets',
    sku: 'SKU-PARA-500',
    category: 'Analgesics',
    currentStock: 20,
    reorderLevel: 50,
    suggestedQty: 200,
    priority: 'High',
  },
  {
    id: '2',
    productName: 'Amoxicillin 250mg Capsules',
    sku: 'SKU-AMOX-250',
    category: 'Antibiotics',
    currentStock: 40,
    reorderLevel: 60,
    suggestedQty: 150,
    priority: 'Medium',
  },
  {
    id: '3',
    productName: 'Vitamin D3 Drops',
    sku: 'SKU-VITD3-DRP',
    category: 'Supplements',
    currentStock: 12,
    reorderLevel: 30,
    suggestedQty: 100,
    priority: 'High',
  },
  {
    id: '4',
    productName: 'Metformin 850mg Tablets',
    sku: 'SKU-MET-850',
    category: 'Antidiabetic',
    currentStock: 95,
    reorderLevel: 100,
    suggestedQty: 300,
    priority: 'Low',
  },
];

const safeJsonParse = (data: string | null, fallback: any) => {
  if (!data) return fallback;
  try {
    return JSON.parse(data);
  } catch (err) {
    console.log('safeJsonParse error in AutoReorderAlertsScreen:', err);
    return fallback;
  }
};

const AutoReorderAlertsScreen = () => {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');
  const [alerts, setAlerts] = useState<ReorderAlert[]>([]);

  const customAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const loadAlerts = async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) {
      setLoading(true);
    }
    setError(null);
    try {
      const stored = await AsyncStorage.getItem('@reorder_alerts');
      if (stored) {
        setAlerts(safeJsonParse(stored, []));
      } else {
        // First load, write seed data
        await AsyncStorage.setItem('@reorder_alerts', JSON.stringify(SEED_ALERTS));
        setAlerts(SEED_ALERTS);
      }
    } catch (e) {
      console.log('Failed to load reorder alerts', e);
      setError('Failed to load reorder alerts.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAlerts(true);
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAlerts(false);
    setRefreshing(false);
  };

  const handleCreatePurchaseOrder = (alertItem: ReorderAlert) => {
    customAlert(
      'PO Created Successfully',
      `A purchase order for ${alertItem.suggestedQty} units of ${alertItem.productName} has been drafted and sent to regional manager approval.`
    );
  };

  const handleDismissAlert = async (id: string) => {
    const updated = alerts.filter(item => item.id !== id);
    setAlerts(updated);
    try {
      await AsyncStorage.setItem('@reorder_alerts', JSON.stringify(updated));
    } catch (e) {
      console.log('Failed to dismiss alert', e);
    }
  };

  const handleResetAlerts = async () => {
    try {
      await AsyncStorage.setItem('@reorder_alerts', JSON.stringify(SEED_ALERTS));
      setAlerts(SEED_ALERTS);
      customAlert('Reset Successful', 'Reorder alerts reset to defaults.');
    } catch (e) {
      console.log('Failed to reset alerts', e);
    }
  };

  const filtered = alerts.filter(item => {
    const matchesSearch = item.productName.toLowerCase().includes(search.toLowerCase()) || 
                          (item.sku || '').toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === 'All' || item.priority === activeTab;
    return matchesSearch && matchesTab;
  });

  const highPriorityCount = alerts.filter(a => a.priority === 'High').length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Auto Reorder Alerts</Text>
        <Text style={styles.headerSubtitle}>
          {highPriorityCount > 0 
            ? `⚠️ ${highPriorityCount} high-priority replenishment items require attention` 
            : 'All stock levels are operating within margins'}
        </Text>
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading stock levels...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={{ color: '#EF4444', fontSize: 14, marginVertical: 8 }}>{error}</Text>
          <TouchableOpacity onPress={() => loadAlerts(true)} style={{ paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#4F46E5', borderRadius: 8 }}>
            <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Controls & Search */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search products by name or SKU..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {/* Filters Bar */}
          <View style={styles.tabContainer}>
            {(['All', 'High', 'Medium', 'Low'] as const).map(tab => (
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
          </View>

          {/* Reset Bar when empty */}
          {__DEV__ && alerts.length === 0 && (
            <View style={styles.resetContainer}>
              <TouchableOpacity style={styles.resetButton} onPress={handleResetAlerts}>
                <Text style={styles.resetButtonText}>Reset Mock Alerts</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Alerts List */}
          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />
            }
            ListEmptyComponent={
              <View style={styles.emptyCard}>
                <Ionicons name="shield-checkmark-outline" size={48} color="#10B981" />
                <Text style={styles.emptyText}>No reorder alerts found</Text>
                <Text style={styles.emptySubText}>
                  All stock parameters are verified. Pull to refresh or load default mock data.
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const priorityColor =
                item.priority === 'High'
                  ? '#EF4444'
                  : item.priority === 'Medium'
                  ? '#F59E0B'
                  : '#10B981';

              const stockRatio = item.currentStock / item.reorderLevel;
              const fillWidth = Math.min(Math.round(stockRatio * 100), 100);

              return (
                <View style={styles.card}>
                  <View style={styles.headerRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.productName}>{item.productName}</Text>
                      <Text style={styles.productSku}>{item.sku} | {item.category}</Text>
                    </View>
                    <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '15' }]}>
                      <Text style={[styles.priorityText, { color: priorityColor }]}>
                        {item.priority}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  {/* Stock ratio level indicator */}
                  <View style={styles.progressContainer}>
                    <View style={styles.progressLabelRow}>
                      <Text style={styles.progressLabel}>Stock Safety Level:</Text>
                      <Text style={[styles.progressPct, { color: stockRatio < 0.5 ? '#EF4444' : '#64748B' }]}>
                        {item.currentStock} / {item.reorderLevel} units
                      </Text>
                    </View>
                    <View style={styles.progressBarBg}>
                      <View 
                        style={[
                          styles.progressBarFill, 
                          { 
                            width: `${fillWidth}%`,
                            backgroundColor: stockRatio < 0.5 ? '#EF4444' : '#F59E0B'
                          }
                        ]} 
                      />
                    </View>
                  </View>

                  {/* Stock Values details */}
                  <View style={styles.detailsRow}>
                    <View style={styles.detailBox}>
                      <Text style={styles.detailVal}>{item.currentStock}</Text>
                      <Text style={styles.detailLabel}>On Hand</Text>
                    </View>
                    <View style={styles.detailBox}>
                      <Text style={styles.detailVal}>{item.reorderLevel}</Text>
                      <Text style={styles.detailLabel}>Min Threshold</Text>
                    </View>
                    <View style={styles.detailBox}>
                      <Text style={[styles.detailVal, { color: '#4F46E5' }]}>+{item.suggestedQty}</Text>
                      <Text style={styles.detailLabel}>Suggested Qty</Text>
                    </View>
                  </View>

                  {/* Actions Row */}
                  <View style={styles.actionsRow}>
                    <TouchableOpacity 
                      style={styles.dismissButton} 
                      onPress={() => handleDismissAlert(item.id)}
                    >
                      <Ionicons name="eye-off-outline" size={16} color="#64748B" />
                      <Text style={styles.dismissButtonText}>Dismiss</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.orderButton} 
                      onPress={() => handleCreatePurchaseOrder(item)}
                    >
                      <Ionicons name="cart-outline" size={16} color="#FFFFFF" />
                      <Text style={styles.orderButtonText}>Create PO</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
          />
        </>
      )}
    </View>
  );
};

export default AutoReorderAlertsScreen;

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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#E0E7FF',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 15,
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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 15,
    marginBottom: 5,
    gap: 6,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
  },
  activeTabButton: {
    backgroundColor: '#4F46E5',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 60,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  productSku: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  progressPct: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
  },
  detailsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 10,
    marginBottom: 12,
  },
  detailBox: {
    flex: 1,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  detailVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
  },
  detailLabel: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dismissButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  dismissButtonText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: 'bold',
  },
  orderButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    paddingVertical: 10,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#334155',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  resetContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
    alignItems: 'flex-end',
  },
  resetButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  resetButtonText: {
    fontSize: 11,
    color: '#4F46E5',
    fontWeight: 'bold',
  },
});
