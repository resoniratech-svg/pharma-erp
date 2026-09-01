import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

export const getMrDashboardAnalytics = async () => {
  const token = await AsyncStorage.getItem('@token');
  const mrId = await AsyncStorage.getItem('@mrId');
  
  if (!mrId || mrId === 'null' || mrId === 'undefined') return [];
  const response = await api.get(`/analytics/mr/${mrId}/dashboard`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  return response.data.data || response.data;
};

export const getASMDashboard = async () => {
  const token = await AsyncStorage.getItem('@token');
  const response = await api.get('/dashboard/asm', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.data || response.data;
};

export const getRSMDashboard = async () => {
  const token = await AsyncStorage.getItem('@token');
  const response = await api.get('/dashboard/rsm', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.data || response.data;
};
