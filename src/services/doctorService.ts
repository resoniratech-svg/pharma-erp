import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

export const createDoctorVisit = async (
  doctorId: number,
  remarks: string,
  productsDiscussed: string,
  samplesGiven: number,
  latitude?: number,
  longitude?: number
) => {

  const token = await AsyncStorage.getItem('@token');
  const mrId = await AsyncStorage.getItem('@mrId');

  console.log('MR ID:', mrId);
console.log('Doctor ID:', doctorId);
console.log('Remarks:', remarks);
console.log('Products:', productsDiscussed);
console.log('Samples:', samplesGiven);

  const response = await api.post(
    '/doctor-visits',
    {
      mrId: Number(mrId),
      doctorId: Number(doctorId),
      remarks,
      productsDiscussed,
      samplesGiven,
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

export const getDoctors = async () => {
  const token = await AsyncStorage.getItem('@token');

  const response = await api.get(
    '/doctors',
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};