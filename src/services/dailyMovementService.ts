import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

export const getDailyMovement = async (
  date: string
) => {

    console.log('DATE SENT TO API:', date);

  const token =
    await AsyncStorage.getItem('@token');

  const mrId =
    await AsyncStorage.getItem('@mrId');

  const response =
    await api.get(
      `/daily-movement/mr/${mrId}/date/${date}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

  return response.data.data;
};