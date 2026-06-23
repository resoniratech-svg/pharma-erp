import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

export const createChemist = async (
  chemistName: string,
  mobile: string,
  address: string
) => {

  const token =
    await AsyncStorage.getItem('@token');

  const chemistCode =
    `CHM${Date.now()}`;

  const response =
    await api.post(
      '/chemists',
      {
        chemistCode,
        name: chemistName,
        mobile,
        address,
      },
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

  return response.data.data;
};

export const findChemistByMobile = async (
  mobile: string
) => {

  const token =
    await AsyncStorage.getItem('@token');

  const response =
    await api.get(
      '/chemists',
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

  const chemists =
    response.data.data;

  const existingChemist =
    chemists.find(
      (c: any) =>
        c.mobile === mobile
    );

  return existingChemist || null;
};

export const createChemistVisit = async (
  chemistId: number,
  remarks: string,
  productsDiscussed: string,
  orderValue: number,
  latitude?: number,
  longitude?: number
) => {

  const token = await AsyncStorage.getItem('@token');
  const mrId = await AsyncStorage.getItem('@mrId');

  const response = await api.post(
    '/chemist-visits',
    {
      mrId: Number(mrId),
      chemistId: Number(chemistId),
      remarks,
      productsDiscussed,
      orderValue,
      latitude,
      longitude,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export const getChemists = async () => {

  const token =
    await AsyncStorage.getItem('@token');

  const response =
    await api.get(
      '/chemists',
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

  return response.data;
};