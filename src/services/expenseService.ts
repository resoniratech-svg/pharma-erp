import { getAuthDetails } from './authHelper';
import { api } from './api';
import { Platform } from 'react-native';

const MIME_TYPES: { [key: string]: string } = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  pdf: 'application/pdf',
};

/**
 * Validates the file extension.
 */
const validateFile = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (!MIME_TYPES[ext]) {
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

    if (!expenseDate || isNaN(new Date(expenseDate).getTime())) {
      throw new Error('Invalid expense date provided.');
    }

    const response = await api.post(
      '/expenses',
      {
        mrId, // Sent for compatibility; backend should eventually extract this from JWT
        expenseType,
        amount,
        expenseDate,
        description: (description || '').trim(),
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
 * Optional fileSize parameter enables cross-platform size validation at the service level.
 */
export const uploadExpenseReceipt = async (uri: string, fileSize?: number): Promise<string> => {
  try {
    const { headers } = await getAuthDetails();

    if (!uri) {
      throw new Error('No receipt file URI provided for upload.');
    }

    const filename = uri.split('/').pop() || 'receipt.jpg';
    validateFile(filename);

    const ext = filename.split('.').pop()?.toLowerCase() || 'jpeg';
    const mimeType = MIME_TYPES[ext] || 'image/jpeg';
    const formData = new FormData();

    // 1. Validate File Size on Native if provided (Max 5MB)
    if (fileSize && fileSize > 5 * 1024 * 1024) {
      throw new Error('Receipt file size exceeds the 5 MB limit.');
    }

    if (Platform.OS === 'web') {
      try {
        const res = await fetch(uri);
        const blob = await res.blob();
        
        // 2. Validate File Size on Web (Max 5MB)
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