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

  async getTodayStatus(): Promise<{
    isCheckedIn: boolean;
    isCheckedOut: boolean;
    activeRecord: AttendanceRecord | null;
    todayRecord: AttendanceRecord | null;
  }> {
    try {
      const response = await apiRequest<{ success: boolean; data: any }>('/attendance/status');
      if (response && response.success && response.data) {
        const d = response.data;
        const active = d.activeRecord ? {
          id: String(d.activeRecord.id),
          date: d.activeRecord.attendanceDate ? d.activeRecord.attendanceDate.split('T')[0] : new Date().toISOString().split('T')[0],
          repName: d.activeRecord.mr?.name || "User",
          checkInTime: d.activeRecord.checkInTime ? new Date(d.activeRecord.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-',
          checkOutTime: '-',
          status: 'Present',
          location: `Lat: ${d.activeRecord.checkInLatitude}, Lng: ${d.activeRecord.checkInLongitude}`,
          checkInDateTime: d.activeRecord.checkInTime,
          dayStatus: 'In-Progress'
        } as AttendanceRecord : null;

        const todayRec = d.todayRecord ? {
          id: String(d.todayRecord.id),
          date: d.todayRecord.attendanceDate ? d.todayRecord.attendanceDate.split('T')[0] : new Date().toISOString().split('T')[0],
          repName: d.todayRecord.mr?.name || "User",
          checkInTime: d.todayRecord.checkInTime ? new Date(d.todayRecord.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-',
          checkOutTime: d.todayRecord.checkOutTime ? new Date(d.todayRecord.checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-',
          status: 'Present',
          location: `Lat: ${d.todayRecord.checkInLatitude}, Lng: ${d.todayRecord.checkInLongitude}`,
          checkInDateTime: d.todayRecord.checkInTime,
          checkOutDateTime: d.todayRecord.checkOutTime,
          dayStatus: d.todayRecord.checkOutTime ? 'Completed' : 'In-Progress'
        } as AttendanceRecord : null;

        const checkinState = {
          checkedIn: d.isCheckedIn,
          user: active?.repName || todayRec?.repName || '',
          time: active?.checkInDateTime || todayRec?.checkInDateTime,
          checkedOut: d.isCheckedOut
        };
        localStorage.setItem(getCheckinKey(), JSON.stringify(checkinState));
        localStorage.setItem('today_checkin', JSON.stringify(checkinState));

        return {
          isCheckedIn: d.isCheckedIn,
          isCheckedOut: d.isCheckedOut,
          activeRecord: active,
          todayRecord: todayRec
        };
      }
    } catch (e) {
      console.warn("Failed to query live attendance status, checking local fallback:", e);
    }

    // Local fallback check
    const todayStr = new Date().toISOString().split('T')[0];
    const recs = this.getAll();
    const todayLog = recs.find(r => r.date === todayStr);
    const isCheckedIn = !!todayLog && (!todayLog.checkOutTime || todayLog.checkOutTime === '-');
    const isCheckedOut = !!todayLog && (!!todayLog.checkOutTime && todayLog.checkOutTime !== '-');

    return {
      isCheckedIn,
      isCheckedOut,
      activeRecord: isCheckedIn ? todayLog : null,
      todayRecord: todayLog || null
    };
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

  async loadAttendance(mrId?: number): Promise<AttendanceRecord[]> {
    try {
      const response = await apiRequest<{ success: boolean; data: any[] }>(`/attendance`);
      if (response.success && Array.isArray(response.data)) {
        const currentUser = authService.getCurrentUser();
        const effectiveMrId = mrId || (localStorage.getItem('mrId') ? Number(localStorage.getItem('mrId')) : undefined);
        const myAttendance = response.data.filter(r => {
          if (currentUser && currentUser.id) {
            return r.mr?.userId === currentUser.id || (effectiveMrId && Number(r.mrId) === Number(effectiveMrId));
          }
          return effectiveMrId ? Number(r.mrId) === Number(effectiveMrId) : true;
        });
        
        // Optimistic Merge: If the backend returns empty but we have local records, don't wipe everything instantly.
        // But for normal cases, map the data.
        const mappedRecords = myAttendance.map(r => {
          const checkIn = r.checkInTime ? new Date(r.checkInTime) : null;
          const checkOut = r.checkOutTime ? new Date(r.checkOutTime) : null;
          return {
            id: String(r.id),
            date: r.attendanceDate ? r.attendanceDate.split('T')[0] : new Date().toISOString().split('T')[0],
            repName: r.mr?.name || currentUser?.fullName || "Employee",
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
        localStorage.setItem('web_attendance_records', JSON.stringify(attendanceRecords));

        // Sync today_checkin logic
        const todayRecord = attendanceRecords.find(r => r.date === todayStr);
        if (todayRecord) {
          const checkedIn = todayRecord.dayStatus === 'In-Progress';
          const checkinPayload = {
            checkedIn,
            user: todayRecord.repName,
            time: todayRecord.checkInDateTime,
            checkedOut: todayRecord.dayStatus === 'Completed'
          };
          localStorage.setItem(getCheckinKey(), JSON.stringify(checkinPayload));
          localStorage.setItem('today_checkin', JSON.stringify(checkinPayload));
        } else {
          localStorage.removeItem(getCheckinKey());
          localStorage.removeItem('today_checkin');
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
      throw new Error(response.message || "Failed to check in");
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

    attendanceRecords = [mapped, ...attendanceRecords.filter(r => r.id !== mapped.id)];
    localStorage.setItem(getRecordsKey(), JSON.stringify(attendanceRecords));
    localStorage.setItem('web_attendance_records', JSON.stringify(attendanceRecords));
    const checkinState = {
      checkedIn: true,
      user: name,
      time: created.checkInTime
    };
    localStorage.setItem(getCheckinKey(), JSON.stringify(checkinState));
    localStorage.setItem('today_checkin', JSON.stringify(checkinState));

    window.dispatchEvent(new Event('attendanceUpdated'));
    return mapped;
  },

  async checkOut(id: string, lat: number, lng: number, location: string): Promise<AttendanceRecord> {
    const dbPayload = {
      checkOutTime: new Date().toISOString(),
      checkOutLatitude: lat,
      checkOutLongitude: lng
    };

    const checkoutUrl = id && id !== '0' && id !== 'undefined' ? `/attendance/checkout/${id}` : '/attendance/checkout/active';
    const response = await apiRequest<{ success: boolean; data: any }>(checkoutUrl, {
      method: 'PUT',
      bodyData: dbPayload
    });

    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to check out");
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

    attendanceRecords = attendanceRecords.map(r => (r.id === id || r.id === String(updated.id)) ? mapped : r);
    localStorage.setItem(getRecordsKey(), JSON.stringify(attendanceRecords));
    localStorage.setItem('web_attendance_records', JSON.stringify(attendanceRecords));
    const checkoutState = {
      checkedIn: false,
      user: mapped.repName,
      checkoutTime: updated.checkOutTime,
      checkedOut: true
    };
    localStorage.setItem(getCheckinKey(), JSON.stringify(checkoutState));
    localStorage.setItem('today_checkin', JSON.stringify(checkoutState));

    window.dispatchEvent(new Event('attendanceUpdated'));
    return mapped;
  }
};
