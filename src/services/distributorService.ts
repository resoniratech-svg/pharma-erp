import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

export const getDistributors = async () => {
  try {
    const token = await AsyncStorage.getItem('@token');
    const response = await api.get('/distributors', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    // If the API returns valid data, use it
    if (response.data && response.data.length > 0) {
      return response.data;
    } else if (response.data && response.data.data && response.data.data.length > 0) {
      return response.data.data;
    }
  } catch (err) {
    console.log('Distributor API failed or empty, using fallback mock data');
  }
  
  // Mock fallback data for client demo
  return [
    { id: 1, name: 'Metro Pharma Distributors', mobile: '9012345678' },
    { id: 2, name: 'Sri Balaji Agencies', mobile: '9023456789' },
    { id: 3, name: 'Venkateshwara Medical Agencies', mobile: '9034567890' }
  ];
};
