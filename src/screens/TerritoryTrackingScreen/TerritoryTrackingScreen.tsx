import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import React, { useState, useCallback } from 'react';
import { getTerritoryBeats } from '../../services/territoryService';
import { getDoctors, getDoctorVisitsByMr } from '../../services/doctorService';
import { getChemists, getChemistVisitsByMr } from '../../services/chemistService';
import { getAttendanceLogs } from '../../services/attendanceService';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';

interface BeatTerritory {
  id: string;
  area: string;
  district: string;
  state: string;
  doctorsCount: number;
  chemistsCount: number;
  coverage: number; // Historical base coverage %
  lastActivity: string;
  status: 'Active Beat' | 'Secondary Beat';
}
const safeJsonParse = (data: string | null, fallback: any) => {
  if (!data) return fallback;
  try {
    return JSON.parse(data);
  } catch (err) {
    console.log('safeJsonParse error:', err);
    return fallback;
  }
};

const TerritoryTrackingScreen = () => {
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dynamic states
  const [territories, setTerritories] = useState<BeatTerritory[]>([]);
  const [expandedBeatId, setExpandedBeatId] = useState<string | null>(null);
  const [hqZone, setHqZone] = useState('No HQ Assigned');
  const [beatDetails, setBeatDetails] = useState<{ [key: string]: { doctors: string[]; chemists: string[] } }>({});
  
  // Real-time visit counts today per beat
  const [todayVisits, setTodayVisits] = useState<{
    [beatArea: string]: { doctors: number; chemists: number; docNames: string[]; chemNames: string[] };
  }>({});

  const [coveredCount, setCoveredCount] = useState(3);
  const [trackedDistance, setTrackedDistance] = useState('18.4 KM');
  const [assignedDate, setAssignedDate] = useState('N/A');

  const loadData = async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) {
      setLoading(true);
    }
    setError(null);
    try {
      // Helper for GPS distance calculation
      const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Earth's radius in km
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };

      // 1. Fetch real master lists from backend services
      let docs: any[] = [];
      let chems: any[] = [];
      try {
        const docRes = await getDoctors();
        docs = docRes.data || docRes || [];
      } catch (e) {
        console.log('Docs load error in territory tracking:', e);
      }

      try {
        const chemRes = await getChemists();
        chems = chemRes.data || chemRes || [];
      } catch (e) {
        console.log('Chemists load error in territory tracking:', e);
      }

      // 2. Load HQ dynamically from the logged-in user profile
      const userRaw = await AsyncStorage.getItem('@user');
      const userObj = userRaw ? safeJsonParse(userRaw, null) : null;
      setHqZone(userObj?.hq || userObj?.headquarters || 'N/A');

      // 3. Load Beats from backend or fall back to empty beat array
      let serverBeats = [];
      try {
        const beatRes = await getTerritoryBeats();
        serverBeats = beatRes.data || beatRes || [];
      } catch (e) {
        console.log('Beats load error from server:', e);
      }

      const activeBeats = Array.isArray(serverBeats) ? serverBeats : [];
      const activeTerritories: BeatTerritory[] = activeBeats.map((b: any, idx: number) => ({
        id: b.id?.toString() || `beat-${idx}`,
        area: b.area || 'N/A',
        district: b.district || 'N/A',
        state: b.state || 'N/A',
        doctorsCount: b.doctorsCount || 0,
        chemistsCount: b.chemistsCount || 0,
        coverage: b.coverage || 0,
        lastActivity: b.lastActivity || 'N/A',
        status: b.status || 'Secondary Beat'
      }));

      // Parse assignment date dynamically from backend if available
      let parsedAssignedDate = '';
      if (activeBeats.length > 0) {
        const firstBeat = activeBeats[0];
        const rawDate = firstBeat.assignedOn || firstBeat.assignedAt || firstBeat.createdAt || firstBeat.date;
        if (rawDate) {
          try {
            const d = new Date(rawDate);
            if (!isNaN(d.getTime())) {
              const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              parsedAssignedDate = `${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
            } else {
              parsedAssignedDate = String(rawDate);
            }
          } catch {
            parsedAssignedDate = String(rawDate);
          }
        }
      }
      if (!parsedAssignedDate) {
        parsedAssignedDate = 'N/A';
      }
      setAssignedDate(parsedAssignedDate);

      // 4. Load actual logged visits today from server APIs to compute dynamic stats
      let docVisits: any[] = [];
      let chemVisits: any[] = [];
      let attendanceLogs: any[] = [];

      try {
        const rawDocs = await getDoctorVisitsByMr();
        docVisits = Array.isArray(rawDocs) ? rawDocs : [];
      } catch (err) { console.log('Error loading doc visits in territory tracking:', err); }

      try {
        const rawChems = await getChemistVisitsByMr();
        chemVisits = Array.isArray(rawChems) ? rawChems : [];
      } catch (err) { console.log('Error loading chemist visits in territory tracking:', err); }

      try {
        const rawAttendance = await getAttendanceLogs();
        attendanceLogs = Array.isArray(rawAttendance) ? rawAttendance : [];
      } catch (err) { console.log('Error loading attendance in territory tracking:', err); }

      const todayStr = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');

      // Helper to match dates safely across Android/iOS/Web and different formats
      const isSameDay = (item: any, targetDateStr: string): boolean => {
        try {
          const val = item.date || item.visitDate || item.createdAt || item.timestamp || item.id;
          if (!val) return false;
          
          if (typeof val === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(val)) {
            return val === targetDateStr;
          }
          
          let ts = typeof val === 'number' ? val : Number(val);
          if (isNaN(ts) && typeof val === 'string') {
            const match = val.match(/\d{10,13}/);
            if (match) ts = Number(match[0]);
          }
          
          if (isNaN(ts) || ts <= 0) {
            // Try standard Date parsing for ISO string
            const dateObj = new Date(val);
            if (!isNaN(dateObj.getTime())) {
              const day = String(dateObj.getDate()).padStart(2, '0');
              const month = String(dateObj.getMonth() + 1).padStart(2, '0');
              const year = dateObj.getFullYear();
              return `${day}-${month}-${year}` === targetDateStr;
            }
            return false;
          }
          
          const dateObj = new Date(ts);
          if (isNaN(dateObj.getTime())) return false;
          
          const day = String(dateObj.getDate()).padStart(2, '0');
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const year = dateObj.getFullYear();
          return `${day}-${month}-${year}` === targetDateStr;
        } catch (err) {
          console.log('Error comparing dates in isSameDay:', err);
          return false;
        }
      };

      const todayDocs = docVisits.filter((v: any) => isSameDay(v, todayStr));
      const todayChems = chemVisits.filter((v: any) => isSameDay(v, todayStr));
      const todayAtt = attendanceLogs.find((a: any) => {
        const d = a.checkInTime || a.checkinTime || a.createdAt || '';
        return isSameDay({ date: d }, todayStr);
      });

      // 5. Group the real doctors and chemists dynamically into the beats details mapping (Strict matching - no random modulo fallback)
      const resolvedDetails: { [key: string]: { doctors: string[]; chemists: string[] } } = {};
      
      activeTerritories.forEach((t: BeatTerritory) => {
        const doctorsInBeat = docs
          .filter((d: any) => {
            const dBeat = (d.beat || d.clinicAddress || d.address || d.hospital || '').toLowerCase().trim();
            const tArea = t.area.toLowerCase().trim();
            return dBeat && (dBeat.includes(tArea) || tArea.includes(dBeat));
          })
          .map((d: any) => d.doctorName || d.name || '')
          .filter((name: string) => name.trim().length > 0);

        const chemistsInBeat = chems
          .filter((c: any) => {
            const cBeat = (c.beat || c.address || '').toLowerCase().trim();
            const tArea = t.area.toLowerCase().trim();
            return cBeat && (cBeat.includes(tArea) || tArea.includes(cBeat));
          })
          .map((c: any) => c.name || c.chemistName || c.shopName || '')
          .filter((name: string) => name.trim().length > 0);

        resolvedDetails[t.id] = {
          doctors: doctorsInBeat,
          chemists: chemistsInBeat
        };

        // Update counts inside territory structure dynamically
        t.doctorsCount = doctorsInBeat.length;
        t.chemistsCount = chemistsInBeat.length;
      });

      setBeatDetails(resolvedDetails);
      setTerritories(activeTerritories);

      // Match visits to beat areas
      const matches: { [key: string]: { doctors: number; chemists: number; docNames: string[]; chemNames: string[] } } = {};
      
      activeTerritories.forEach((t: BeatTerritory) => {
        const areaKeyword = t.area.split(' ')[0].toLowerCase();
        const assignedDoctors = resolvedDetails[t.id]?.doctors || [];
        const assignedChemists = resolvedDetails[t.id]?.chemists || [];

        const matchedDocs = todayDocs.filter((v: any) => {
          const docNameLower = (v.doctorName || '').toLowerCase();
          const hospitalLower = (v.hospital || '').toLowerCase();
          const notesLower = (v.notes || '').toLowerCase();

          const matchesName = assignedDoctors.some((assignedDoc: string) => {
            const cleanAssigned = assignedDoc.replace(/^Dr\.\s+/i, '').split('(')[0].trim().toLowerCase();
            return docNameLower.includes(cleanAssigned) || cleanAssigned.includes(docNameLower);
          });

          const matchesKeyword = areaKeyword && (
            hospitalLower.includes(areaKeyword) || 
            notesLower.includes(areaKeyword)
          );

          return matchesName || matchesKeyword;
        });

        const matchedChems = todayChems.filter((v: any) => {
          const shopNameLower = (v.shopName || '').toLowerCase();
          const areaLower = (v.area || '').toLowerCase();

          const matchesName = assignedChemists.some((assignedChem: string) => {
            const cleanAssigned = assignedChem.toLowerCase();
            return shopNameLower.includes(cleanAssigned) || cleanAssigned.includes(shopNameLower);
          });

          const matchesKeyword = areaKeyword && (
            areaLower.includes(areaKeyword) ||
            shopNameLower.includes(areaKeyword)
          );

          return matchesName || matchesKeyword;
        });

        matches[t.area] = {
          doctors: matchedDocs.length,
          chemists: matchedChems.length,
          docNames: matchedDocs.map((v: any) => v.doctorName || 'N/A'),
          chemNames: matchedChems.map((v: any) => v.shopName || 'N/A'),
        };
      });

      setTodayVisits(matches);

      // Compute Covered Beats dynamic status count
      let coveredTodayCount = 0;
      activeTerritories.forEach((t: BeatTerritory) => {
        const loggedToday = matches[t.area] || { doctors: 0, chemists: 0 };
        if (loggedToday.doctors > 0 || loggedToday.chemists > 0) {
          coveredTodayCount++;
        }
      });
      setCoveredCount(coveredTodayCount);

      // Calculate traversed distance dynamically based on all backend event coordinates
      const distanceNodes: { time: string; latitude: number; longitude: number }[] = [];
      
      if (todayAtt) {
        const ciLat = parseFloat(todayAtt.checkInLatitude  || todayAtt.latitude  || '0');
        const ciLng = parseFloat(todayAtt.checkInLongitude || todayAtt.longitude || '0');
        if (ciLat && ciLng) {
          distanceNodes.push({
            time: todayAtt.checkInTime || todayAtt.checkinTime || '09:00 AM',
            latitude: ciLat,
            longitude: ciLng
          });
        }
        
        const coLat = parseFloat(todayAtt.checkOutLatitude  || todayAtt.checkoutLatitude  || '0');
        const coLng = parseFloat(todayAtt.checkOutLongitude || todayAtt.longitude || '0');
        if (coLat && coLng) {
          distanceNodes.push({
            time: todayAtt.checkOutTime || todayAtt.checkoutTime || '06:00 PM',
            latitude: coLat,
            longitude: coLng
          });
        }
      }

      todayDocs.forEach((v: any) => {
        const lat = parseFloat(v.latitude || '0');
        const lng = parseFloat(v.longitude || '0');
        if (lat && lng) {
          distanceNodes.push({
            time: v.visitDate || v.createdAt || '10:00 AM',
            latitude: lat,
            longitude: lng
          });
        }
      });

      todayChems.forEach((c: any) => {
        const lat = parseFloat(c.latitude || '0');
        const lng = parseFloat(c.longitude || '0');
        if (lat && lng) {
          distanceNodes.push({
            time: c.visitDate || c.createdAt || '11:00 AM',
            latitude: lat,
            longitude: lng
          });
        }
      });

      // Sort chronological
      const timeToMins = (t: string): number => {
        try {
          const d = new Date(t);
          if (!isNaN(d.getTime())) return d.getHours() * 60 + d.getMinutes();
        } catch {}
        const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (!m) return 720;
        let h = parseInt(m[1]); const min = parseInt(m[2]); const ap = m[3].toUpperCase();
        if (ap === 'PM' && h < 12) h += 12;
        if (ap === 'AM' && h === 12) h = 0;
        return h * 60 + min;
      };
      
      distanceNodes.sort((a, b) => timeToMins(a.time) - timeToMins(b.time));

      let distSum = 0;
      if (distanceNodes.length > 1) {
        for (let i = 0; i < distanceNodes.length - 1; i++) {
          distSum += calculateDistance(
            distanceNodes[i].latitude, distanceNodes[i].longitude,
            distanceNodes[i + 1].latitude, distanceNodes[i + 1].longitude
          );
        }
      }
      setTrackedDistance(`${distSum.toFixed(1)} KM`);

    } catch (err) {
      console.log('Failed to compile territory dashboard data', err);
      setError('Unable to load territory data.');
    } finally {
      setLoading(false);
    }
  };

  // React Navigation Focus Effect (Refresh stats and lists when screen is focused)
  useFocusEffect(
    useCallback(() => {
      loadData(true);
    }, [])
  );


  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(false);
    setRefreshing(false);
  };

  const filtered = territories.filter((t) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    
    const matchesBeat = (t.area || '').toLowerCase().includes(query) ||
      (t.district || '').toLowerCase().includes(query) ||
      (t.state || '').toLowerCase().includes(query) ||
      (t.status || '').toLowerCase().includes(query);
      
    const assignedDocs = beatDetails[t.id]?.doctors || [];
    const assignedChems = beatDetails[t.id]?.chemists || [];
    
    const matchesDoc = assignedDocs.some(doc => doc.toLowerCase().includes(query));
    const matchesChem = assignedChems.some(chem => chem.toLowerCase().includes(query));
    
    return matchesBeat || matchesDoc || matchesChem;
  });

  const totalDoctors = territories.reduce((sum, t) => sum + (t.doctorsCount || 0), 0);
  const totalChemists = territories.reduce((sum, t) => sum + (t.chemistsCount || 0), 0);
  const activeBeatsCount = territories.filter(t => t.status === 'Active Beat').length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('Dashboard');
            }
          }}
        >
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Territory Beat List</Text>
        <Text style={styles.headerSubtitle}>View assigned operational areas & doctor coverage</Text>
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading assigned territories...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadData(true)}>
            <Text style={styles.retryButtonText}>Retry Loading</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Search */}
          {territories.length > 0 && (
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search territories, beats, states..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          )}

          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />
            }
          >
            {territories.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                {/* Territory Status Summary */}
                <View style={styles.topCard}>
                  <Text style={styles.topCardTitle}>Territory Status Summary</Text>
                  <View style={styles.topCardRow}>
                    <View style={styles.topCardStat}>
                      <Text style={styles.topCardLabel}>Active Territories</Text>
                      <Text style={styles.topCardValue}>{territories.length}</Text>
                    </View>
                    <View style={styles.topCardStat}>
                      <Text style={styles.topCardLabel}>Covered Today</Text>
                      <Text style={[styles.topCardValue, { color: '#059669' }]}>{coveredCount}</Text>
                    </View>
                    <View style={styles.topCardStat}>
                      <Text style={styles.topCardLabel}>Pending</Text>
                      <Text style={[styles.topCardValue, { color: '#D97706' }]}>{Math.max(0, territories.length - coveredCount)}</Text>
                    </View>
                  </View>
                  {assignedDate && assignedDate !== 'N/A' && (
                    <View style={styles.assignmentRow}>
                      <Text style={styles.assignmentText}>Assigned On: <Text style={{fontWeight: 'bold', color: '#334155'}}>{assignedDate}</Text></Text>
                    </View>
                  )}
                </View>

                {/* Distance & Map Button */}
                <View style={styles.topCardRowSpaceBetween}>
                  <View style={[styles.topCard, { flex: 1, marginRight: 8, padding: 16, alignItems: 'center' }]}>
                    <Text style={styles.topCardLabel}>Today's Distance</Text>
                    <Text style={[styles.topCardValue, { color: '#4F46E5', fontSize: 20, marginTop: 4 }]}>{trackedDistance}</Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={[styles.topCard, { flex: 1, marginLeft: 8, padding: 16, alignItems: 'center', backgroundColor: '#EEF2FF', borderColor: '#C7D2FE', borderWidth: 1 }]} 
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('TerritoryMap')}
                  >
                    <Ionicons name="map" size={24} color="#4F46E5" style={{ marginBottom: 4 }} />
                    <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#4F46E5', textAlign: 'center' }}>📍 View Territory Map</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {territories.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="map-outline" size={48} color="#94A3B8" />
                <Text style={styles.emptyText}>No territories assigned</Text>
                          <Text style={styles.emptySubText}>
                  Please contact your administrator.
                </Text>
              </View>
            ) : (
              <>
                {/* Headquarters Zone info */}
                <View style={styles.hqCard}>
                  <Text style={styles.hqTitle}>Headquarters Zone</Text>
                  <Text style={styles.hqValue}>{hqZone}</Text>
                </View>

                {/* Dashboard KPI cards */}
                <View style={styles.kpiRow}>
                  <View style={styles.kpiCard}>
                    <Text style={styles.kpiVal}>{territories.length}</Text>
                    <Text style={styles.kpiLabel}>Total Beats</Text>
                  </View>
                  <View style={styles.kpiCard}>
                    <Text style={[styles.kpiVal, { color: '#059669' }]}>{activeBeatsCount}</Text>
                    <Text style={styles.kpiLabel}>Active Beats</Text>
                  </View>
                  <View style={styles.kpiCard}>
                    <Text style={[styles.kpiVal, { color: '#06B6D4' }]}>{totalDoctors}</Text>
                    <Text style={styles.kpiLabel}>Doctors</Text>
                  </View>
                  <View style={styles.kpiCard}>
                    <Text style={[styles.kpiVal, { color: '#F59E0B' }]}>{totalChemists}</Text>
                    <Text style={styles.kpiLabel}>Chemists</Text>
                  </View>
                </View>

                <Text style={styles.sectionTitle}>Assigned Beat Routes</Text>
                {filtered.length > 0 ? (
                  filtered.map((t) => {
                    const isExpanded = expandedBeatId === t.id;
                    
                    // Dynamic stats computation for coverage
                    const loggedToday = todayVisits[t.area] || { doctors: 0, chemists: 0, docNames: [], chemNames: [] };
                    const totalVisitsCount = loggedToday.doctors + loggedToday.chemists;
                    const assignedCount = (t.doctorsCount || 0) + (t.chemistsCount || 0);
                    
                    // Calculate dynamic coverage pct directly from visited today vs total assigned today
                    const rawCoverage = assignedCount > 0 
                      ? Math.min(Math.round((totalVisitsCount / assignedCount) * 100), 100)
                      : 0;
                    const dynamicCoverage = isNaN(rawCoverage) ? 0 : rawCoverage;

                    const assignedDoctors = beatDetails[t.id]?.doctors || [];
                    const assignedChemists = beatDetails[t.id]?.chemists || [];

                    // Unified display list with visited status
                    const finalDoctors: { label: string; visited: boolean }[] = [];
                    assignedDoctors.forEach((doc: string) => {
                      const cleanDoc = String(doc || '').replace(/^Dr\.\s+/i, '').split('(')[0].trim().toLowerCase();
                      const isVisited = loggedToday.docNames.some((dName: string) => {
                        const cleanDName = String(dName || '').replace(/^Dr\.\s+/i, '').trim().toLowerCase();
                        return cleanDName.includes(cleanDoc) || cleanDoc.includes(cleanDName);
                      });
                      finalDoctors.push({
                        label: isVisited ? `${doc} (Visited Today)` : doc,
                        visited: isVisited
                      });
                    });
                    
                    // Add any extra doctors visited today who are not assigned
                    loggedToday.docNames.forEach((dName: string) => {
                      const cleanDName = String(dName || '').replace(/^Dr\.\s+/i, '').trim().toLowerCase();
                      const isAssigned = assignedDoctors.some((doc: string) => {
                        const cleanDoc = String(doc || '').replace(/^Dr\.\s+/i, '').split('(')[0].trim().toLowerCase();
                        return cleanDName.includes(cleanDoc) || cleanDoc.includes(cleanDName);
                      });
                      if (!isAssigned) {
                        const prefix = String(dName || '').toLowerCase().startsWith('dr.') ? '' : 'Dr. ';
                        finalDoctors.push({
                          label: `${prefix}${dName} (Visited Today - New)`,
                          visited: true
                        });
                      }
                    });

                    const finalChemists: { label: string; visited: boolean }[] = [];
                    assignedChemists.forEach((chem: string) => {
                      const cleanChem = String(chem || '').toLowerCase();
                      const isVisited = loggedToday.chemNames.some((cName: string) => {
                        const cleanCName = String(cName || '').trim().toLowerCase();
                        return cleanCName.includes(cleanChem) || cleanChem.includes(cleanCName);
                      });
                      finalChemists.push({
                        label: isVisited ? `${chem} (Visited Today)` : chem,
                        visited: isVisited
                      });
                    });

                    // Add any extra chemists visited today who are not assigned
                    loggedToday.chemNames.forEach((cName: string) => {
                      const cleanCName = String(cName || '').trim().toLowerCase();
                      const isAssigned = assignedChemists.some((chem: string) => {
                        const cleanChem = String(chem || '').toLowerCase();
                        return cleanCName.includes(cleanChem) || cleanChem.includes(cleanCName);
                      });
                      if (!isAssigned) {
                        finalChemists.push({
                          label: `${cName} (Visited Today - New)`,
                          visited: true
                        });
                      }
                    });

                    return (
                      <TouchableOpacity 
                        key={t.id} 
                        style={styles.territoryCard}
                        onPress={() => setExpandedBeatId(isExpanded ? null : t.id)}
                        activeOpacity={0.9}
                      >
                        <View style={styles.cardTop}>
                          <Text style={styles.areaName}>{t.area}</Text>
                          <Text style={[
                            styles.statusText,
                            { color: t.status === 'Active Beat' ? '#059669' : '#4F46E5' }
                          ]}>
                            ✅ {t.status}
                          </Text>
                        </View>

                        <Text style={styles.districtText}>District: {t.district}, {t.state}</Text>
                        
                        <View style={styles.extraDetails}>
                          <Text style={styles.detailText}>Last Activity: {t.lastActivity}</Text>
                          <Text style={styles.detailText}>{isExpanded ? 'Tap to close ▲' : 'Tap to expand ▼'}</Text>
                        </View>
                        
                        <View style={styles.divider} />

                        {/* Progress bar representing dynamic coverage */}
                        <View style={styles.progressContainer}>
                          <Text style={styles.progressLabel}>Coverage:</Text>
                          <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${dynamicCoverage}%` }]} />
                          </View>
                          <Text style={styles.progressPct}>{dynamicCoverage}%</Text>
                        </View>

                        {/* Performance Analytics metrics */}
                        <View style={styles.statsRow}>
                          <View style={styles.statBox}>
                            <Text style={styles.statNumber}>{t.doctorsCount}</Text>
                            <Text style={styles.statLabel}>Doctors</Text>
                          </View>
                          <View style={styles.statBox}>
                            <Text style={styles.statNumber}>{t.chemistsCount}</Text>
                            <Text style={styles.statLabel}>Chemists</Text>
                          </View>
                          
                          {totalVisitsCount > 0 && (
                            <View style={[styles.statBox, { marginLeft: 'auto' }]}>
                              <Text style={[styles.statNumber, { color: '#10B981' }]}>+{totalVisitsCount}</Text>
                              <Text style={styles.statLabel}>Today</Text>
                            </View>
                          )}
                        </View>

                        {/* Accordion dropdown detailing assigned doctors/chemists */}
                        {isExpanded && (
                          <View style={styles.expandedContent}>
                            <View style={styles.expandedSection}>
                              <Text style={styles.expandedTitle}>🩺 Assigned Doctors ({t.doctorsCount})</Text>
                              {finalDoctors.map((doc, idx) => (
                                <Text key={idx} style={[styles.expandedItem, doc.visited && { color: '#10B981', fontWeight: '600' }]}>
                                  • {doc.label}
                                </Text>
                              ))}
                            </View>
                            <View style={styles.expandedSection}>
                              <Text style={styles.expandedTitle}>💊 Assigned Chemists ({t.chemistsCount})</Text>
                              {finalChemists.map((chem, idx) => (
                                <Text key={idx} style={[styles.expandedItem, chem.visited && { color: '#10B981', fontWeight: '600' }]}>
                                  • {chem.label}
                                </Text>
                              ))}
                            </View>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>No territories found matching query.</Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </>
      )}
    </View>
  );
};

