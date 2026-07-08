const STORAGE_KEY = 'pharma_erp_dispatches';

export const dispatchService = {
  getAll: () => {
    const data = localStorage.getItem(STORAGE_KEY);
    const parsed = data ? JSON.parse(data) : [];
    return parsed.map((d: any) => ({
      ...d,
      dispatchNo: d.dispatchId || d.dispatchNo || 'N/A',
      orderNo: d.orderId || d.orderNo || 'N/A',
      distributorId: d.distributorId || d.clientId || d.clientCode || d.distributorCode || '',
      distributorCode: d.distributorCode || d.clientCode || d.distributorId || d.clientId || '',
      distributorName: d.client || d.distributorName || d.distributor || 'General Distributor',
      distributor: d.client || d.distributorName || d.distributor || 'General Distributor',
      transporter: d.transporter || 'Pending',
      vehicleNo: d.vehicleNumber || d.vehicleNo || 'Pending',
      lrNo: d.lrNumber || d.lrNo || 'Pending',
      dispatchDate: d.dispatchDate || d.date || 'TBD',
      dispatchStatus: d.dispatchStatus || d.status || 'Pending Dispatch',
      podStatus: d.podStatus || 'Pending'
    }));
  },
  getById: (id: string) => {
    return dispatchService.getAll().find((d: any) => d.id === id);
  },
  getByDispatchNo: (dispatchNo: string) => {
    return dispatchService.getAll().find((d: any) => d.dispatchNo === dispatchNo);
  },
  getByDistributor: (distributor: string) => {
    return dispatchService.getAll().filter((d: any) => 
      d.distributorName === distributor || 
      d.distributor === distributor || 
      d.distributorCode === distributor
    );
  },
  getByOrderNo: (orderNo: string) => {
    return dispatchService.getAll().filter((d: any) => d.orderNo === orderNo);
  },
  getByStatus: (status: string) => {
    return dispatchService.getAll().filter((d: any) => d.dispatchStatus === status || d.status === status);
  },
  getByPodStatus: (podStatus: string) => {
    return dispatchService.getAll().filter((d: any) => d.podStatus === podStatus);
  },
  updateDispatchStatus: (id: string, status: string, milestoneUpdate?: any) => {
    const dispatches = dispatchService.getAll();
    const index = dispatches.findIndex((d: any) => d.id === id);
    if (index !== -1) {
      dispatches[index].dispatchStatus = status;
      if (milestoneUpdate && dispatches[index].milestones) {
         // Optionally update milestones if logic requires
         // This is a placeholder for actual milestone logic
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dispatches));
    }
  },
  updatePodStatus: (id: string, podStatus: string) => {
    const dispatches = dispatchService.getAll();
    const index = dispatches.findIndex((d: any) => d.id === id);
    if (index !== -1) {
      dispatches[index].podStatus = podStatus;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dispatches));
    }
  },
  getDeliveryTimeline: (id: string) => {
    const dispatch = dispatchService.getById(id);
    return dispatch?.milestones || [];
  },
  getTransporterDetails: (id: string) => {
    const dispatch = dispatchService.getById(id);
    if (!dispatch) return null;
    return {
      transporter: dispatch.transporter,
      vehicleNo: dispatch.vehicleNo,
      driverName: dispatch.driverName,
      driverMobile: dispatch.driverMobile,
      lrNo: dispatch.lrNo
    };
  }
};
