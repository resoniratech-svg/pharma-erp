import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

export const checkInAttendance = async (
  mrId: number,
  latitude: number,
  longitude: number
) => {
  const token = await AsyncStorage.getItem('@token');

  const response = await api.post(
    '/attendance/checkin',
    {
      mrId,
      checkInLatitude: latitude,
      checkInLongitude: longitude,
      status: 'PRESENT',
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export const checkOutAttendance = async (
  attendanceId: number,
  latitude: number,
  longitude: number
) => {
  const token = await AsyncStorage.getItem('@token');

  const response = await api.put(
    `/attendance/checkout/${attendanceId}`,
    {
      checkOutLatitude: latitude,
      checkOutLongitude: longitude,
      status: 'PRESENT',
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export const getAttendanceLogs = async () => {
  const token = await AsyncStorage.getItem('@token');
  const mrId = await AsyncStorage.getItem('@mrId');
  const response = await api.get(`/attendance/mr/${mrId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data.data || response.data;
};   


///////////////////////////////////////////////////////////////


// Local Timezone Safe Date Generator (IST Safe)
export const getLocalDateStr = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Live Backend Attendance Status Verifier
export const checkAttendanceStatus = async (): Promise<{
  isCheckedInToday: boolean;
  isCheckedOutToday: boolean;
}> => {
  const todayLocalStr = getLocalDateStr();
  
  // Call live Easypanel backend API
  const serverLogs = await getAttendanceLogs();
  const logsList = Array.isArray(serverLogs) ? serverLogs : (serverLogs?.data || []);

  let isCheckedInToday = false;
  let isCheckedOutToday = false;

  if (logsList && logsList.length > 0) {
    const todayLog = logsList.find((log: any) => {
      const rawDate = log.date || log.checkIn || log.checkInTime;
      if (!rawDate) return false;
      const logDateStr = getLocalDateStr(new Date(rawDate));
      return logDateStr === todayLocalStr;
    });

    if (todayLog) {
      const checkOut = todayLog.checkOut ?? todayLog.checkOutTime;
      // If checkOut contains a timestamp/value, duty is completed today
      if (checkOut && checkOut !== 'null' && checkOut !== 'NULL') {
        isCheckedOutToday = true;
        isCheckedInToday = false;
      } else {
        isCheckedInToday = true;
        isCheckedOutToday = false;
      }
    }
  }

  return { isCheckedInToday, isCheckedOutToday };
};