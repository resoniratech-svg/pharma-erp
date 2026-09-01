import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

export const createTourPlan = async (
  tourDate: string,
  territory: string,
  objective: string,
  doctorIds: any[],
  chemistIds: any[],
  area: string,
  beat: string,
  planType: string,
  startTime: string,
  endTime: string,
  remarks: string
) => {

  const token = await AsyncStorage.getItem('@token');
  const mrId = await AsyncStorage.getItem('@mrId');

  const response = await api.post(
    '/tour-plans',
    {
      mrId: Number(mrId),
      tourDate,
      territory,
      objective,
      doctorIds,
      chemistIds,
      area,
      beat,
      planType,
      startTime,
      endTime,
      remarks,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export const updateTourPlan = async (
  planId: number | string,
  tourDate: string,
  territory: string,
  objective: string,
  doctorIds: any[],
  chemistIds: any[],
  area: string,
  beat: string,
  planType: string,
  startTime: string,
  endTime: string,
  remarks: string
) => {
  const token = await AsyncStorage.getItem('@token');
  const mrId = await AsyncStorage.getItem('@mrId');

  const response = await api.put(
    `/tour-plans/${planId}`,
    {
      mrId: Number(mrId),
      tourDate,
      territory,
      objective,
      doctorIds,
      chemistIds,
      area,
      beat,
      planType,
      startTime,
      endTime,
      remarks,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export const deleteTourPlan = async (planId: number | string) => {
  const token = await AsyncStorage.getItem('@token');
  const response = await api.delete(`/tour-plans/${planId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const updateTourPlanStatus = async (planId: number | string, status: string) => {
  const token = await AsyncStorage.getItem('@token');
  const response = await api.patch(
    `/tour-plans/${planId}/status`,
    { status },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const getTourPlansByMr = async () => {
  const token = await AsyncStorage.getItem('@token');
  const mrId = await AsyncStorage.getItem('@mrId');
  if (!mrId || mrId === 'null' || mrId === 'undefined') return [];
  const response = await api.get(`/tour-plans/mr/${mrId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data.data || response.data;
};export const getASMTourPlans = async () => { const token = await AsyncStorage.getItem('@token'); const response = await api.get('/tour-plans/asm/team', { headers: { Authorization: `Bearer ${token}` } }); return response.data.data || response.data; };
