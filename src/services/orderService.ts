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

export const updateRetailerOrder = async (id: number, orderPayload: any) => {
  const token = await AsyncStorage.getItem('@token');
  const response = await api.put(`/retailer-orders/${id}`, orderPayload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data.data || response.data;
};

export const deleteRetailerOrder = async (id: number) => {
  const token = await AsyncStorage.getItem('@token');
  const response = await api.delete(`/retailer-orders/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data.data || response.data;
};
