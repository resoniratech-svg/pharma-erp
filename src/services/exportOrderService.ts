import { apiRequest } from './apiClient';

export interface ExportOrder {
  id: number;
  orderNumber: string;
  invoiceNumber?: string;
  buyerName: string;
  destinationCountry: string;
  destinationPort?: string;
  portOfLoading?: string;
  shippingMode: string;
  containerOrAwbNo?: string;
  orderValueUSD: number;
  orderValueINR: number;
  orderDate: string;
  eta?: string;
  customsStatus: 'Cleared' | 'Under Inspection' | 'Documentation Pending';
  status: 'In Transit' | 'Port Departure' | 'Delivered' | 'Documentation' | 'On Hold';
  itemsSummary?: string;
  incoterm: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateExportOrderPayload {
  orderNumber?: string;
  invoiceNumber?: string;
  buyerName: string;
  destinationCountry: string;
  destinationPort?: string;
  portOfLoading?: string;
  shippingMode?: string;
  containerOrAwbNo?: string;
  orderValueUSD: number;
  orderValueINR?: number;
  orderDate?: string;
  eta?: string;
  customsStatus?: string;
  status?: string;
  itemsSummary?: string;
  incoterm?: string;
}

export const exportOrderService = {
  async getExportOrders(filters?: Record<string, any>): Promise<ExportOrder[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '' && v !== 'All') {
          params.append(k, String(v));
        }
      });
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await apiRequest<{ success: boolean; data: ExportOrder[] }>(
      `/export-orders${query}`
    );
    return res.data || [];
  },

  async getExportOrderById(id: number): Promise<ExportOrder> {
    const res = await apiRequest<{ success: boolean; data: ExportOrder }>(
      `/export-orders/${id}`
    );
    return res.data;
  },

  async createExportOrder(payload: CreateExportOrderPayload): Promise<ExportOrder> {
    const res = await apiRequest<{ success: boolean; data: ExportOrder }>(
      '/export-orders',
      {
        method: 'POST',
        bodyData: payload,
      }
    );
    return res.data;
  },

  async updateExportOrder(
    id: number,
    payload: Partial<CreateExportOrderPayload>
  ): Promise<ExportOrder> {
    const res = await apiRequest<{ success: boolean; data: ExportOrder }>(
      `/export-orders/${id}`,
      {
        method: 'PATCH',
        bodyData: payload,
      }
    );
    return res.data;
  },

  async deleteExportOrder(id: number): Promise<void> {
    await apiRequest<{ success: boolean }>(`/export-orders/${id}`, {
      method: 'DELETE',
    });
  },
};
