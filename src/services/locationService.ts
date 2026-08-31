import { api } from './api';

export const locationService = {
  getLocations: async () => {
    try {
      const response = await api.get('/locations');
      return response.data;
    } catch (error) {
      console.error('Error fetching locations:', error);
      throw error;
    }
  },
  createLocation: async (data: { type: string, value: string, parent?: string }) => {
    try {
      const response = await api.post('/locations', data);
      return response.data;
    } catch (error) {
      console.error('Error creating location:', error);
      throw error;
    }
  }
};
