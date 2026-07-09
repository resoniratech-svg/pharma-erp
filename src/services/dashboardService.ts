import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

export const getMrDashboardAnalytics = async () => {
  const token = await AsyncStorage.getItem('@token');
  const mrId = await AsyncStorage.getItem('@mrId');
  
  const response = await api.get(`/analytics/mr/${mrId}/dashboard`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  return response.data.data || response.data;
};
