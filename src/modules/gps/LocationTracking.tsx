import { useState, useEffect } from 'react';
import { SearchInput, PageHeader, FilterBar } from './components/shared';
import { Crosshair, MapPin, Calendar, Clock, Navigation } from 'lucide-react';
import { ROLE_SUPER_ADMIN, ROLE_MEDICAL_REPRESENTATIVE } from '../../constants/roles';

interface ActiveRep {
  id: string;
  repName: string;
  checkInTime: string;
  checkOutTime?: string;
  location: string;
  lat: number;
  lng: number;
  lastUpdated: string;
  isCheckedOut: boolean;
  routePoints?: Array<{
    lat: number;
    lng: number;
    title: string;
    time: string;
    type: 'checkin' | 'doctor' | 'chemist' | 'checkout';
  }>;
}

// ✅ Safe Date Normalization Helper
const isTodayDate = (dateStr: string): boolean => {
  if (!dateStr) return false;
  const today = new Date();
  const yyyy  = today.getFullYear();
  const mm    = String(today.getMonth() + 1).padStart(2, '0');
  const dd    = String(today.getDate()).padStart(2, '0');
  const isoToday  = `${yyyy}-${mm}-${dd}`;
  const slashToday  = `${dd}/${mm}/${yyyy}`;
  const months    = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const formattedToday = `${dd}-${months[today.getMonth()]}-${yyyy}`;
  
  return (
    dateStr.includes(isoToday)       ||
    dateStr.includes(slashToday)     ||
    dateStr.includes(formattedToday) ||
    dateStr === today.toDateString()
  );
};

