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
 * Converts a picked image URI + optional base64 string into a data URL
 * that can be stored directly in the backend's billUrl / receiptUrl field.
 *
 * On NATIVE:  expo-image-picker returns asset.base64 when base64:true is set
 *             in the picker options. We just prefix it with the data URI header.
 * On WEB:     The asset.uri is already a blob URL. We fetch it, read it with
 *             FileReader, and return the resulting data URL.
 *
 * No separate upload server is required — the data URI is saved directly
 * into the database receipt/bill column via POST /expenses.
 */
export const encodeReceiptToDataUrl = async (
  uri: string,
  mimeType: string,
  base64FromPicker?: string | null
): Promise<string> => {
  if (!uri) throw new Error('No receipt file URI provided.');

  const safeMime = mimeType || 'image/jpeg';

  // ── Native path: use the base64 string provided by ImagePicker ──
  if (Platform.OS !== 'web') {
    if (!base64FromPicker) {
      throw new Error('Receipt base64 data is missing. Please pick the image again.');
    }
    return `data:${safeMime};base64,${base64FromPicker}`;
  }

  // ── Web path: fetch the blob URI, draw on canvas, and compress ──
  try {
    const res = await fetch(uri);
    const blob = await res.blob();

    // Scale and compress using HTML Canvas on web platforms
    const compressedDataUrl = await new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Limit the maximum dimensions to 800px to ensure a small file size
        const maxDim = 800;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to create canvas context.'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Compress to JPEG with 0.2 quality (highly compressed but text is perfectly readable)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.2);
        resolve(dataUrl);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for compression.'));
      };

      img.src = URL.createObjectURL(blob);
    });

    return compressedDataUrl;
  } catch (err: any) {
    throw new Error('Failed to process and compress receipt image.');
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

    const billValue = receiptUrl || 'N/A';

    const response = await api.post(
      '/expenses',
      {
        mrId, // Sent for compatibility; backend should eventually extract this from JWT
        expenseType,
        amount,
        expenseDate,
        description: (description || '').trim(),
        // Send under both field names to handle any backend column naming variation
        receiptUrl: billValue,
        billUrl: billValue,
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