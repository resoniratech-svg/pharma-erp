import { api } from './api';

export const leadService = {
  getLeads: async () => {
    try {
      const response = await api.get('/leads');
      return response.data;
    } catch (error) {
      console.error('Error fetching leads:', error);
      throw error;
    }
  },

  getLeadsByMr: async (mrId: number) => {
    try {
      if (!mrId || mrId === 'null' || mrId === 'undefined') return [];
  const response = await api.get(`/leads/mr/${mrId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching MR leads:', error);
      throw error;
    }
  },

  getLeadById: async (id: number) => {
    try {
      const response = await api.get(`/leads/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching lead ${id}:`, error);
      throw error;
    }
  },

  createLead: async (data: any) => {
    try {
      const response = await api.post('/leads', data);
      return response.data;
    } catch (error) {
      console.error('Error creating lead:', error);
      throw error;
    }
  },

  updateLead: async (id: number, data: any) => {
    try {
      const response = await api.patch(`/leads/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating lead ${id}:`, error);
      throw error;
    }
  },

  assignLead: async (id: number, assignedToMrId: number) => {
    try {
      const response = await api.patch(`/leads/${id}/assign`, { mrId: assignedToMrId });
      return response.data;
    } catch (error) {
      console.error(`Error assigning lead ${id}:`, error);
      throw error;
    }
  },

  convertLead: async (id: number, status: string, notes?: string) => {
    try {
      const response = await api.patch(`/leads/${id}/convert`, { status, notes });
      return response.data;
    } catch (error) {
      console.error(`Error converting lead ${id}:`, error);
      throw error;
    }
  },
};
