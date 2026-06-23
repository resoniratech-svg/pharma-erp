import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

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