export default function LocationTracking() {
  const [search, setSearch] = useState('');
  const [activeReps, setActiveReps] = useState<ActiveRep[]>([]);
  const [selectedRepId, setSelectedRepId] = useState<string | null>(null);

  const activeRole = localStorage.getItem('activeRole') || ROLE_SUPER_ADMIN;
  const isMr = activeRole === ROLE_MEDICAL_REPRESENTATIVE;
  const authUser = JSON.parse(localStorage.getItem('authUser') || 'null');
  const displayName = authUser?.fullName || 'Medical Representative';

  // ✅ Haversine Formula to calculate distance between coordinates in km
  const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // ✅ Helper to compile Route Statistics for a selected Rep
  const getSelectedRepStats = (rep: ActiveRep) => {
    if (!rep.routePoints || rep.routePoints.length === 0) {
      return { distance: '0.0 km', stops: 0, timeOnField: '0h 0m' };
    }

    // 1. Calculate cumulative distance
    let totalDist = 0;
    for (let i = 0; i < rep.routePoints.length - 1; i++) {
      const p1 = rep.routePoints[i];
      const p2 = rep.routePoints[i + 1];
      totalDist += calculateHaversineDistance(p1.lat, p1.lng, p2.lat, p2.lng);
    }

    // 2. Count stops (doctors + chemists)
    const stopsCount = rep.routePoints.filter(p => p.type === 'doctor' || p.type === 'chemist').length;

    // 3. Calculate time on field
    const parseTimeToMinutes = (timeStr: string) => {
      if (!timeStr) return 0;
      const [time, modifier] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };

    const startTime = parseTimeToMinutes(rep.checkInTime);
    const lastPointTime = rep.routePoints[rep.routePoints.length - 1].time;
    const endTime = rep.isCheckedOut && rep.checkOutTime ? parseTimeToMinutes(rep.checkOutTime) : parseTimeToMinutes(lastPointTime);
    
    const diffMins = Math.max(0, endTime - startTime);
    const h = Math.floor(diffMins / 60);
    const m = diffMins % 60;

    return {
      distance: `${totalDist.toFixed(1)} km`,
      stops: stopsCount,
      timeOnField: `${h}h ${m}m`
    };
  };

  const loadActiveReps = () => {
    let attendanceData = [];
    let storedDocs = [];
    let storedChemists = [];

    try {
      attendanceData = JSON.parse(localStorage.getItem('web_attendance_records') || '[]');
      storedDocs = JSON.parse(localStorage.getItem('doctor_visits') || '[]');
      storedChemists = JSON.parse(localStorage.getItem('chemist_visits') || '[]');
    } catch (error) {
      console.error("Failed to load records from localStorage:", error);
    }

    // ✅ Load all checked-in reps for today (even if checked out, so we can see completed routes)
    let activeToday = attendanceData.filter((a: any) => isTodayDate(a.date));

    if (isMr) {
      activeToday = activeToday.filter((a: any) => a.repName === displayName);
    }

    const mappedReps: ActiveRep[] = activeToday.map((a: any, idx: number) => {
      const repName = a.repName;
      const baseLat = a.latitude ? parseFloat(a.latitude) : 19.0760;
      const baseLng = a.longitude ? parseFloat(a.longitude) : 72.8777;
      const checkInTime = a.checkInTime || '09:00 AM';
      const isCheckedOut = a.checkOutTime && a.checkOutTime !== '-';

      const routePoints: ActiveRep['routePoints'] = [
        {
          lat: baseLat,
          lng: baseLng,
          title: 'Checked In HQ',
          time: checkInTime,
          type: 'checkin'
        }
      ];

      const todayDocs = storedDocs.filter((d: any) =>
        d.mrName === repName && isTodayDate(d.visitDate)
      );

      const todayChemists = storedChemists.filter((c: any) =>
        c.mrName === repName && isTodayDate(c.visitDate)
      );

      let lastActivityDesc = isCheckedOut ? `Checked Out at ${a.checkOutTime}` : `Checked In at ${checkInTime}`;
      let lastActivityTime = checkInTime;
      let currentLat = baseLat;
      let currentLng = baseLng;
      let currentLocation = a.location || 'HQ Office';

      const parseTime = (timeStr: string) => {
        if (!timeStr) return 0;
        const [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
        return hours * 60 + minutes;
      };

      // ✅ Added Deterministic offsets instead of Math.random()
      todayDocs.forEach((d: any, dIdx: number) => {
        const visitLat = d.latitude ? parseFloat(d.latitude) : baseLat + (dIdx + 1) * 0.002;
        const visitLng = d.longitude ? parseFloat(d.longitude) : baseLng + (dIdx + 1) * 0.002;
        const visitTime = d.time || '10:00 AM';

        routePoints.push({
          lat: visitLat,
          lng: visitLng,
          title: `Visited Doctor: Dr. ${d.doctorName}`,
          time: visitTime,
          type: 'doctor'
        });

        if (!isCheckedOut && parseTime(visitTime) > parseTime(lastActivityTime)) {
          lastActivityTime = visitTime;
          lastActivityDesc = `Visited Dr. ${d.doctorName} at ${visitTime}`;
          currentLat = visitLat;
          currentLng = visitLng;
          currentLocation = d.clinic || d.location || 'Doctor Clinic';
        }
      });

      todayChemists.forEach((c: any, cIdx: number) => {
        const visitLat = c.latitude ? parseFloat(c.latitude) : baseLat - (cIdx + 1) * 0.002;
        const visitLng = c.longitude ? parseFloat(c.longitude) : baseLng - (cIdx + 1) * 0.002;
        const visitTime = c.time || '11:00 AM';

        routePoints.push({
          lat: visitLat,
          lng: visitLng,
          title: `Visited Chemist: ${c.shopName}`,
          time: visitTime,
          type: 'chemist'
        });

        if (!isCheckedOut && parseTime(visitTime) > parseTime(lastActivityTime)) {
          lastActivityTime = visitTime;
          lastActivityDesc = `Visited ${c.shopName} at ${visitTime}`;
          currentLat = visitLat;
          currentLng = visitLng;
          currentLocation = c.location || 'Chemist Shop';
        }
      });

      // Sort points chronologically
      routePoints.sort((x, y) => parseTime(x.time) - parseTime(y.time));

      // ✅ Append Check-out to the end of the route points list if applicable
      if (isCheckedOut) {
        const checkOutLat = a.checkOutLatitude ? parseFloat(a.checkOutLatitude) : currentLat + 0.003;
        const checkOutLng = a.checkOutLongitude ? parseFloat(a.checkOutLongitude) : currentLng + 0.003;
        
        routePoints.push({
          lat: checkOutLat,
          lng: checkOutLng,
          title: 'Checked Out',
          time: a.checkOutTime,
          type: 'checkout'
        });
        
        currentLat = checkOutLat;
        currentLng = checkOutLng;
        currentLocation = a.checkOutLocation || 'Checkout Location';
      }

      return {
        id: a.id || a.userId || `${repName}-${idx}`,
        repName,
        checkInTime,
        checkOutTime: a.checkOutTime,
        location: currentLocation,
        lat: currentLat,
        lng: currentLng,
        lastUpdated: lastActivityDesc,
        isCheckedOut,
        routePoints
      };
    });

    setActiveReps(mappedReps);
  };

  useEffect(() => {
    loadActiveReps();
    const interval = setInterval(loadActiveReps, 10000);
    return () => clearInterval(interval);
  }, []);

  // ✅ Live Map Integration using Open-Source Leaflet
  useEffect(() => {
    // Inject Leaflet CSS
    if (!document.getElementById('leaflet-css-cdn')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css-cdn';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const initMap = () => {
      const L = (window as any).L;
      if (!L) return;

      const mapContainer = document.getElementById('leaflet-live-rep-map');
      if (!mapContainer) return;

      // Reset previous map reference to avoid re-initialization errors
      const container = mapContainer as HTMLElement & { _leaflet_id?: any };
      if (container._leaflet_id) {
        container.innerHTML = '';
        container._leaflet_id = null;
      }

      let centerLat = 19.0760;
      let centerLng = 72.8777;
      let zoom = 5;

      const selectedRep = activeReps.find(r => r.id === selectedRepId);
      if (selectedRep) {
        centerLat = selectedRep.lat;
        centerLng = selectedRep.lng;
        zoom = 13;
      } else if (activeReps.length > 0) {
        centerLat = activeReps[0].lat;
        centerLng = activeReps[0].lng;
        zoom = 11;
      }

      const map = L.map('leaflet-live-rep-map').setView([centerLat, centerLng], zoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      // Plot markers for each active representative
      activeReps.forEach(rep => {
        const isSelected = rep.id === selectedRepId;
        const color = isSelected ? '#10b981' : rep.isCheckedOut ? '#94a3b8' : '#6366f1';

        const marker = L.circleMarker([rep.lat, rep.lng], {
          color: color,
          fillColor: color,
          fillOpacity: 0.8,
          radius: isSelected ? 10 : 8
        }).addTo(map);

        marker.bindPopup(`
          <div style="font-family: Inter, sans-serif; font-size: 12px; line-height: 1.4;">
            <b style="font-size: 13px; color: #1e293b;">${rep.repName}</b> ${rep.isCheckedOut ? '(Checked Out)' : ''}<br/>
            <span style="color: #64748b;"><b>Location:</b> ${rep.location}</span><br/>
            <span style="color: #4f46e5;"><b>Activity:</b> ${rep.lastUpdated}</span>
          </div>
        `);

        if (isSelected) {
          marker.openPopup();

          // ✅ Draw Route History Polyline connecting all visit nodes for selected rep
          if (rep.routePoints && rep.routePoints.length > 0) {
            const coords: any[] = [];
            rep.routePoints.forEach((point, pIdx) => {
              coords.push([point.lat, point.lng]);

              let pColor = '#3b82f6'; // check-in
              if (point.type === 'doctor') pColor = '#a855f7'; // doctor visit
              if (point.type === 'chemist') pColor = '#10b981'; // chemist visit
              if (point.type === 'checkout') pColor = '#ef4444'; // checkout

              L.circleMarker([point.lat, point.lng], {
                color: pColor,
                fillColor: pColor,
                fillOpacity: 0.9,
                radius: 6
              }).addTo(map)
                .bindPopup(`
                  <div style="font-family: Inter, sans-serif; font-size: 11px;">
                    <b>Step ${pIdx + 1}: ${point.title}</b><br/>
                    <b>Time:</b> ${point.time}
                  </div>
                `);
            });

            if (coords.length > 1) {
              L.polyline(coords, {
                color: '#6366f1',
                weight: 3,
                dashArray: '5, 8',
                opacity: 0.8
              }).addTo(map);
            }
          }
        }
      });
    };

    if ((window as any).L) {
      initMap();
    } else {
      let script = document.getElementById('leaflet-js-cdn') as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.id = 'leaflet-js-cdn';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = initMap;
        document.head.appendChild(script);
      } else {
        script.addEventListener('load', initMap);
      }
    }
  }, [selectedRepId, activeReps]);

  // ✅ Search by both Representative Name and Location (Area/City)
  const filteredReps = activeReps.filter(rep =>
    rep.repName.toLowerCase().includes(search.toLowerCase()) ||
    rep.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-in fade-in duration-500 min-h-[calc(100vh-140px)] flex flex-col">
      <PageHeader
        title="Daily Movement Tracking"
        subtitle="Real-time GPS tracking of active field representatives."
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by representative name or location..." />
      </FilterBar>

      <div className="flex-1 bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden relative flex items-center justify-center min-h-[600px] mt-2">
         <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-multiply" />
         
         {/* Live Map Panel */}
         <div id="leaflet-live-rep-map" className="absolute inset-0 z-10 w-full h-full" />

         {/* Sidebar Overlay */}
         <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-slate-100 w-72 max-h-[85%] overflow-y-auto z-20">
            <h4 className="font-bold text-slate-800 text-sm mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
               Active Reps 
               <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs ml-auto">{filteredReps.length}</span>
            </h4>

            {/* ✅ Live Route Statistics Card when a rep is selected */}
            {selectedRepId && (() => {
              const rep = activeReps.find(r => r.id === selectedRepId);
              if (!rep) return null;
              const stats = getSelectedRepStats(rep);
              return (
                <div className="mb-4 bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2 animate-in slide-in-from-top duration-300">
                  <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Route Stats</span>
                    <button onClick={() => setSelectedRepId(null)} className="text-[10px] text-slate-400 font-semibold lowercase hover:text-slate-600">clear zoom</button>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-center">
                    <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold">Distance</p>
                      <p className="text-xs font-extrabold text-slate-800 mt-0.5">{stats.distance}</p>
                    </div>
                    <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold">Stops</p>
                      <p className="text-xs font-extrabold text-slate-800 mt-0.5">{stats.stops}</p>
                    </div>
                    <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold">Field Time</p>
                      <p className="text-xs font-extrabold text-slate-800 mt-0.5">{stats.timeOnField}</p>
                    </div>
                  </div>
                </div>
              );
            })()}
            
            {filteredReps.length > 0 ? (
                <div className="space-y-3">
                    {filteredReps.map((rep) => (
                        <div 
                          key={rep.id} 
                          onClick={() => setSelectedRepId(rep.id)}
                          className={`flex gap-3 p-2 rounded-lg transition-all cursor-pointer border ${
                            selectedRepId === rep.id
                              ? 'bg-indigo-50/50 border-indigo-200 shadow-sm'
                              : 'bg-transparent border-transparent hover:bg-slate-50 hover:border-slate-100'
                          }`}
                        >
                            <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${
                              rep.isCheckedOut 
                                ? 'bg-slate-400' 
                                : 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                            }`} />
                            <div>
                                <div className="text-sm font-bold text-slate-900">{rep.repName}</div>
                                <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1 mt-1">
                                    <MapPin className="w-3 h-3 text-slate-400"/> {rep.location}
                                </div>
                                <div className="text-[10px] font-bold text-indigo-500 mt-1.5 bg-indigo-50 inline-block px-1.5 py-0.5 rounded">
                                    {rep.lastUpdated}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-6">
                    <Crosshair className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-500 leading-relaxed">
                        {search ? 'No active reps match your search.' : 'No reps are currently checked in today.'}
                    </p>
                </div>
            )}
         </div>

         {/* Selection Prompt Overlay */}
         {!selectedRepId && activeReps.length > 0 && (
           <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-sm px-4 py-2.5 rounded-lg shadow-md border border-slate-100 flex items-center gap-2">
             <Navigation className="w-4 h-4 text-indigo-600 animate-bounce" />
             <span className="text-xs font-semibold text-slate-700">Select a representative from the list to view today's active route path.</span>
           </div>
         )}
      </div>
    </div>
  );
}