import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

export const getFollowUpsByMr = async () => {

  const token =
    await AsyncStorage.getItem('@token');

  const mrId =
    await AsyncStorage.getItem('@mrId');

  const response =
    await api.get(
      `/follow-ups/mr/${mrId}`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

  return response.data.data;
};

export const completeFollowUp =
  async (id: number) => {

    const token =
      await AsyncStorage.getItem('@token');

    return api.patch(
      `/follow-ups/${id}/complete`,
      {},
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );
};

export const cancelFollowUp =
  async (id: number) => {

    const token =
      await AsyncStorage.getItem('@token');

    return api.patch(
      `/follow-ups/${id}/cancel`,
      {},
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );
};

export const createFollowUp = async (
  data: any
) => {

  const token =
    await AsyncStorage.getItem('@token');

  const response =
    await api.post(
      '/follow-ups',
      data,
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

  return response.data;
};

export const getAllFollowUps = async () => {

  const token =
    await AsyncStorage.getItem('@token');

  const response =
    await api.get(
      '/follow-ups',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

  return response.data.data;
};