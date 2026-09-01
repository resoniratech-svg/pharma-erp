import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

export const createChemist = async (
  chemistName: string,
  shopName: string,
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
        name: shopName || chemistName,
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

  return response.data.data || response.data;
};

export const findChemistByMobile = async (
  mobile: string,
  shopName?: string
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

  const chemists = response.data.data || response.data || [];
  const chemistsArray = Array.isArray(chemists) ? chemists : [];

  const existingChemist =
    chemistsArray.find(
      (c: any) =>
        String(c.mobile).trim() === String(mobile).trim()
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

  console.log('MR ID:', mrId);
console.log('CHEMIST ID:', chemistId);
console.log('LATITUDE:', latitude);
console.log('LONGITUDE:', longitude);

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

  console.log("POST RESPONSE");
  console.log(response.data);

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

export const getChemistVisitsByMr = async () => {
  const token = await AsyncStorage.getItem('@token');
  const mrId = await AsyncStorage.getItem('@mrId');
  if (!mrId || mrId === 'null' || mrId === 'undefined') return [];
  const response = await api.get(`/chemist-visits/mr/${mrId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data.data || response.data;
};

export const updateChemistVisit = async (
  visitId: string | number,
  chemistId: number,
  remarks: string,
  productsDiscussed: string,
  orderValue: number,
  latitude?: number,
  longitude?: number
) => {
  const token = await AsyncStorage.getItem('@token');
  const mrId = await AsyncStorage.getItem('@mrId');
  const response = await api.put(
    `/chemist-visits/${visitId}`,
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

export const updateChemist = async (
  id: number | string,
  name: string,
  mobile: string,
  address: string
) => {
  const token = await AsyncStorage.getItem('@token');
  const response = await api.put(
    `/chemists/${id}`,
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
  return response.data;
};