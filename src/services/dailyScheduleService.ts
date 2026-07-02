import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

export const getTodaySchedule = async () => {
  const token = await AsyncStorage.getItem('@token');
  const mrId = await AsyncStorage.getItem('@mrId');

  const response = await api.get(
    `/tour-plans/mr/${mrId}/today`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data.data;
};