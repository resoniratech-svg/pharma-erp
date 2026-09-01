import { getAuthDetails } from './authHelper';
import { api } from './api';
import { Platform } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';

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
 * On NATIVE:  We resize/compress the image via expo-image-manipulator to max 800px
 *             width and 0.2 JPEG quality to prevent HTTP 413 (Payload Too Large).
 * On WEB:     The asset.uri is already a blob URL. We fetch it, read it with
 *             FileReader, and return the resulting data URL.
 */
export const encodeReceiptToDataUrl = async (
  uri: string,
  mimeType: string,
  base64FromPicker?: string | null
): Promise<string> => {
  if (!uri) throw new Error('No receipt file URI provided.');

  const safeMime = mimeType || 'image/jpeg';

  // ── Native path: compress using ImageManipulator ──
  if (Platform.OS !== 'web') {
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 600 } }],
        { compress: 0.15, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      return `data:${safeMime};base64,${manipResult.base64}`;
    } catch (manipErr) {
      console.log('ImageManipulator failed, falling back to raw base64:', manipErr);
      if (!base64FromPicker) {
        throw new Error('Receipt base64 data is missing. Please pick the image again.');
      }
      return `data:${safeMime};base64,${base64FromPicker}`;
    }
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

        // Limit the maximum dimensions to 600px to ensure a small file size
        const maxDim = 600;
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

        // Compress to JPEG with 0.15 quality (highly compressed but text is perfectly readable)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.15);
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
    if (!mrId) return [];

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
    if (!mrId) return [];

    if (!mrId || mrId === 'null' || mrId === 'undefined') return [];
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