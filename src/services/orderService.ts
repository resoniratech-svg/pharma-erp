import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

export const createRetailerOrder = async (orderPayload: {
  retailerId: number;
  totalAmount: number;
  orderItems: Array<{
    productId: number;
    quantity: number;
    rate: number;
    amount: number;
  }>;
}) => {
  const token = await AsyncStorage.getItem('@token');
  const response = await api.post('/retailer-orders', orderPayload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data.data || response.data;
};

export const getRetailerOrders = async () => {
  const token = await AsyncStorage.getItem('@token');
  const response = await api.get('/retailer-orders', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data.data || response.data;
};
