import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

export const createDailyReport = async (
  reportDate: string,
  doctorVisits: number,
  chemistVisits: number,
  samplesDistributed: number,
  ordersCollected: number,
  remarks: string
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
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};