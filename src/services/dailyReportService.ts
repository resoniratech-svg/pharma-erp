import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

export const createDailyReport = async (
  reportDate: string,
  doctorVisits: number,
  chemistVisits: number,
  samplesDistributed: number,
  ordersCollected: number,
  remarks: string,
  competitorActivity?: string,
  attendanceStatus?: string,
  checkInTime?: string,
  checkOutTime?: string,
  distanceTravelled?: number,
  followUpsCount?: number,
  territory?: string
) => {
  const token = await AsyncStorage.getItem('@token');
  const mrId = await AsyncStorage.getItem('@mrId');

  const response = await api.post(
    '/daily-reports',
    {
      mrId: Number(mrId),
      reportDate,
      doctorVisits,
      chemistVisits,
      samplesDistributed,
      ordersCollected,
      remarks,
      competitorActivity,
      attendanceStatus,
      checkInTime,
      checkOutTime,
      distanceTravelled,
      followUpsCount,
      territory,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export const getDailyReportsByMr = async () => {
  const token = await AsyncStorage.getItem('@token');
  const mrId = await AsyncStorage.getItem('@mrId');

  const response = await api.get(
    `/daily-reports/mr/${mrId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data.data || response.data;
};

export const getASMDailyReports = async () => {
  const token = await AsyncStorage.getItem('@token');
  const response = await api.get('/daily-reports/asm/team', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.data || response.data;
};

export const getRSMDailyReports = async () => {
  const token = await AsyncStorage.getItem('@token');
  const response = await api.get('/daily-reports/rsm/team', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.data || response.data;
};