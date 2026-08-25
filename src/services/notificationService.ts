import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

export const getAllNotifications = async () => {
  const token = await AsyncStorage.getItem('@token');
  const response = await api.get('/notification', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.data || response.data;
};

export const markAsRead = async (id: number) => {
  const token = await AsyncStorage.getItem('@token');
  const response = await api.patch(`/notification/${id}/read`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
