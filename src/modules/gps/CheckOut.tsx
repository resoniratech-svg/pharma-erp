// import { MapPin, Flag } from 'lucide-react';
// import {
//   PageHeader,
//   ActionButton,
// } from './components/shared';

// export default function CheckOut() {
//   return (
//     <div className="animate-in fade-in duration-500">
//       <PageHeader
//         title="Day End / Check-Out"
//         subtitle="Record your ending location and timestamp for the day."
//       />

//       <div className="max-w-xl mx-auto mt-8">
//         <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden p-8 text-center">
//             <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
//                 <Flag className="w-10 h-10 text-rose-600" />
//             </div>
            
//             <h2 className="text-2xl font-bold text-slate-900 mb-2">Ready to end your day?</h2>
//             <p className="text-slate-500 mb-8">Ensure your DCR is submitted before checking out. Your current location will be recorded as your ending point.</p>
            
//             <div className="bg-slate-50 rounded-xl p-4 mb-8 flex flex-col gap-2 text-left">
//                 <div className="flex items-center justify-between text-sm">
//                     <span className="text-slate-500">Calls Logged:</span>
//                     <span className="font-semibold text-slate-900">12</span>
//                 </div>
//                  <div className="flex items-center justify-between text-sm">
//                     <span className="text-slate-500">POB Collected:</span>
//                     <span className="font-semibold text-slate-900">₹ 24,500</span>
//                 </div>
//                 <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-200 mt-2">
//                     <span className="text-slate-500 flex items-center gap-1"><MapPin className="w-4 h-4"/> Location:</span>
//                     <span className="font-semibold text-slate-700">Andheri East</span>
//                 </div>
//             </div>

//             <ActionButton className="w-full justify-center py-4 text-lg rounded-xl bg-rose-600 hover:bg-rose-700 shadow-rose-200">
//                 Confirm Check-Out
//             </ActionButton>
//         </div>
//       </div>
//     </div>
//   );
// }
   

////////////////////////////////////////////////////////////////////

// import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router';
// import { MapPin, Flag } from 'lucide-react';
// import { PageHeader, ActionButton } from './components/shared';

// export default function CheckOut() {
//   const navigate = useNavigate();
//   // State for fetching location
//   const [locationText, setLocationText] = useState('Fetching accurate location...');
//   const [isReady, setIsReady] = useState(false);
//   const [latLng, setLatLng] = useState<{lat: number, lng: number} | null>(null);

//   // 1. Fetch live Check-Out Coordinates
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

//   const handleCheckOut = () => {
//     if (!isReady || !latLng) return;

//     // Get current user
//     const authUserString = localStorage.getItem('authUser');
//     const authUser = authUserString ? JSON.parse(authUserString) : null;
//     const userName = authUser ? authUser.fullName : 'Medical Representative';

//     const now = new Date();
//     const todayDateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');

//     // 2. Load the Attendance Records array
//     const existingData = localStorage.getItem('web_attendance_records');
//     const records = existingData ? JSON.parse(existingData) : [];

//     // 3. Find the exact record created when the user Checked-In today
//     const recordIndex = records.findIndex((r: any) => r.date === todayDateStr && r.repName === userName);

//     // If they never checked in, stop them
//     if (recordIndex === -1) {
//       alert('You have not checked in today! Please Check-In first.');
//       navigate('/workspace/gps/check-in');
//       return;
//     }

//     // If they already checked out, stop them
//     if (records[recordIndex].checkOutTime && records[recordIndex].checkOutTime !== '-') {
//       alert('You have already checked out today!');
//       navigate('/workspace/gps/attendance');
//       return;
//     }

//     // 4. Update that exact record with Check-Out details
//     records[recordIndex].checkOutTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
//     records[recordIndex].checkOutDateTime = now.toISOString();
    
//     // Calculate Working Hours
//     if (records[recordIndex].checkInDateTime) {
//       const checkIn = new Date(records[recordIndex].checkInDateTime);
//       const diffMs = now.getTime() - checkIn.getTime();
//       const hours = Math.floor(diffMs / 3600000);
//       const minutes = Math.floor((diffMs % 3600000) / 60000);
      
//       records[recordIndex].workingHours = `${hours}h ${minutes}m`;
//       records[recordIndex].totalMinutes = Math.floor(diffMs / 60000); // Saves pure number for reports!
//     }

//     records[recordIndex].checkOutLocation = locationText;
//     records[recordIndex].checkOutLatitude = latLng.lat;
//     records[recordIndex].checkOutLongitude = latLng.lng;
    
//     // Instead of replacing "Present", add a new field:
//     records[recordIndex].dayStatus = "Completed";

//     // Save the updated array back to storage
//     localStorage.setItem('web_attendance_records', JSON.stringify(records));

//     // 5. Update today_checkin flag so the Dashboard knows they finished their day
//     localStorage.setItem(
//       'today_checkin',
//       JSON.stringify({
//         checkedIn: false,
//         user: userName,
//     //    time: now.toISOString(),
//         checkoutTime: now.toISOString()
//       })
//     );
    
//     alert('Checked out successfully!');
//     navigate('/workspace/gps/attendance');
//   };

//   return (
//     <div className="animate-in fade-in duration-500">
//       <PageHeader
//         title="Day End / Check-Out"
//         subtitle="Record your ending location and timestamp for the day."
//       />

//       <div className="max-w-xl mx-auto mt-8">
//         <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden p-8 text-center">
//             <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
//                 <Flag className="w-10 h-10 text-rose-600" />
//             </div>
            
