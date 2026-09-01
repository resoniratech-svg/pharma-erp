import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

export const getMyTeam = async () => {
  const token = await AsyncStorage.getItem('@token');
  const response = await api.get('/sales-organization/my-team', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data.data || response.data;
};

export const createEmployee = async (data: any) => {
  const token = await AsyncStorage.getItem('@token');
  const response = await api.post('/sales-organization/employees', data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
