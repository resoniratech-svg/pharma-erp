import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

export const getRetailers = async () => {
  const token = await AsyncStorage.getItem('@token');
  const response = await api.get('/retailers', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data.data || response.data;
};

export const createRetailer = async (name: string, mobile: string, address: string, stockistId: number) => {
  const token = await AsyncStorage.getItem('@token');
  const code = `RET${Date.now()}`;
  const response = await api.post(
    '/retailers',
    {
      name,
      mobile,
      address,
      stockistId: Number(stockistId),
      code,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data.data || response.data;
};
