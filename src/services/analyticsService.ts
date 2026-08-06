import { apiRequest } from './apiClient';

export interface ProductProfitabilityData {
  id: string | number;
  productCode: string;
  productName: string;
  category: string;
  division: string;
  branch: string;
  quantitySold: number;
  revenue: number;
  avgCogs: number;
  avgSellingPrice: number;
  grossMargin: number;
  profitAmount: number;
  trend: 'Up' | 'Down' | 'Stable';
}

export const analyticsService = {
  async getProductProfitability(): Promise<ProductProfitabilityData[]> {
    try {
      const response = await apiRequest('/api/analytics/product-profitability');
      if (response && response.data) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch product profitability:', error);
      return [];
    }
  }
};