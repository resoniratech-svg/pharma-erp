import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Shared helper to retrieve and validate authentication credentials.
 * Throws an error if the user is not logged in or the MR ID is missing.
 */
export const getAuthDetails = async () => {
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
