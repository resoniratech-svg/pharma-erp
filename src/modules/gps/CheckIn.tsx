// import { MapPin, Navigation } from 'lucide-react';
// import {  PageHeader,  ActionButton,} from './components/shared';

// export default function CheckIn() {
//   return (
//     <div className="animate-in fade-in duration-500">
//       <PageHeader
//         title="Day Start / Check-In"
//         subtitle="Record your starting location and timestamp for the day."
//       />

//       <div className="max-w-xl mx-auto mt-8">
//         <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden p-8 text-center">
//             <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
//                 <Navigation className="w-10 h-10 text-emerald-600" />
//             </div>
            
//             <h2 className="text-2xl font-bold text-slate-900 mb-2">Ready to start your day?</h2>
//             <p className="text-slate-500 mb-8">Ensure your device GPS is enabled. Your current location will be recorded as your starting point.</p>
            
//             <div className="bg-slate-50 rounded-xl p-4 mb-8 flex items-center justify-center gap-3 text-slate-700">
//                 <MapPin className="w-5 h-5 text-slate-400" />
//                 <span className="font-medium">Fetching accurate location...</span>
//             </div>

//             <ActionButton className="w-full justify-center py-4 text-lg rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200">
//                 Confirm Check-In
//             </ActionButton>
//         </div>
//       </div>
//     </div>
//   );
// }
///////////////////////////////////////////////////////////////////////////////////


// import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router';
// import { MapPin, Navigation } from 'lucide-react';
// import { PageHeader, ActionButton } from './components/shared';

// export default function CheckIn() {
//   const navigate = useNavigate();
//   const [locationText, setLocationText] = useState('Fetching accurate location...');
//   const [isReady, setIsReady] = useState(false);
//   const [latLng, setLatLng] = useState<{lat: number, lng: number} | null>(null);

//   useEffect(() => {
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           const lat = position.coords.latitude;
//           const lng = position.coords.longitude;
//           setLocationText(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
//           setLatLng({ lat, lng });
//           setIsReady(true);
//         },
//         (_error) => {
//           setLocationText("Location access denied or failed.");
//           setIsReady(false);
//         },
//         { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
//       );
//     } else {
//       setLocationText("GPS not supported by your browser.");
//     }
//   }, []);

//   const handleCheckIn = () => {
//     if (!isReady || !latLng) return;

//     // 1. Get real logged-in user from storage
//     const authUserString = localStorage.getItem('authUser');
//     const authUser = authUserString ? JSON.parse(authUserString) : null;
//     const userName = authUser ? authUser.fullName : 'Medical Representative';

//     const now = new Date();
//     const todayDateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');

//     const existingData = localStorage.getItem('web_attendance_records');
//     const records = existingData ? JSON.parse(existingData) : [];

//     // 2. Prevent duplicate check-ins for today!
//     const alreadyCheckedIn = records.find((r: any) => r.date === todayDateStr && r.repName === userName);
//     if (alreadyCheckedIn) {
//       alert('You have already checked in today!');
//       navigate('/workspace/gps/attendance');
//       return;
//     }

//     // 3. Create Record using optimized "now" variable
//     const newRecord = {
//       id: crypto.randomUUID(),
//       date: todayDateStr,
//       repName: userName,
//       checkInDateTime: now.toISOString(),
//       checkInTime: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
//       checkOutTime: '-',
//       status: "Present", // Must stay 'status' for the Attendance.tsx table UI!
//       location: locationText,
//       latitude: latLng.lat,
//       longitude: latLng.lng,
//       createdAt: now.toISOString()
//     };

//     records.unshift(newRecord);
//     localStorage.setItem('web_attendance_records', JSON.stringify(records));

//     // 4. Save today_checkin to make Dashboard/CheckOut logic easy
//     localStorage.setItem(
//       'today_checkin',
//       JSON.stringify({
//           checkedIn: true,
//           user: userName,
//           time: now.toISOString()
//       })
//     );

//     alert('Checked in successfully!');
//     navigate('/workspace/gps/attendance');
//   };

//   return (
//     <div className="animate-in fade-in duration-500">
//       <PageHeader
//         title="Day Start / Check-In"
//         subtitle="Record your starting location and timestamp for the day."
//       />

//       <div className="max-w-xl mx-auto mt-8">
//         <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden p-8 text-center">
//             <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
//                 <Navigation className="w-10 h-10 text-emerald-600" />
//             </div>
            
//             <h2 className="text-2xl font-bold text-slate-900 mb-2">Ready to start your day?</h2>
//             <p className="text-slate-500 mb-8">Ensure your device GPS is enabled. Your current location will be recorded as your starting point.</p>
            
//             <div className="bg-slate-50 rounded-xl p-4 mb-8 flex items-center justify-center gap-3 text-slate-700">
//                 <MapPin className="w-5 h-5 text-slate-400" />
//                 <span className="font-medium">{locationText}</span>
//             </div>

