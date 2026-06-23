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