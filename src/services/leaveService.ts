import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

export const createLeaveRequest = async (
  leaveType: string,
  fromDate: string,
  toDate: string,
  reason: string
) => {

  const token = await AsyncStorage.getItem('@token');
  const mrId = await AsyncStorage.getItem('@mrId');

  const response = await api.post(
    '/leaves',
    {
      mrId: Number(mrId),
      leaveType,
      fromDate,
      toDate,
      reason,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export const getLeavesByMr = async () => {

  const token =
    await AsyncStorage.getItem('@token');

  const mrId =
    await AsyncStorage.getItem('@mrId');

  const response =
    await api.get(
      `/leaves/mr/${mrId}`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

  return response.data.data;
};