import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

export const createTourPlan = async (
  tourDate: string,
  territory: string,
  objective: string,
  doctorIds: number[],
  chemistIds: number[]
) => {

  const token = await AsyncStorage.getItem('@token');
  const mrId = await AsyncStorage.getItem('@mrId');

  const response = await api.post(
    '/tour-plans',
    {
      mrId: Number(mrId),
      tourDate,
      territory,
      objective,
      doctorIds,
      chemistIds,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};