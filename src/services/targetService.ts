import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

export const getTargetsByMr = async () => {
  const token = await AsyncStorage.getItem('@token');
  const mrId = await AsyncStorage.getItem('@mrId');
  const response = await api.get(`/targets/mr/${mrId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.data;
};

export const getASMTargetSummary = async () => {
  const token = await AsyncStorage.getItem('@token');
  const response = await api.get('/target-allocation/asm-summary', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.data || response.data;
};

export const allocateTarget = async (data: any) => {
  const token = await AsyncStorage.getItem('@token');
  const response = await api.post('/target-allocation/allocate', data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};