//             <ActionButton 
//                 onClick={handleCheckIn}
//                 disabled={!isReady}
//                 className={`w-full justify-center py-4 text-lg rounded-xl shadow-emerald-200 ${!isReady ? 'bg-slate-400 hover:bg-slate-400 cursor-not-allowed opacity-70' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
//                 Confirm Check-In
//             </ActionButton>
//         </div>
//       </div>
//     </div>
//   );
// }

///////////////////////////////////////////////////////////////////////////
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router'; 
import { MapPin, Navigation } from 'lucide-react';
import { PageHeader, ActionButton } from './components/shared';
import { NotificationService } from '../../services/notificationService'; 
import { attendanceService } from '../../services/attendanceService'; 


export default function CheckIn() {
  const navigate = useNavigate();
  const [locationText, setLocationText] = useState('Fetching accurate location...');
  const [isReady, setIsReady] = useState(false);
  const [latLng, setLatLng] = useState<{lat: number, lng: number} | null>(null);
  const [records, setRecords] = useState<any[]>([]);

  const fetchLocation = () => {
    setLocationText('Fetching accurate location...');
    setIsReady(false);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLocationText(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
          setLatLng({ lat, lng });
          setIsReady(true);
        },
        (error) => {
          console.error("GPS Error:", error);
          if (error.code === 1 /* PERMISSION_DENIED */) {
            setLocationText("Location permission denied. Please allow GPS access.");
          } else if (error.code === 2 /* POSITION_UNAVAILABLE */) {
            setLocationText("Unable to determine your location.");
          } else if (error.code === 3 /* TIMEOUT */) {
            setLocationText("GPS request timed out.");
          } else {
            setLocationText("Failed to get location.");
          }
          setIsReady(false);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setLocationText("GPS not supported by your browser.");
      setIsReady(false);
    }
  };

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        let authUser = null;
        try {
          const authUserString = localStorage.getItem('authUser');
          authUser = authUserString ? JSON.parse(authUserString) : null;
        } catch { }
        
        let isManager = false;
        if (authUser) {
          const userRole = authUser.roleId || authUser.role;
          const managementRoles = ['SUPER_ADMIN', 'ADMIN', 'NATIONAL_SALES_HEAD', 'REGIONAL_SALES_MANAGER', 'AREA_SALES_MANAGER', 'National Sales Head', 'Regional Sales Manager', 'Area Sales Manager'];
          if (managementRoles.includes(userRole)) {
            isManager = true;
          }
        }

        const rawMrId = localStorage.getItem('mrId');
        
        if (!isManager && rawMrId) {
          const mrId = Number(rawMrId);
          const data = await attendanceService.loadAttendance(mrId);
          setRecords(data);
        } else {
          // Managers load from scoped localStorage
          const userId = authUser?.id || 'default';
          const scopedKey = `web_attendance_records_${userId}`;
          const stored = localStorage.getItem(scopedKey);
          if (stored) {
            setRecords(JSON.parse(stored));
          }
        }
      } catch (e) {
        console.error("Failed to load records on checkin mount:", e);
      }
    };
    fetchRecords();
    fetchLocation();
  }, []);

  const handleCheckIn = async () => {
    if (!isReady || !latLng) return;

    let authUser = null;
    try {
      const authUserString = localStorage.getItem('authUser');
      authUser = authUserString ? JSON.parse(authUserString) : null;
    } catch {
      authUser = null;
    }

    const userName = authUser?.fullName || authUser?.name || 'Medical Representative';
    const userId = authUser?.id || `USR-${Date.now()}`;

    const now = new Date();
    // Use ISO YYYY-MM-DD format (or map it exactly) for reliable comparison since loadAttendance returns ISO strings for date
    const todayDateStr = now.toISOString().split('T')[0];

    const activeSession = records.find((r: any) => {
      const recordDate = r.date; // already YYYY-MM-DD from service
      return recordDate === todayDateStr && (!r.checkOutTime || r.checkOutTime === '-');
    });

    const getRedirectPath = () => {
      try {
        const authUserStr = localStorage.getItem('authUser');
        if (authUserStr) {
          const authUser = JSON.parse(authUserStr);
          const role = authUser.roleId || authUser.role;
          if (role === 'NATIONAL_SALES_HEAD' || role === 'National Sales Head') return '/workspace/national-sales-head/attendance';
          if (role === 'REGIONAL_SALES_MANAGER' || role === 'Regional Sales Manager') return '/workspace/regional-sales-manager/attendance';
          if (role === 'AREA_SALES_MANAGER' || role === 'Area Sales Manager') return '/workspace/area-sales-manager/attendance';
        }
      } catch (e) {}
      return '/workspace/gps/attendance';
    };

    if (activeSession) {
      alert('You have already checked in today! Please check out first.');
      navigate(getRedirectPath());
      return;
    }

    try {
      const rawMrId = localStorage.getItem('mrId');
      const authUserStr = localStorage.getItem('authUser');
      const authUser = authUserStr ? JSON.parse(authUserStr) : null;
      
      let isManager = false;
      let mrId: number | null = null;
      if (rawMrId) {
        mrId = Number(rawMrId);
      } else if (authUser) {
        const userRole = authUser.roleId || authUser.role;
        const managementRoles = ['SUPER_ADMIN', 'ADMIN', 'NATIONAL_SALES_HEAD', 'REGIONAL_SALES_MANAGER', 'AREA_SALES_MANAGER', 'National Sales Head', 'Regional Sales Manager', 'Area Sales Manager'];
        if (managementRoles.includes(userRole)) {
          isManager = true;
        } else {
          alert('Your account is not linked to an MR profile. Please create an MR profile first.');
          return;
        }
      } else {
        alert('Your account is not linked to an MR profile. Please create an MR profile first.');
        return;
      }
      
      let newRecord: any = null;

      if (!isManager && mrId !== null) {
        // Real Backend Flow for MR
        const dbRecord = await attendanceService.checkIn(mrId, userName, latLng.lat, latLng.lng, locationText);
        newRecord = {
          id: String(dbRecord.id),
          userId: userId, 
          date: todayDateStr,
          repName: userName,
          checkInDateTime: now.toISOString(),
          checkInTime: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          checkOutTime: '-',
          status: "Present", 
          location: locationText,
          latitude: latLng.lat,
          longitude: latLng.lng,
          createdAt: now.toISOString(),
          dayStatus: 'In-Progress'
        };
      } else {
        // Scoped Local Storage Mock Flow for Managers
        newRecord = {
          id: crypto.randomUUID(),
          userId: userId, 
          date: todayDateStr,
          repName: userName,
          checkInDateTime: now.toISOString(),
          checkInTime: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          checkOutTime: '-',
          status: "Present", 
          location: locationText,
          latitude: latLng.lat,
          longitude: latLng.lng,
          createdAt: now.toISOString(),
          dayStatus: 'In-Progress'
        };
        const scopedKey = `web_attendance_records_${userId}`;
        const existingData = localStorage.getItem(scopedKey);
        const scopedRecords = existingData ? JSON.parse(existingData) : [];
        scopedRecords.unshift(newRecord);
        localStorage.setItem(scopedKey, JSON.stringify(scopedRecords));
      }

      localStorage.setItem(
        `today_checkin_${userId}`,
        JSON.stringify({
            checkedIn: true,
            user: userName,
            time: now.toISOString()
        })
      );

      alert('Checked in successfully!');
      navigate(getRedirectPath());
    } catch (e: any) {
      console.error(e);
      alert('Check-in failed: ' + e.message);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Day Start / Check-In"
        subtitle="Record your starting location and timestamp for the day."
      />

      <div className="max-w-xl mx-auto mt-8">
        <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden p-8 text-center">
            <div className="w-20 h-20 bg-[#163c78]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Navigation className="w-10 h-10 text-[#163c78]" />
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Ready to start your day?</h2>
            <p className="text-slate-500 mb-8">Ensure your device GPS is enabled. Your current location will be recorded as your starting point.</p>
            
            <div className="bg-slate-50 rounded-xl p-4 mb-8 flex flex-col items-center justify-center gap-2 text-slate-700">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-slate-400" />
                  <span className={`font-medium ${!isReady && locationText !== 'Fetching accurate location...' ? 'text-rose-500' : ''}`}>
                    {locationText}
                  </span>
                </div>
                
                {/* Error Resolution Buttons */}
                {!isReady && locationText !== 'Fetching accurate location...' && (
                  <div className="flex flex-col gap-3 mt-3">
                    <button onClick={fetchLocation} className="text-sm font-semibold text-[#163c78] hover:text-violet-700 underline transition-colors">
                      Retry GPS Connection
                    </button>
                    {/* ✅ DEV BYPASS: Click this if you are stuck testing! */}
                    <button 
                      onClick={() => {
                        setLocationText("Mock Location (Dev Bypass)");
                        setLatLng({ lat: 19.0760, lng: 72.8777 });
                        setIsReady(true);
                      }} 
                      className="text-xs text-slate-400 hover:text-slate-600 underline"
                    >
                      Use Mock Location (Dev Only)
                    </button>
                  </div>
                )}
            </div>

            <ActionButton 
                onClick={handleCheckIn}
                disabled={!isReady}
                className={`w-full justify-center py-4 text-lg rounded-xl shadow-sm ${!isReady ? 'opacity-50 cursor-not-allowed' : ''}`}>
                Confirm Check-In
            </ActionButton>
        </div>
      </div>
    </div>
  );
}