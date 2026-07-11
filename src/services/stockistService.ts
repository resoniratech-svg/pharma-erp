import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

export const getStockists = async () => {
  const token = await AsyncStorage.getItem('@token');
  const response = await api.get('/stockists', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const createStockist = async (
  name: string,
  mobile: string,
  address: string,
  code?: string
) => {
  const token = await AsyncStorage.getItem('@token');
  // Prisma requires a 'code' field — auto-generate if not provided
  const stockistCode = code || `STK-${name.slice(0, 3).toUpperCase().replace(/\s/g, '')}-${Date.now().toString().slice(-5)}`;
  const response = await api.post(
    '/stockists',
    {
      name,
      mobile,
      address,
      code: stockistCode,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data.data || response.data;
};
