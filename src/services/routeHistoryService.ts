import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

export const getRouteHistory = async (
  date: string
) => {

  const token =
    await AsyncStorage.getItem('@token');

  const mrId =
    await AsyncStorage.getItem('@mrId');

    console.log(
  'ROUTE URL:',
  `/route-history/mr/${mrId}/date/${date}`
);

  const response =
    await api.get(
      `/route-history/mr/${mrId}/date/${date}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

  return response.data.data;
};