//             <h2 className="text-2xl font-bold text-slate-900 mb-2">Ready to end your day?</h2>
//             <p className="text-slate-500 mb-8">Ensure your DCR is submitted before checking out. Your current location will be recorded as your ending point.</p>
            
//             <div className="bg-slate-50 rounded-xl p-4 mb-8 flex flex-col gap-2 text-left">
//                 {/* Dynamically show the Check-Out Location */}
//                 <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-200 mt-2">
//                     <span className="text-slate-500 flex items-center gap-1"><MapPin className="w-4 h-4"/> Location:</span>
//                     <span className="font-semibold text-slate-700">{locationText}</span>
//                 </div>
//             </div>

//             <ActionButton 
//                 onClick={handleCheckOut}
//                 disabled={!isReady}
//                 className={`w-full justify-center py-4 text-lg rounded-xl shadow-rose-200 ${!isReady ? 'bg-slate-400 hover:bg-slate-400 cursor-not-allowed opacity-70' : 'bg-rose-600 hover:bg-rose-700'}`}>
//                 Confirm Check-Out
//             </ActionButton>
//         </div>
//       </div>
//     </div>
//   );
// }

//////////////////////////////////////////////////////////////////


import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { MapPin, Flag } from 'lucide-react';
import { PageHeader, ActionButton } from './components/shared';

export default function CheckOut() {
  const navigate = useNavigate();
  const [locationText, setLocationText] = useState('Fetching accurate location...');
  const [isReady, setIsReady] = useState(false);
  const [latLng, setLatLng] = useState<{lat: number, lng: number} | null>(null);

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
          if (error.code === 1) {
            setLocationText("Location permission denied. Please allow GPS access.");
          } else if (error.code === 2) {
            setLocationText("Unable to determine your location.");
          } else if (error.code === 3) {
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
    fetchLocation();
  }, []);

  const handleCheckOut = () => {
    if (!isReady || !latLng) return;

    let authUser = null;
    try {
      const authUserString = localStorage.getItem('authUser');
      authUser = authUserString ? JSON.parse(authUserString) : null;
    } catch {
      authUser = null;
    }

    const userName = authUser?.fullName || authUser?.name || 'Medical Representative';

    const now = new Date();
    const todayDateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');

    const existingData = localStorage.getItem('web_attendance_records');
    const records = existingData ? JSON.parse(existingData) : [];

    const recordIndex = records.findIndex((r: any) => r.date === todayDateStr && r.repName === userName);

    if (recordIndex === -1) {
      alert('You have not checked in today! Please Check-In first.');
      navigate('/workspace/gps/check-in');
      return;
    }

    if (records[recordIndex].checkOutTime && records[recordIndex].checkOutTime !== '-') {
      alert('You have already checked out today!');
      navigate('/workspace/gps/attendance');
      return;
    }

    records[recordIndex].checkOutTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    records[recordIndex].checkOutDateTime = now.toISOString();
    
    if (records[recordIndex].checkInDateTime) {
      const checkIn = new Date(records[recordIndex].checkInDateTime);
      const diffMs = now.getTime() - checkIn.getTime();
      const hours = Math.floor(diffMs / 3600000);
      const minutes = Math.floor((diffMs % 3600000) / 60000);
      
      records[recordIndex].workingHours = `${hours}h ${minutes}m`;
      records[recordIndex].totalMinutes = Math.floor(diffMs / 60000);
    }

    records[recordIndex].checkOutLocation = locationText;
    records[recordIndex].checkOutLatitude = latLng.lat;
    records[recordIndex].checkOutLongitude = latLng.lng;
    records[recordIndex].dayStatus = "Completed";

    localStorage.setItem('web_attendance_records', JSON.stringify(records));

    localStorage.setItem(
      'today_checkin',
      JSON.stringify({
        checkedIn: false,
        user: userName,
        checkoutTime: now.toISOString()
      })
    );
    
    alert('Checked out successfully!');
    navigate('/workspace/gps/attendance');
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Day End / Check-Out"
        subtitle="Record your ending location and timestamp for the day."
      />

      <div className="max-w-xl mx-auto mt-8">
        <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden p-8 text-center">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Flag className="w-10 h-10 text-rose-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Ready to end your day?</h2>
            <p className="text-slate-500 mb-8">Ensure your DCR is submitted before checking out. Your current location will be recorded as your ending point.</p>
            
            <div className="bg-slate-50 rounded-xl p-4 mb-8 flex flex-col gap-2 text-left">
                <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-200 mt-2">
                    <span className="text-slate-500 flex items-center gap-1"><MapPin className="w-4 h-4"/> Location:</span>
                    <span className={`font-semibold ${!isReady && locationText !== 'Fetching accurate location...' ? 'text-rose-500' : 'text-slate-700'}`}>
                      {locationText}
                    </span>
                </div>
                
                {/* Error Resolution Buttons */}
                {!isReady && locationText !== 'Fetching accurate location...' && (
                  <div className="flex flex-col gap-3 mt-3 items-end">
                    <button onClick={fetchLocation} className="text-sm font-semibold text-rose-600 hover:text-rose-700 underline transition-colors">
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
                onClick={handleCheckOut}
                disabled={!isReady}
                className={`w-full justify-center py-4 text-lg rounded-xl shadow-sm ${!isReady ? 'opacity-50 cursor-not-allowed' : ''}`}>
                Confirm Check-Out
            </ActionButton>
        </div>
      </div>
    </div>
  );
}