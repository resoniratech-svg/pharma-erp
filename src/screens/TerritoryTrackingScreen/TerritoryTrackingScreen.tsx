import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import React, { useState, useCallback } from 'react';
import { getTerritoryBeats } from '../../services/territoryService';
import { getDoctors } from '../../services/doctorService';
import { getChemists } from '../../services/chemistService';
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
      setHqZone(userObj?.hq || userObj?.headquarters || 'Hyderabad');

      // 3. Load Beats from backend or fall back to mock beats
      let serverBeats = [];
      try {
        const beatRes = await getTerritoryBeats();
        serverBeats = beatRes.data || beatRes || [];
      } catch (e) {
        console.log('Beats load error from server:', e);
      }

      const activeTerritories: BeatTerritory[] = serverBeats.length > 0 ? serverBeats.map((b: any, idx: number) => ({
        id: b.id?.toString() || `beat-${idx}`,
        area: b.area || 'Unknown Area',
        district: b.district || 'Hyderabad',
        state: b.state || 'Telangana',
        doctorsCount: b.doctorsCount || 0,
        chemistsCount: b.chemistsCount || 0,
        coverage: b.coverage || 80,
        lastActivity: b.lastActivity || 'Today',
        status: b.status || 'Active Beat'
      })) : [
        { id: 'beat-1', area: 'Koti & Abids Beat', district: 'Hyderabad', state: 'Telangana', doctorsCount: 15, chemistsCount: 18, coverage: 85, lastActivity: 'Yesterday', status: 'Active Beat' },
        { id: 'beat-2', area: 'Secunderabad Beat', district: 'Hyderabad', state: 'Telangana', doctorsCount: 12, chemistsCount: 15, coverage: 70, lastActivity: 'Today', status: 'Active Beat' },
        { id: 'beat-3', area: 'Nampally Beat', district: 'Hyderabad', state: 'Telangana', doctorsCount: 10, chemistsCount: 12, coverage: 90, lastActivity: 'Yesterday', status: 'Active Beat' },
        { id: 'beat-4', area: 'Himayatnagar Beat', district: 'Hyderabad', state: 'Telangana', doctorsCount: 8, chemistsCount: 8, coverage: 60, lastActivity: '2 days ago', status: 'Secondary Beat' }
      ];

      // 4. Load actual logged visits today to compute dynamic stats
      const docVisitsData = await AsyncStorage.getItem('@doctor_visits');
      const chemistVisitsData = await AsyncStorage.getItem('@chemist_visits');
      
      const docVisits = safeJsonParse(docVisitsData, []);
      const chemVisits = safeJsonParse(chemistVisitsData, []);

      const todayStr = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');

      // Helper to match dates safely across Android/iOS/Web and different formats
      const isSameDay = (item: any, targetDateStr: string): boolean => {
        try {
          const val = item.date || item.visitDate || item.timestamp || item.id;
          if (!val) return false;
          
          if (typeof val === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(val)) {
            return val === targetDateStr;
          }
          
          let ts = typeof val === 'number' ? val : Number(val);
          if (isNaN(ts) && typeof val === 'string') {
            const match = val.match(/\d{10,13}/);
            if (match) ts = Number(match[0]);
          }
          
          if (isNaN(ts) || ts <= 0) return false;
          
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

      // 5. Group the real doctors and chemists dynamically into the beats details mapping
      const resolvedDetails: { [key: string]: { doctors: string[]; chemists: string[] } } = {};
      
      activeTerritories.forEach((t: BeatTerritory, index: number) => {
        // Find doctors belonging to this beat (fallback to index modulo if beat string doesn't match)
        const doctorsInBeat = docs
          .filter((d: any, dIdx: number) => {
            const dBeat = (d.beat || '').toLowerCase().trim();
            const tArea = t.area.toLowerCase().trim();
            if (dBeat) return dBeat.includes(tArea) || tArea.includes(dBeat);
            return dIdx % activeTerritories.length === index;
          })
          .map((d: any) => d.doctorName || d.name);

        const chemistsInBeat = chems
          .filter((c: any, cIdx: number) => {
            const cBeat = (c.beat || '').toLowerCase().trim();
            const tArea = t.area.toLowerCase().trim();
            if (cBeat) return cBeat.includes(tArea) || tArea.includes(cBeat);
            return cIdx % activeTerritories.length === index;
          })
          .map((c: any) => c.name || c.chemistName || c.shopName);

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
          docNames: matchedDocs.map((v: any) => v.doctorName || 'Unknown Doctor'),
          chemNames: matchedChems.map((v: any) => v.shopName || 'Unknown Shop'),
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

      // Calculate traversed distance dynamically based on visits coordinates
      let distSum = 0;
      let prevLat = 17.3850; // Hyderabad center as default HQ lat
      let prevLon = 78.4867; // Hyderabad center as default HQ lon
      
      const allTodayVisits = [...todayDocs, ...todayChems];
      let hasCoordinates = false;

      allTodayVisits.forEach((visit: any) => {
        if (visit.latitude && visit.longitude) {
          distSum += calculateDistance(prevLat, prevLon, visit.latitude, visit.longitude);
          prevLat = visit.latitude;
          prevLon = visit.longitude;
          hasCoordinates = true;
        }
      });

      if (hasCoordinates) {
        setTrackedDistance(`${distSum.toFixed(1)} KM`);
      } else {
        // Fetch from GPS movement tracking log key
        try {
          const todayString = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
          const gpsKey = `@gps_movement_${todayString}`;
          const gpsDataRaw = await AsyncStorage.getItem(gpsKey);
          const gpsLogs = gpsDataRaw ? JSON.parse(gpsDataRaw) : [];

          if (gpsLogs && gpsLogs.length > 0) {
            let dist = 0;
            for (let i = 0; i < gpsLogs.length - 1; i++) {
              dist += calculateDistance(
                gpsLogs[i].latitude, gpsLogs[i].longitude,
                gpsLogs[i + 1].latitude, gpsLogs[i + 1].longitude
              );
            }
            setTrackedDistance(`${dist.toFixed(1)} KM`);
          } else {
            setTrackedDistance('0.0 KM');
          }
        } catch {
          setTrackedDistance('0.0 KM');
        }
      }
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
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
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
                  <View style={styles.assignmentRow}>
                    <Text style={styles.assignmentText}>Assigned On: <Text style={{fontWeight: 'bold', color: '#334155'}}>{(() => {
                      const d = new Date();
                      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                      return `01-${months[d.getMonth()]}-${d.getFullYear()}`;
                    })()}</Text></Text>
                  </View>
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
                      const cleanDoc = doc.replace(/^Dr\.\s+/i, '').split('(')[0].trim().toLowerCase();
                      const isVisited = loggedToday.docNames.some((dName: string) => {
                        const cleanDName = dName.replace(/^Dr\.\s+/i, '').trim().toLowerCase();
                        return cleanDName.includes(cleanDoc) || cleanDoc.includes(cleanDName);
                      });
                      finalDoctors.push({
                        label: isVisited ? `${doc} (Visited Today)` : doc,
                        visited: isVisited
                      });
                    });
                    
                    // Add any extra doctors visited today who are not assigned
                    loggedToday.docNames.forEach((dName: string) => {
                      const cleanDName = dName.replace(/^Dr\.\s+/i, '').trim().toLowerCase();
                      const isAssigned = assignedDoctors.some((doc: string) => {
                        const cleanDoc = doc.replace(/^Dr\.\s+/i, '').split('(')[0].trim().toLowerCase();
                        return cleanDName.includes(cleanDoc) || cleanDoc.includes(cleanDName);
                      });
                      if (!isAssigned) {
                        const prefix = dName.toLowerCase().startsWith('dr.') ? '' : 'Dr. ';
                        finalDoctors.push({
                          label: `${prefix}${dName} (Visited Today - New)`,
                          visited: true
                        });
                      }
                    });

                    const finalChemists: { label: string; visited: boolean }[] = [];
                    assignedChemists.forEach((chem: string) => {
                      const cleanChem = chem.toLowerCase();
                      const isVisited = loggedToday.chemNames.some((cName: string) => {
                        const cleanCName = cName.trim().toLowerCase();
                        return cleanCName.includes(cleanChem) || cleanChem.includes(cleanCName);
                      });
                      finalChemists.push({
                        label: isVisited ? `${chem} (Visited Today)` : chem,
                        visited: isVisited
                      });
                    });

                    // Add any extra chemists visited today who are not assigned
                    loggedToday.chemNames.forEach((cName: string) => {
                      const cleanCName = cName.trim().toLowerCase();
                      const isAssigned = assignedChemists.some((chem: string) => {
                        const cleanChem = chem.toLowerCase();
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
                              <Text style={styles.expandedTitle}>≡ƒ⌐║ Assigned Doctors ({t.doctorsCount})</Text>
                              {finalDoctors.map((doc, idx) => (
                                <Text key={idx} style={[styles.expandedItem, doc.visited && { color: '#10B981', fontWeight: '600' }]}>
                                  ΓÇó {doc.label}
                                </Text>
                              ))}
                            </View>
                            <View style={styles.expandedSection}>
                              <Text style={styles.expandedTitle}>≡ƒÆè Assigned Chemists ({t.chemistsCount})</Text>
                              {finalChemists.map((chem, idx) => (
                                <Text key={idx} style={[styles.expandedItem, chem.visited && { color: '#10B981', fontWeight: '600' }]}>
                                  ΓÇó {chem.label}
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
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' },
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
