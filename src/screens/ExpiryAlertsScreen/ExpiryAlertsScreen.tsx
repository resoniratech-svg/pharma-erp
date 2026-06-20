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

interface ExpiryAlert {
  id: string;
  productName: string;
  batchNo: string;
  expiryDate: string; // DD-MM-YYYY
  stockQty: number;
  value: number; // Value of stock at risk
  priority: 'Expired' | 'Critical' | 'Warning';
  category?: string;
}

const SEED_ALERTS: ExpiryAlert[] = [
  {
    id: '1',
    productName: 'Cough Syrup 100ml',
    batchNo: 'B-CS-8812',
    expiryDate: '12-May-2026',
    stockQty: 45,
    value: 5400,
    priority: 'Expired',
    category: 'Liquid Oral',
  },
  {
    id: '2',
    productName: 'Azithromycin 500mg',
    batchNo: 'B-AZI-9921',
    expiryDate: '15-Aug-2026',
    stockQty: 120,
    value: 18000,
    priority: 'Critical',
    category: 'Tablets',
  },
  {
    id: '3',
    productName: 'Insulin Glargine 100IU',
    batchNo: 'B-INS-7711',
    expiryDate: '30-Nov-2026',
    stockQty: 15,
    value: 22500,
    priority: 'Warning',
    category: 'Injectables',
  },
  {
    id: '4',
    productName: 'Calpol Suspension 60ml',
    batchNo: 'B-CAL-1102',
    expiryDate: '10-Jul-2026',
    stockQty: 80,
    value: 3600,
    priority: 'Critical',
    category: 'Paediatric',
  },
];

const safeJsonParse = (data: string | null, fallback: any) => {
  if (!data) return fallback;
  try {
    return JSON.parse(data);
  } catch (err) {
    console.log('safeJsonParse error in ExpiryAlertsScreen:', err);
    return fallback;
  }
};

const ExpiryAlertsScreen = () => {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'All' | 'Expired' | 'Critical' | 'Warning'>('All');
  const [alerts, setAlerts] = useState<ExpiryAlert[]>([]);

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
      const stored = await AsyncStorage.getItem('@expiry_alerts');
      if (stored) {
        setAlerts(safeJsonParse(stored, []));
      } else {
        await AsyncStorage.setItem('@expiry_alerts', JSON.stringify(SEED_ALERTS));
        setAlerts(SEED_ALERTS);
      }
    } catch (e) {
      console.log('Failed to load expiry alerts', e);
      setError('Failed to load expiry alerts.');
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

  const handleReturnToVendor = (alertItem: ExpiryAlert) => {
    customAlert(
      'Vendor Return Initiated',
      `Batch ${alertItem.batchNo} of ${alertItem.productName} (${alertItem.stockQty} units) has been flagged for return logistics to distributor. Refund invoice drafted.`
    );
  };

  const handleDisposeStock = async (id: string) => {
    const updated = alerts.filter(item => item.id !== id);
    setAlerts(updated);
    try {
      await AsyncStorage.setItem('@expiry_alerts', JSON.stringify(updated));
      customAlert('Stock Disposed', 'Inventory record updated successfully. Dispose protocol logged.');
    } catch (e) {
      console.log('Failed to dispose stock', e);
    }
  };

  const handleResetAlerts = async () => {
    try {
      await AsyncStorage.setItem('@expiry_alerts', JSON.stringify(SEED_ALERTS));
      setAlerts(SEED_ALERTS);
      customAlert('Reset Successful', 'Expiry alerts reset to defaults.');
    } catch (e) {
      console.log('Failed to reset alerts', e);
    }
  };

  const filtered = alerts.filter(item => {
    const matchesSearch = item.productName.toLowerCase().includes(search.toLowerCase()) || 
                          (item.batchNo || '').toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === 'All' || item.priority === activeTab;
    return matchesSearch && matchesTab;
  });

  const criticalCount = alerts.filter(a => a.priority === 'Expired' || a.priority === 'Critical').length;
  const totalLossValue = filtered.reduce((sum, item) => sum + (item.value || 0), 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Expiry & Batch Alerts</Text>
        <Text style={styles.headerSubtitle}>
          {criticalCount > 0 
            ? `⚠️ ${criticalCount} batch(es) expired or expiring within 90 days` 
            : 'All active inventory batches are within safe shelf life'}
        </Text>
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Verifying batch dates...</Text>
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
          {/* Search */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by product name or batch..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {/* Filters Bar */}
          <View style={styles.tabContainer}>
            {(['All', 'Expired', 'Critical', 'Warning'] as const).map(tab => (
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

          {/* Value at Risk KPI Bar */}
          {filtered.length > 0 && (
            <View style={styles.kpiBar}>
              <Text style={styles.kpiLabel}>Total Value at Risk:</Text>
              <Text style={styles.kpiVal}>₹{totalLossValue.toLocaleString()}</Text>
            </View>
          )}

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
                <Text style={styles.emptyText}>No expiry alerts found</Text>
                <Text style={styles.emptySubText}>
                  All stock parameters are verified. Pull to refresh or load default mock data.
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const statusColor =
                item.priority === 'Expired'
                  ? '#EF4444'
                  : item.priority === 'Critical'
                  ? '#F59E0B'
                  : '#3B82F6';

              return (
                <View style={styles.card}>
                  <View style={styles.headerRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.productName}>{item.productName}</Text>
                      <Text style={styles.productBatch}>Batch: {item.batchNo} | {item.category}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
                      <Text style={[styles.statusText, { color: statusColor }]}>
                        {item.priority.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  {/* Expiry details */}
                  <View style={styles.detailsRow}>
                    <View style={styles.detailBox}>
                      <Text style={styles.detailVal}>{item.expiryDate}</Text>
                      <Text style={styles.detailLabel}>Expiry Date</Text>
                    </View>
                    <View style={styles.detailBox}>
                      <Text style={styles.detailVal}>{item.stockQty} units</Text>
                      <Text style={styles.detailLabel}>Stock Qty</Text>
                    </View>
                    <View style={styles.detailBox}>
                      <Text style={[styles.detailVal, { color: '#EF4444' }]}>₹{item.value.toLocaleString()}</Text>
                      <Text style={styles.detailLabel}>Loss Value</Text>
                    </View>
                  </View>

                  {/* Actions Row */}
                  <View style={styles.actionsRow}>
                    <TouchableOpacity 
                      style={styles.disposeButton} 
                      onPress={() => handleDisposeStock(item.id)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                      <Text style={styles.disposeButtonText}>Dispose</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.returnButton} 
                      onPress={() => handleReturnToVendor(item)}
                    >
                      <Ionicons name="swap-horizontal-outline" size={16} color="#FFFFFF" />
                      <Text style={styles.returnButtonText}>Return to Vendor</Text>
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

export default ExpiryAlertsScreen;

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
  kpiBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    marginHorizontal: 20,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE4E6',
  },
  kpiLabel: {
    fontSize: 12,
    color: '#9F1239',
    fontWeight: 'bold',
  },
  kpiVal: {
    fontSize: 14,
    color: '#9F1239',
    fontWeight: 'bold',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
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
  productBatch: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
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
    fontSize: 13,
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
  disposeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 10,
    paddingVertical: 10,
    backgroundColor: '#FFF5F5',
  },
  disposeButtonText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: 'bold',
  },
  returnButton: {
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
  returnButtonText: {
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
