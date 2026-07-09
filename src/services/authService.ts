// src/services/authService.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

export const loginUser = async (
  email: string,
  password: string
) => {
  const response = await api.post(
    '/auth/login',
    {
      email,
      password,
    }
  );

  return response.data;
};

/**
 * Change password via backend API.
 * POST /auth/change-password
 * Body: { currentPassword, newPassword }
 */
export const changePassword = async (
  currentPassword: string,
  newPassword: string
) => {
  const token = await AsyncStorage.getItem('@token');
  const response = await api.post(
    '/auth/change-password',
    { currentPassword, newPassword },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

/**
 * Update MR contact profile via backend API.
 * PATCH /mr/profile
 * Body: { mobile, email, address }
 */
export const updateMrProfile = async (
  mobile: string,
  email: string,
  address: string
) => {
  const token = await AsyncStorage.getItem('@token');
  const mrId = await AsyncStorage.getItem('@mrId');
  const response = await api.patch(
    `/mr/profile/${mrId}`,
    { mobile, email, address },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};