import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

export const getHospitals = async () => {
  const token = await AsyncStorage.getItem('@token');
  const response = await api.get('/hospitals', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const createHospital = async (
  name: string,
  mobile: string,
  address: string
) => {
  const token = await AsyncStorage.getItem('@token');
  const response = await api.post(
    '/hospitals',
    {
      name,
      mobile,
      address,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data.data || response.data;
};
