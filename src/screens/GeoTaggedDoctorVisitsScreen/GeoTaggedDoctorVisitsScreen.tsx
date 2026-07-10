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
import { getDoctorVisitsByMr, getDoctors } from '../../services/doctorService';

const safeJsonParse = (data: string | null, fallback: any) => {
  if (!data) return fallback;
  try {
    return JSON.parse(data);
  } catch (err) {
    console.log('safeJsonParse error in GeoTaggedDoctorVisitsScreen:', err);
    return fallback;
  }
};

interface GeoDocVisit {
  id: string;
  doctorName: string;
  visitTime: string;
  latitude: number | null;
  longitude: number | null;
  gpsStatus: string;
  status: 'Verified' | 'Pending' | 'Rejected';
}

const GeoTaggedDoctorVisitsScreen = () => {
  const [search, setSearch] = useState('');
  const [visits, setVisits] = useState<GeoDocVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLocalVisits();
  }, []);

  const loadLocalVisits = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch master doctor list to resolve names dynamically
      let docsList = [];
      try {
        const docsRes = await getDoctors();
        docsList = docsRes.data || docsRes || [];
      } catch (e) {
        console.log('Failed to fetch master doctors:', e);
      }
      const docsMap = new Map<number, string>();
      docsList.forEach((d: any) => {
        if (d.id) {
          docsMap.set(Number(d.id), d.name || d.doctorName);
        }
      });

      let serverVisits = [];
      try {
        serverVisits = await getDoctorVisitsByMr();
      } catch (err) {
        console.log('Failed to fetch doctor visits from backend:', err);
      }

      if (serverVisits && serverVisits.length > 0) {
        const mapped: GeoDocVisit[] = serverVisits.map((item: any, idx: number) => {
          let timeStr = '-';
          if (item.visitDate) {
            try {
              const d = new Date(item.visitDate);
              timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } catch (e) {}
          }
          const docIdNum = Number(item.doctorId);
          const resolvedName = docsMap.get(docIdNum) || item.doctorName || item.doctor?.name || (item.doctorId ? `Doctor #${item.doctorId}` : 'N/A');
          return {
            id: item.id?.toString() || `server-${idx}`,
            doctorName: resolvedName,
            visitTime: timeStr,
            latitude: item.latitude && !isNaN(parseFloat(item.latitude)) ? parseFloat(item.latitude) : null,
            longitude: item.longitude && !isNaN(parseFloat(item.longitude)) ? parseFloat(item.longitude) : null,
            gpsStatus: item.latitude ? 'Location Recorded' : 'Pending GPS Lock',
            status: item.status === 'Verified' || item.status === 'Rejected'
              ? item.status
              : (item.latitude ? 'Verified' : 'Pending')
          };
        });
        setVisits(mapped);
        await AsyncStorage.setItem('@doctor_visits', JSON.stringify(serverVisits));
      } else {
        const stored = await AsyncStorage.getItem('@doctor_visits');
        const parsed = safeJsonParse(stored, []);
        const mapped: GeoDocVisit[] = parsed.map((item: any, idx: number) => {
          const docIdNum = Number(item.doctorId);
          const resolvedName = docsMap.get(docIdNum) || item.doctorName || item.doctor?.name || (item.doctorId ? `Doctor #${item.doctorId}` : 'N/A');
          let timeStr = item.visitTime || '-';
          if (item.visitDate) {
            try {
              const d = new Date(item.visitDate);
              timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } catch (e) {}
          }
          return {
            id: item.id?.toString() || `local-${Date.now()}-${idx}`,
            doctorName: resolvedName,
            visitTime: timeStr,
            latitude: item.latitude && !isNaN(parseFloat(item.latitude)) ? parseFloat(item.latitude) : null,
            longitude: item.longitude && !isNaN(parseFloat(item.longitude)) ? parseFloat(item.longitude) : null,
            gpsStatus: item.latitude ? 'Location Recorded' : 'Pending GPS Lock',
            status: item.status === 'Verified' || item.status === 'Rejected' 
              ? item.status 
              : (item.latitude ? 'Verified' : 'Pending')
          };
        });
        setVisits(mapped);
      }
    } catch (err) {
      console.log('Failed to load doctor visits', err);
      setError('Failed to load doctor visits.');
    } finally {
      setLoading(false);
    }
  };

  const filteredVisits = visits.filter(item =>
    (item.doctorName || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search doctor visits..."
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
              <Text style={styles.kpiLabel}>Pending / Rejected</Text>
              <Text style={[styles.kpiValue, { color: '#EF4444' }]}>
                {filteredVisits.filter(v => v.status === 'Rejected' || v.status === 'Pending').length}
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
                  No doctor visits found
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

              return (
                <View style={styles.listItem}>
                  <View style={styles.listHeader}>
                    <Text style={styles.docName}>{item.doctorName}</Text>
                    <View style={[styles.badge, { backgroundColor: badgeBg }]}>
                      <Text style={[styles.badgeText, { color: badgeColor }]}>{item.status}</Text>
                    </View>
                  </View>

                  <View style={styles.locationDetailRow}>
                    <Text style={styles.locationCity}>
                      📍 GPS Status: <Text style={{ fontWeight: 'normal', color: item.latitude ? '#10B981' : '#F59E0B' }}>{item.gpsStatus}</Text>
                    </Text>
                    {item.latitude !== null && item.longitude !== null ? (
                      <View style={{ marginTop: 4 }}>
                        <Text style={styles.locationCoords}>Latitude: {item.latitude.toFixed(5)}</Text>
                        <Text style={styles.locationCoords}>Longitude: {item.longitude.toFixed(5)}</Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.timeRow}>
                    <Text style={styles.timeText}>🕒 Visit Time: {item.visitTime}</Text>
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

export default GeoTaggedDoctorVisitsScreen;

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
  docName: {
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
  locationDetailRow: {
    marginBottom: 10,
    gap: 4,
  },
  locationCity: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  locationCoords: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#64748B',
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