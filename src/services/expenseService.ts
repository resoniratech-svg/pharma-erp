import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';
import { Platform } from 'react-native';

export const createExpense = async (
  expenseType: string,
  amount: number,
  expenseDate: string,
  description: string,
  receiptUrl?: string
) => {
  const token = await AsyncStorage.getItem('@token');
  const mrId = await AsyncStorage.getItem('@mrId');

  const response = await api.post(
    '/expenses',
    {
      mrId: Number(mrId),
      expenseType,
      amount,
      expenseDate,
      description,
      receiptUrl,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export const getExpensesByMr = async () => {
  const token = await AsyncStorage.getItem('@token');
  const mrId = await AsyncStorage.getItem('@mrId');
  const response = await api.get(`/expenses/mr/${mrId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data.data || response.data;
};

/**
 * Upload receipt image/file to the backend.
 * POST /expenses/upload
 * Returns the hosted URL of the receipt.
 */
export const uploadExpenseReceipt = async (uri: string): Promise<string> => {
  const token = await AsyncStorage.getItem('@token');
  
  const formData = new FormData();
  
  if (Platform.OS === 'web') {
    const res = await fetch(uri);
    const blob = await res.blob();
    formData.append('file', blob, 'receipt.jpg');
  } else {
    const filename = uri.split('/').pop() || 'receipt.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    formData.append('file', {
      uri,
      name: filename,
      type,
    } as any);
  }

  const response = await api.post('/expenses/upload', formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });

  // Return the uploaded file URL (handle different typical response wrappers)
  return response.data?.url || response.data?.data?.url || '';
};