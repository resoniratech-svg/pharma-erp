export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'payment' | 'inventory' | 'mr' | 'gps' | 'crm' | 'warehouse' | 'system' | 'meeting' | 'dispatch' | 'expiry' | 'target';
  priority: 'critical' | 'high' | 'medium' | 'low' | 'info';
  module: string;            
  isActionRequired: boolean; 
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export const STORAGE_KEYS = {
  ORDERS: '@orders',
  WEB_ORDERS: 'web_orders',
  DOCTOR_VISITS: 'doctor_visits',
  CHEMIST_VISITS: 'chemist_visits',
  MEETINGS: 'meetings',
  READ_STATUS: 'read_notifications'
};

const notifyUI = () => {
  window.dispatchEvent(new Event('notifications-updated'));
};

export const NotificationService = {
  getNotifications: (): Notification[] => {
    const notifications: Notification[] = [];
    const readStatus = JSON.parse(localStorage.getItem(STORAGE_KEYS.READ_STATUS) || '[]');
    
    // 1. ORDERS
    const ordersData = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || localStorage.getItem(STORAGE_KEYS.WEB_ORDERS) || '[]');
    ordersData.forEach((order: any, index: number) => {
      const id = `order-${order.id || order.orderNumber || index}`;
      notifications.push({
        id,
        title: 'New Order Booked',
        message: `Order ${order.orderNumber || order.orderNo} for ₹${order.totalAmount || order.amount} was booked.`,
        type: 'mr',
        priority: 'medium',
        module: 'Order Booking',
        isActionRequired: false,
        read: readStatus.includes(id),
        createdAt: new Date(order.dateFormatted || order.date || Date.now()).toISOString(),
        actionUrl: '/workspace/mr/orders'
      });
    });

    // 2. DOCTOR VISITS
    const docData = JSON.parse(localStorage.getItem(STORAGE_KEYS.DOCTOR_VISITS) || '[]');
    docData.forEach((visit: any, index: number) => {
      const id = `doc-${visit.id || visit.doctorName || index}`;
      const isPending = visit.status === 'Pending' || !visit.status;
      notifications.push({
        id,
        title: isPending ? 'Pending Doctor Visit' : 'Doctor Visit Completed',
        message: isPending 
          ? `Visit for ${visit.doctorName || 'Doctor'} needs verification.`
          : `Visit for ${visit.doctorName || 'Doctor'} verified.`,
        type: 'crm',
        priority: isPending ? 'high' : 'info',
        module: 'Doctor Visits',
        isActionRequired: isPending, 
        read: readStatus.includes(id),
        createdAt: new Date(visit.visitDate || Date.now()).toISOString(),
        actionUrl: '/workspace/mr/doctor-visits'
      });
    });

    // 3. CHEMIST VISITS
    const chemData = JSON.parse(localStorage.getItem(STORAGE_KEYS.CHEMIST_VISITS) || '[]');
    chemData.forEach((visit: any, index: number) => {
      const id = `chem-${visit.id || visit.chemistName || index}`;
      const isPending = visit.status === 'Pending' || !visit.status;
      notifications.push({
        id,
        title: isPending ? 'Pending Chemist Visit' : 'Chemist Visit Completed',
        message: isPending 
          ? `Visit for ${visit.chemistName || 'Chemist'} needs verification.`
          : `Visit for ${visit.chemistName || 'Chemist'} verified.`,
        type: 'crm',
        priority: isPending ? 'high' : 'info',
        module: 'Chemist Visits',
        isActionRequired: isPending, 
        read: readStatus.includes(id),
        createdAt: new Date(visit.visitDate || Date.now()).toISOString(),
        actionUrl: '/workspace/mr/chemist-visits'
      });
    });

    // 4. MEETINGS
    const meetingsData = JSON.parse(localStorage.getItem(STORAGE_KEYS.MEETINGS) || '[]');
    meetingsData.forEach((meeting: any, index: number) => {
      const id = `meeting-${meeting.id || meeting.title || index}`;
      notifications.push({
        id,
        title: 'Meeting Scheduled',
        message: `Meeting with ${meeting.doctorName || meeting.title || 'Client'} scheduled at ${meeting.time || meeting.date || 'soon'}.`,
        type: 'meeting',
        priority: 'medium',
        module: 'Meeting Scheduling',
        isActionRequired: false,
        read: readStatus.includes(id),
        createdAt: new Date(meeting.createdAt || Date.now()).toISOString(),
        actionUrl: '/workspace/mr/meetings'
      });
    });

    // 5. CUSTOM NOTIFICATIONS
    const customNotifs = JSON.parse(localStorage.getItem('custom_notifications') || '[]');
    customNotifs.forEach((n: any) => {
      notifications.push({
        ...n,
        read: readStatus.includes(n.id)
      });
    });

    return notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  addNotification: (n: {
    title: string;
    message: string;
    type: 'payment' | 'inventory' | 'mr' | 'gps' | 'crm' | 'warehouse' | 'system' | 'meeting' | 'dispatch' | 'expiry' | 'target';
    priority: 'critical' | 'high' | 'medium' | 'low' | 'info';
    module: string;
    isActionRequired?: boolean;
    actionUrl?: string;
  }) => {
    const customNotifs = JSON.parse(localStorage.getItem('custom_notifications') || '[]');
    const newNotif = {
      ...n,
      id: `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      isActionRequired: n.isActionRequired || false,
      createdAt: new Date().toISOString()
    };
    customNotifs.push(newNotif);
    localStorage.setItem('custom_notifications', JSON.stringify(customNotifs));
    notifyUI();
  },

  getUnreadCount: () => {
    return NotificationService.getNotifications().filter(n => !n.read).length;
  },

  getCriticalNotifications: () => {
    return NotificationService.getNotifications().filter(n => n.priority === 'critical');
  },

  markAsRead: (id: string) => {
    const readStatus = JSON.parse(localStorage.getItem(STORAGE_KEYS.READ_STATUS) || '[]');
    if (!readStatus.includes(id)) {
      readStatus.push(id);
      localStorage.setItem(STORAGE_KEYS.READ_STATUS, JSON.stringify(readStatus));
      notifyUI(); 
    }
  },

  markAllAsRead: () => {
    const notifications = NotificationService.getNotifications();
    const allIds = notifications.map(n => n.id);
    localStorage.setItem(STORAGE_KEYS.READ_STATUS, JSON.stringify(allIds));
    notifyUI();
  },

  clearReadStatus: () => {
    localStorage.setItem(STORAGE_KEYS.READ_STATUS, JSON.stringify([]));
    notifyUI();
  }
};