import { apiRequest } from './apiClient';

export interface RouteWaypoint {
  time: string;
  timestamp: number;
  label: string;
  repName: string;
  lat?: number;
  lng?: number;
  type: 'start' | 'visit' | 'end' | 'doctor' | 'chemist';
}

export interface ActiveRep {
  id: string;
  repName: string;
  checkInTime: string;
  checkOutTime?: string;
  location: string;
  lat: number;
  lng: number;
  lastUpdated: string;
  isCheckedOut: boolean;
  routePoints?: Array<{
    lat: number;
    lng: number;
    title: string;
    time: string;
    type: 'checkin' | 'doctor' | 'chemist' | 'checkout';
  }>;
}

export const trackingService = {
  async getRouteHistory(mrId: string, date: string): Promise<RouteWaypoint[]> {
    try {
      const response = await apiRequest<{ success: boolean; data: any[] }>(`/route-history/mr/${mrId}/date/${date}`);
      if (response && response.success && Array.isArray(response.data)) {
        return response.data.map(item => ({
          time: item.time,
          timestamp: item.timestamp || new Date(`1970-01-01T${item.time}:00Z`).getTime(),
          label: item.label,
          repName: item.repName,
          lat: item.lat,
          lng: item.lng,
          type: item.type as any
        }));
      }
      return [];
    } catch (e) {
      console.error("Failed to get route history from API", e);
      return [];
    }
  },

  async getDailyMovement(mrId: string, date: string): Promise<ActiveRep | null> {
    try {
      const response = await apiRequest<{ success: boolean; data: any }>(`/daily-movement/mr/${mrId}/date/${date}`);
      if (response && response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (e) {
      console.error("Failed to get daily movement from API", e);
      return null;
    }
  }
};
