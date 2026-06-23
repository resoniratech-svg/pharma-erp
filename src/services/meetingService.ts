import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

export const createMeeting = async (
  data: any
) => {

  const token =
    await AsyncStorage.getItem('@token');

  const response =
    await api.post(
      '/meetings',
      data,
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

  return response.data.data;
};
export const getMeetingsByMr =
  async () => {

    const token =
      await AsyncStorage.getItem('@token');

    const mrId =
      await AsyncStorage.getItem('@mrId');

    const response =
      await api.get(
        `/meetings/mr/${mrId}`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

    return response.data.data;
  };
  export const completeMeeting =
  async (id: number) => {

    const token =
      await AsyncStorage.getItem('@token');

    return api.patch(
      `/meetings/${id}/complete`,
      {},
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );
  };
  export const cancelMeeting =
  async (id: number) => {

    const token =
      await AsyncStorage.getItem('@token');

    return api.patch(
      `/meetings/${id}/cancel`,
      {},
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );
  };