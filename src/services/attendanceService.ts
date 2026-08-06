import { apiRequest } from './apiClient';
import { authService } from './authService';

export interface AttendanceRecord {
  id: string;
  date: string;
  repName: string;
  checkInTime: string;
  checkOutTime: string;
  status: 'Present' | 'Absent' | 'Half Day' | 'Leave';
  location: string;
  latitude?: number;
  longitude?: number;
  checkInDateTime?: string;
  checkOutDateTime?: string;
  dayStatus?: 'In-Progress' | 'Completed' | 'Pending Checkout' | 'Auto Closed';
  checkOutLocation?: string;
  checkOutLatitude?: number;
  checkOutLongitude?: number;
}

let attendanceRecords: AttendanceRecord[] = [];

const getUserPrefix = () => {
  const user = authService.getCurrentUser();
  return user ? user.id : 'default';
};

const getRecordsKey = () => `web_attendance_records_${getUserPrefix()}`;
const getCheckinKey = () => `today_checkin_${getUserPrefix()}`;

try {
  const stored = localStorage.getItem(getRecordsKey());
  if (stored) {
    attendanceRecords = JSON.parse(stored);
  }
} catch (e) {
  console.error("Failed to parse cached attendance records:", e);
}

export const attendanceService = {
  getAll(): AttendanceRecord[] {
    return attendanceRecords;
  },

  async loadAllAttendance(): Promise<AttendanceRecord[]> {
    try {
      const response = await apiRequest<{ success: boolean; data: any[] }>(`/attendance`);
      if (response.success && Array.isArray(response.data)) {
        const mappedRecords = response.data.map(r => {
          const checkIn = r.checkInTime ? new Date(r.checkInTime) : null;
          const checkOut = r.checkOutTime ? new Date(r.checkOutTime) : null;
          return {
            id: String(r.id),
            date: r.attendanceDate ? r.attendanceDate.split('T')[0] : new Date().toISOString().split('T')[0],
            repName: r.mr?.name || "Medical Representative",
            checkInTime: checkIn ? checkIn.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-',
            checkOutTime: checkOut ? checkOut.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-',
            status: 'Present',
            location: checkIn ? `Lat: ${r.checkInLatitude}, Lng: ${r.checkInLongitude}` : 'N/A',
            latitude: r.checkInLatitude || undefined,
            longitude: r.checkInLongitude || undefined,
            checkInDateTime: r.checkInTime || undefined,
            checkOutDateTime: r.checkOutTime || undefined,
            dayStatus: checkOut ? 'Completed' : 'In-Progress',
            checkOutLatitude: r.checkOutLatitude || undefined,
            checkOutLongitude: r.checkOutLongitude || undefined,
          } as AttendanceRecord;
        });
        
        return mappedRecords;
      }
    } catch (e) {
      console.error("Failed to load all attendance from backend:", e);
    }
    return [];
  },

  async loadAttendance(mrId: number): Promise<AttendanceRecord[]> {
    try {
      const response = await apiRequest<{ success: boolean; data: any[] }>(`/attendance`);
      if (response.success && Array.isArray(response.data)) {
        const currentUser = authService.getCurrentUser();
        const myAttendance = response.data.filter(r => {
          if (currentUser && currentUser.id) {
            return r.mr?.userId === currentUser.id || Number(r.mrId) === Number(mrId);
          }
          return Number(r.mrId) === Number(mrId);
        });
        
        // Optimistic Merge: If the backend returns empty but we have local records, don't wipe everything instantly.
        // But for normal cases, map the data.
        const mappedRecords = myAttendance.map(r => {
          const checkIn = r.checkInTime ? new Date(r.checkInTime) : null;
          const checkOut = r.checkOutTime ? new Date(r.checkOutTime) : null;
          return {
            id: String(r.id),
            date: r.attendanceDate ? r.attendanceDate.split('T')[0] : new Date().toISOString().split('T')[0],
            repName: r.mr?.name || "Medical Representative",
            checkInTime: checkIn ? checkIn.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-',
            checkOutTime: checkOut ? checkOut.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-',
            status: 'Present',
            location: checkIn ? `Lat: ${r.checkInLatitude}, Lng: ${r.checkInLongitude}` : 'N/A',
            latitude: r.checkInLatitude || undefined,
            longitude: r.checkInLongitude || undefined,
            checkInDateTime: r.checkInTime || undefined,
            checkOutDateTime: r.checkOutTime || undefined,
            dayStatus: checkOut ? 'Completed' : 'In-Progress',
            checkOutLatitude: r.checkOutLatitude || undefined,
            checkOutLongitude: r.checkOutLongitude || undefined,
          };
        });

        const todayStr = new Date().toISOString().split('T')[0];
        const localToday = attendanceRecords.find(r => r.date === todayStr);
        const mappedToday = mappedRecords.find(r => r.date === todayStr);

        if (localToday && !mappedToday) {
          // Optimistic Merge logic: keep local today record if backend lost it momentarily or mocked for managers
          attendanceRecords = [localToday, ...mappedRecords];
        } else {
          attendanceRecords = mappedRecords;
        }
        
        localStorage.setItem(getRecordsKey(), JSON.stringify(attendanceRecords));

        // Sync today_checkin logic
        const todayRecord = attendanceRecords.find(r => r.date === todayStr);
        if (todayRecord) {
          const checkedIn = todayRecord.dayStatus === 'In-Progress';
          localStorage.setItem(getCheckinKey(), JSON.stringify({
            checkedIn,
            user: todayRecord.repName,
            time: todayRecord.checkInDateTime,
            checkedOut: todayRecord.dayStatus === 'Completed'
          }));
        } else {
          localStorage.removeItem(getCheckinKey());
        }
      }
    } catch (e) {
      console.error("Failed to load attendance from backend:", e);
    }
    return attendanceRecords;
  },

  async checkIn(mrId: number, name: string, lat: number, lng: number, location: string): Promise<AttendanceRecord> {
    const dbPayload = {
      mrId,
      attendanceDate: new Date().toISOString(),
      checkInTime: new Date().toISOString(),
      checkInLatitude: lat,
      checkInLongitude: lng,
      status: "PRESENT"
    };

    const response = await apiRequest<{ success: boolean; data: any }>('/attendance/checkin', {
      method: 'POST',
      bodyData: dbPayload
    });

    if (!response.success || !response.data) {
      throw new Error("Failed to check in");
    }

    const created = response.data;
    const mapped: AttendanceRecord = {
      id: String(created.id),
      date: created.attendanceDate ? created.attendanceDate.split('T')[0] : new Date().toISOString().split('T')[0],
      repName: created.mr?.name || name,
      checkInTime: new Date(created.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      checkOutTime: '-',
      status: 'Present',
      location: location,
      latitude: lat,
      longitude: lng,
      checkInDateTime: created.checkInTime,
      dayStatus: 'In-Progress'
    };

    attendanceRecords = [mapped, ...attendanceRecords];
    localStorage.setItem('web_attendance_records', JSON.stringify(attendanceRecords));
    localStorage.setItem('today_checkin', JSON.stringify({
      checkedIn: true,
      user: name,
      time: created.checkInTime
    }));

    return mapped;
  },

  async checkOut(id: string, lat: number, lng: number, location: string): Promise<AttendanceRecord> {
    const dbPayload = {
      checkOutTime: new Date().toISOString(),
      checkOutLatitude: lat,
      checkOutLongitude: lng
    };

    const response = await apiRequest<{ success: boolean; data: any }>(`/attendance/checkout/${id}`, {
      method: 'PUT',
      bodyData: dbPayload
    });

    if (!response.success || !response.data) {
      throw new Error("Failed to check out");
    }

    const updated = response.data;
    const checkIn = updated.checkInTime ? new Date(updated.checkInTime) : null;
    const checkOut = new Date(updated.checkOutTime);
    const mapped: AttendanceRecord = {
      id: String(updated.id),
      date: updated.attendanceDate ? updated.attendanceDate.split('T')[0] : new Date().toISOString().split('T')[0],
      repName: updated.mr?.name || "Medical Representative",
      checkInTime: checkIn ? checkIn.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-',
      checkOutTime: checkOut.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      status: 'Present',
      location: location,
      latitude: updated.checkInLatitude || undefined,
      longitude: updated.checkInLongitude || undefined,
      checkInDateTime: updated.checkInTime || undefined,
      checkOutDateTime: updated.checkOutTime,
      dayStatus: 'Completed',
      checkOutLatitude: lat,
      checkOutLongitude: lng,
      checkOutLocation: location
    };

    attendanceRecords = attendanceRecords.map(r => r.id === id ? mapped : r);
    localStorage.setItem('web_attendance_records', JSON.stringify(attendanceRecords));
    localStorage.setItem('today_checkin', JSON.stringify({
      checkedIn: false,
      user: mapped.repName,
      checkoutTime: updated.checkOutTime,
      checkedOut: true
    }));

    return mapped;
  }
};
