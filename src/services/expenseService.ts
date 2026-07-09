import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';
import { Platform } from 'react-native';

/**
 * Helper to fetch token and MR ID with validation.
 * Throws clean error if session is missing or invalid.
 */
const getAuthDetails = async () => {
  const token = await AsyncStorage.getItem('@token');
  const mrId = await AsyncStorage.getItem('@mrId');

  if (!token) {
    throw new Error('User session expired or user is not logged in.');
  }

  if (!mrId) {
    throw new Error('Medical Representative identifier (MR ID) is missing.');
  }

  return {
    token,
    mrId: Number(mrId),
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

/**
 * Helper to validate file type and size before sending to backend.
 */
const validateFile = (filename: string, uri: string) => {
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf'];
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  if (!allowedExtensions.includes(ext)) {
    throw new Error(`Unsupported file type (.${ext}). Only JPG, JPEG, PNG, and PDF are allowed.`);
  }
};

export const createExpense = async (
  expenseType: string,
  amount: number,
  expenseDate: string,
  description: string,
  receiptUrl?: string
) => {
  try {
    const { mrId, headers } = await getAuthDetails();

    if (!expenseType || expenseType.trim() === '') {
      throw new Error('Expense category is required.');
    }

    if (isNaN(amount) || amount <= 0) {
      throw new Error('Expense amount must be a positive number.');
    }

    const response = await api.post(
      '/expenses',
      {
        mrId, // Sent for backend compatibility; backend should ideally verify with JWT
        expenseType,
        amount,
        expenseDate,
        description,
        receiptUrl: receiptUrl || 'N/A',
      },
      { headers }
    );

    if (!response.data) {
      throw new Error('Server returned an empty response.');
    }

    return response.data;
  } catch (err: any) {
    console.error('Error in createExpense service:', err);
    throw err;
  }
};

export const getExpensesByMr = async () => {
  try {
    const { mrId, headers } = await getAuthDetails();

    const response = await api.get(`/expenses/mr/${mrId}`, { headers });

    if (!response.data) {
      throw new Error('Empty response from server.');
    }

    const list = response.data.data || response.data;
    if (!Array.isArray(list)) {
      return [];
    }

    return list;
  } catch (err: any) {
    console.error('Error in getExpensesByMr service:', err);
    throw err;
  }
};

/**
 * Upload receipt image/file to the backend.
 * POST /expenses/upload
 * Returns the hosted URL of the receipt.
 */
export const uploadExpenseReceipt = async (uri: string): Promise<string> => {
  try {
    const { headers } = await getAuthDetails();

    if (!uri) {
      throw new Error('No receipt file URI provided for upload.');
    }

    const formData = new FormData();
    const filename = uri.split('/').pop() || 'receipt.jpg';
    
    // Perform file type validation
    validateFile(filename, uri);

    // Dynamic MIME type detection
    const ext = filename.split('.').pop()?.toLowerCase() || 'jpeg';
    const mimeType = ext === 'pdf' ? 'application/pdf' : `image/${ext}`;

    if (Platform.OS === 'web') {
      try {
        const res = await fetch(uri);
        const blob = await res.blob();
        
        // Size validation: Max 5MB
        if (blob.size > 5 * 1024 * 1024) {
          throw new Error('Receipt file size exceeds the 5 MB limit.');
        }

        formData.append('file', blob, filename);
      } catch (fetchErr) {
        throw new Error('Failed to resolve local web file asset for upload.');
      }
    } else {
      formData.append('file', {
        uri,
        name: filename,
        type: mimeType,
      } as any);
    }

    const response = await api.post('/expenses/upload', formData, {
      headers: {
        ...headers,
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // 30 seconds upload timeout
    });

    const url = response.data?.url || response.data?.data?.url;
    if (!url) {
      throw new Error('Upload completed but backend did not return a valid file URL.');
    }

    return url;
  } catch (err: any) {
    console.error('Error in uploadExpenseReceipt service:', err);
    throw err;
  }
};