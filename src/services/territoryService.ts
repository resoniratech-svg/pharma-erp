import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

export const getTerritoryBeats = async () => {
  const token = await AsyncStorage.getItem('@token');
  const response = await api.get('/territory/beats', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