export default TerritoryTrackingScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: '#4F46E5',
    paddingTop: 64,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 56,
    zIndex: 10,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' },
  headerSubtitle: { fontSize: 12, color: '#E0E7FF', textAlign: 'center', marginTop: 6 },
  searchContainer: { paddingHorizontal: 20, marginTop: -18, zIndex: 10 },
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
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 60 },
  hqCard: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 16, 
    shadowColor: '#000', 
    shadowOpacity: 0.02, 
    shadowRadius: 2, 
    elevation: 1, 
    borderLeftWidth: 4, 
    borderLeftColor: '#4F46E5' 
  },
  hqTitle: { fontSize: 11, fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase' },
  hqValue: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginTop: 4 },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  kpiVal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  kpiLabel: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '600',
  },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#1E293B', marginBottom: 12 },
  territoryCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 2, elevation: 1, borderWidth: 1, borderColor: '#E2E8F0' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  areaName: { fontSize: 15, fontWeight: 'bold', color: '#1E293B' },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  districtText: { fontSize: 12, color: '#64748B', marginTop: 2 },
  extraDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  detailText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  progressLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  progressPct: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#10B981',
    minWidth: 28,
    textAlign: 'right',
  },
  statsRow: { flexDirection: 'row', gap: 20 },
  statBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statNumber: { fontSize: 13, fontWeight: 'bold', color: '#4F46E5' },
  statLabel: { fontSize: 11, color: '#64748B' },
  expandedContent: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 15,
    gap: 15,
  },
  expandedSection: {
    gap: 6,
  },
  expandedTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 2,
  },
  expandedItem: {
    fontSize: 12,
    color: '#64748B',
    paddingLeft: 6,
  },
  emptyCard: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 16, 
    padding: 32, 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 20
  },
  emptyText: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#334155', 
    marginTop: 12,
    textAlign: 'center'
  },
  emptySubText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
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
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // seedButton: {
  //   backgroundColor: '#4F46E5',
  //   paddingHorizontal: 24,
  //   paddingVertical: 12,
  //   borderRadius: 24,
  //   shadowColor: '#4F46E5',
  //   shadowOffset: { width: 0, height: 4 },
  //   shadowOpacity: 0.2,
  //   shadowRadius: 6,
  //   elevation: 3,
  // },
  // seedButtonText: {
  //   color: '#FFFFFF',
  //   fontSize: 14,
  //   fontWeight: 'bold',
  // },
  topCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  topCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
  },
  topCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  topCardStat: {
    alignItems: 'center',
    flex: 1,
  },
  topCardLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
    fontWeight: '500',
  },
  topCardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  assignmentRow: {
    paddingTop: 12,
    alignItems: 'center',
  },
  assignmentText: {
    fontSize: 12,
    color: '#64748B',
  },
  topCardRowSpaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
