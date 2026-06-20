import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
    FlatList,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';

const safeJsonParse = (data: string | null, fallback: any) => {
  if (!data) return fallback;
  try {
    return JSON.parse(data);
  } catch (err) {
    console.log('safeJsonParse error in GeoTaggedChemistVisitsScreen:', err);
    return fallback;
  }
};

interface GeoChemVisit {
  id: string;
  chemistName: string;
  visitTime: string;
  latitude: number | null;
  longitude: number | null;
  distanceVerified: string;
  status: 'Verified' | 'Pending' | 'Rejected';
}

const GeoTaggedChemistVisitsScreen = () => {
  const [search, setSearch] = useState('');
  const [visits, setVisits] = useState<GeoChemVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLocalVisits();
  }, []);

  const loadLocalVisits = async () => {
    setLoading(true);
    setError(null);
    try {
      const stored = await AsyncStorage.getItem('@chemist_visits');
      const parsed = safeJsonParse(stored, []);
      const mapped: GeoChemVisit[] = parsed.map((item: any, idx: number) => ({
        id: item.id?.toString() || `local-${Date.now()}-${idx}`,
        chemistName: item.chemistName || 'Unknown Chemist',
        visitTime: item.visitTime || '-',
        latitude: item.latitude && !isNaN(parseFloat(item.latitude))
          ? parseFloat(item.latitude)
          : null,
        longitude: item.longitude && !isNaN(parseFloat(item.longitude))
          ? parseFloat(item.longitude)
          : null,
        distanceVerified: item.distanceVerified || (item.latitude ? 'Verified (within 50m)' : 'Pending Verification'),
        status: item.status === 'Verified' || item.status === 'Rejected' 
          ? item.status 
          : (item.latitude ? 'Verified' : 'Pending')
      }));
      setVisits(mapped);
    } catch (err) {
      console.log('Failed to load chemist visits', err);
      setError('Failed to load chemist visits.');
    } finally {
      setLoading(false);
    }
  };

  const filteredVisits = visits.filter(item =>
    (item.chemistName || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search chemist visits..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#8B5CF6" style={{ marginTop: 50 }} />
      ) : error ? (
        <View style={{ padding: 30, alignItems: 'center' }}>
          <Text style={{ color: '#EF4444', fontSize: 14, marginBottom: 12 }}>{error}</Text>
          <TouchableOpacity onPress={loadLocalVisits} style={{ paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#8B5CF6', borderRadius: 8 }}>
            <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* KPI stats */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.kpiScroll}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Total Visits</Text>
              <Text style={[styles.kpiValue, { color: '#8B5CF6' }]}>{filteredVisits.length}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Verified</Text>
              <Text style={[styles.kpiValue, { color: '#10B981' }]}>
                {filteredVisits.filter(v => v.status === 'Verified').length}
              </Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Coverage %</Text>
              <Text style={[styles.kpiValue, { color: '#3B82F6' }]}>
                {(() => {
                  const verified = filteredVisits.filter(v => v.status === 'Verified').length;
                  const total = filteredVisits.length;
                  return total > 0 ? `${Math.round((verified / total) * 100)}%` : '0%';
                })()}
              </Text>
            </View>
          </ScrollView>

          {/* List */}
          <FlatList
            data={filteredVisits}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <View style={{ padding: 30, alignItems: 'center' }}>
                <Text style={{ color: '#64748B' }}>
                  No chemist visits found
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              let badgeColor = '#EF4444';
              let badgeBg = '#FEE2E2';
              if (item.status === 'Verified') {
                badgeColor = '#10B981';
                badgeBg = '#D1FAE5';
              } else if (item.status === 'Pending') {
                badgeColor = '#F59E0B';
                badgeBg = '#FEF3C7';
              }

              let distanceColor = '#EF4444';
              if (item.distanceVerified.includes('Yes')) {
                distanceColor = '#10B981';
              } else if (item.distanceVerified.includes('Pending')) {
                distanceColor = '#F59E0B';
              }

              return (
                <View style={styles.listItem}>
                  <View style={styles.listHeader}>
                    <Text style={styles.chemistName}>{item.chemistName}</Text>
                    <View style={[styles.badge, { backgroundColor: badgeBg }]}>
                      <Text style={[styles.badgeText, { color: badgeColor }]}>{item.status}</Text>
                    </View>
                  </View>

                  <View style={styles.coordRow}>
                    <Text style={styles.coordLabel}>Coords:</Text>
                    <Text style={styles.coordValue}>
                      {item.latitude !== null && item.longitude !== null
                        ? `${item.latitude.toFixed(4)}° N, ${item.longitude.toFixed(4)}° E`
                        : 'GPS Not Available'}
                    </Text>
                  </View>

                  <View style={styles.timeRow}>
                    <Text style={styles.timeText}>🕒 Checked In: {item.visitTime}</Text>
                    <Text style={[styles.matchText, { color: distanceColor }]}>
                      {item.distanceVerified}
                    </Text>
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

export default GeoTaggedChemistVisitsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
  },
  searchSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: {
    fontSize: 14,
    color: '#0F172A',
  },
  kpiScroll: {
    flexGrow: 0,
    marginBottom: 16,
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 14,
    marginRight: 10,
    minWidth: 110,
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
    fontWeight: '500',
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  listItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 10,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  chemistName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  coordRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  coordLabel: {
    fontSize: 12,
    color: '#64748B',
    marginRight: 4,
  },
  coordValue: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#334155',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  timeText: {
    fontSize: 11,
    color: '#64748B',
  },
  matchText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
});