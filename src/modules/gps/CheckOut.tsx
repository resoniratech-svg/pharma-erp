import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { MapPin, Flag } from 'lucide-react';
import { PageHeader, ActionButton } from './components/shared';
import { attendanceService } from '../../services/attendanceService';

// ✅ Helper to match dates in any format (ISO: YYYY-MM-DD or Local: DD-MMM-YYYY)
const isTodayDate = (dateStr: string): boolean => {
  if (!dateStr) return false;
  const today = new Date();
  const yyyy  = today.getFullYear();
  const mm    = String(today.getMonth() + 1).padStart(2, '0');
  const dd    = String(today.getDate()).padStart(2, '0');
  
  const isoDate = `${yyyy}-${mm}-${dd}`;
  const slashDate = `${dd}/${mm}/${yyyy}`;
  const dashDate = `${dd}-${mm}-${yyyy}`;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const formattedDate = `${dd}-${months[today.getMonth()]}-${yyyy}`;
  
  return (
    dateStr.includes(isoDate) ||
    dateStr.includes(slashDate) ||
    dateStr.includes(dashDate) ||
    dateStr.includes(formattedDate) ||
    dateStr === today.toDateString()
  );
};

export default function CheckOut() {
  const navigate = useNavigate();
  const [locationText, setLocationText] = useState('Fetching accurate location...');
  const [isReady, setIsReady] = useState(false);
  const [latLng, setLatLng] = useState<{lat: number, lng: number} | null>(null);

  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState({
    docsCount: 0,
    chemistsCount: 0,
    ordersCount: 0,
    reportSubmitted: false,
    hours: '0h 0m'
  });

  const getMRName = () => {
    let authUser = null;
    try {
      const authUserString = localStorage.getItem('authUser');
      authUser = authUserString ? JSON.parse(authUserString) : null;
    } catch {
      authUser = null;
    }
    return authUser?.fullName || authUser?.name || 'Medical Representative';
  };

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

  const [records, setRecords] = useState<any[]>([]);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const rawMrId = localStorage.getItem('mrId');
        if (!rawMrId) {
          setRecords([]);
          return;
        }
        const mrId = Number(rawMrId);
        const data = await attendanceService.loadAttendance(mrId);
        setRecords(data);
      } catch (e) {
        console.error("Failed to load records on checkout mount:", e);
        const stored = localStorage.getItem('web_attendance_records');
        if (stored) setRecords(JSON.parse(stored));
      }
    };
    fetchRecords();
    fetchLocation();
  }, []);

  const handleCheckOut = async () => {
    if (!isReady || !latLng) return;

    const userName = getMRName();
    const now = new Date();
    const todayDateStr = now.toISOString().split('T')[0];

    const recordIndex = records.findIndex((r: any) => r.date === todayDateStr);

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

    try {
      const todayRecord = records[recordIndex];
      await attendanceService.checkOut(String(todayRecord.id), latLng.lat, latLng.lng, locationText);

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

      // Backend handles database storage, so we don't need localStorage 'web_attendance_records' here anymore.

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
    } catch (e: any) {
      console.error(e);
      alert('Checkout failed: ' + e.message);
    }
  };

  const handleOpenSummary = () => {
    const userName = getMRName();
    const now = new Date();
    const todayDateStr = now.toISOString().split('T')[0];

    // Retrieve records
    let storedDocs = [];
    let storedChemists = [];
    let storedOrders = [];
    let storedReports = [];
    try {
      storedDocs = JSON.parse(localStorage.getItem('doctor_visits') || '[]');
      storedChemists = JSON.parse(localStorage.getItem('chemist_visits') || '[]');
      storedOrders = JSON.parse(localStorage.getItem('web_orders') || '[]');
      storedReports = JSON.parse(localStorage.getItem('web_daily_reports') || '[]');
    } catch (e) {
      console.error(e);
    }

    // ✅ Uses the date helper to match date formats correctly
    const todayDocs = storedDocs.filter((d: any) => d.mrName === userName && isTodayDate(d.visitDate));
    const todayChemists = storedChemists.filter((c: any) => c.mrName === userName && isTodayDate(c.visitDate));
    const todayOrders = storedOrders.filter((o: any) => o.mrName === userName && (isTodayDate(o.date) || isTodayDate(o.orderDate)));
    const todayReport = storedReports.find((r: any) => r.mrName === userName && isTodayDate(r.date));

    let workingHoursText = '0h 0m';
    const record = records.find((r: any) => r.date === todayDateStr && r.repName === userName);
    if (record && record.checkInDateTime) {
      const checkIn = new Date(record.checkInDateTime);
      const diffMs = Date.now() - checkIn.getTime();
      const hours = Math.floor(diffMs / 3600000);
      const minutes = Math.floor((diffMs % 3600000) / 60000);
      workingHoursText = `${hours}h ${minutes}m`;
    }

    setSummaryData({
      docsCount: todayDocs.length,
      chemistsCount: todayChemists.length,
      ordersCount: todayOrders.length,
      reportSubmitted: !!todayReport,
      hours: workingHoursText
    });
    
    setShowSummary(true);
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
                onClick={handleOpenSummary}
                disabled={!isReady}
                className={`w-full justify-center py-4 text-lg rounded-xl shadow-sm ${!isReady ? 'opacity-50 cursor-not-allowed' : ''}`}>
                Verify & Check-Out
            </ActionButton>

            {/* Today's Work Summary Modal */}
            {showSummary && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-xl animate-in zoom-in duration-200">
                  <h3 className="text-lg font-extrabold text-slate-900 mb-2 border-b border-slate-100 pb-3">Today's Work Summary</h3>
                  
                  <div className="space-y-3.5 my-5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Doctor Visits Logged:</span>
                      <span className="font-bold text-slate-800">{summaryData.docsCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Chemist Visits Logged:</span>
                      <span className="font-bold text-slate-800">{summaryData.chemistsCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Order Bookings:</span>
                      <span className="font-bold text-slate-800">{summaryData.ordersCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Daily Report Status:</span>
                      <span className={`font-bold ${summaryData.reportSubmitted ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {summaryData.reportSubmitted ? 'Submitted ✓' : 'Pending ✗'}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-slate-100 pt-3">
                      <span className="text-slate-500 font-medium">Active Shift Hours:</span>
                      <span className="font-bold text-indigo-600">{summaryData.hours}</span>
                    </div>
                  </div>

                  {/* Validation warning message */}
                  {(!summaryData.reportSubmitted || (summaryData.docsCount + summaryData.chemistsCount + summaryData.ordersCount === 0)) && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 text-xs mb-5 font-medium">
                      ⚠️ Some daily activities or report submissions are missing. You can still check out, but please verify before confirming.
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button 
                      onClick={() => setShowSummary(false)} 
                      className="flex-1 py-2.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-bold transition-colors"
                    >
                      Go Back
                    </button>
                    <button 
                      onClick={() => {
                        setShowSummary(false);
                        handleCheckOut();
                      }} 
                      className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold transition-colors"
                    >
                      Confirm Check-Out
                    </button>
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}