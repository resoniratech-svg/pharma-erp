import AsyncStorage from '@react-native-async-storage/async-storage';

const getTodayDateStr = () => new Date().toDateString();

const isToday = (dateStr: string) => {
  if (!dateStr) return false;
  const todayStr = getTodayDateStr();
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const isoToday = `${yyyy}-${mm}-${dd}`;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formattedToday = `${dd}-${months[today.getMonth()]}-${yyyy}`;

  return dateStr.includes(isoToday) || dateStr.includes(formattedToday) || dateStr === todayStr;
};

const isCurrentMonth = (dateStr: string) => {
  if (!dateStr) return false;
  const today = new Date();
  const currentMonthStr = String(today.getMonth() + 1).padStart(2, '0');
  const currentYearStr = String(today.getFullYear());
  const shortMonthYear = today.toLocaleString('en-US', { month: 'short', year: 'numeric' });
  
  return dateStr.includes(`${currentYearStr}-${currentMonthStr}`) || 
         dateStr.includes(shortMonthYear) ||
         (dateStr.includes(today.toLocaleString('en-US', { month: 'short' })) && dateStr.includes(currentYearStr));
};

const safeJsonParse = (data: string | null, fallback: any = []) => {
  if (!data) return fallback;
  try {
    return JSON.parse(data);
  } catch (err) {
    console.log('safeJsonParse error:', err);
    return fallback;
  }
};

export const dashboardService = {
  getAttendanceStatus: async () => {
    const checkedInStatus = await AsyncStorage.getItem('@checked_in');
    const time = await AsyncStorage.getItem('@check_in_time');
    const isCheckedIn = checkedInStatus === 'true';
    return {
      status: isCheckedIn ? 'Present' : 'Absent',
      checkInTime: time || '',
      locationVerified: isCheckedIn,
    };
  },

  getTodayDoctorVisits: async () => {
    const data = await AsyncStorage.getItem('@doctor_visits');
    const visits = safeJsonParse(data, []);
    const todayVisits = visits.filter((v: any) => isToday(v.visitDate || v.date));
    return {
      completed: todayVisits.length,
      target: 15,
    };
  },

  getTodayChemistVisits: async () => {
    const data = await AsyncStorage.getItem('@chemist_visits');
    const visits = safeJsonParse(data, []);
    const todayVisits = visits.filter((v: any) => isToday(v.visitDate || v.date));
    return {
      completed: todayVisits.length,
      target: 10,
    };
  },

  getTodayOrders: async () => {
    const data = await AsyncStorage.getItem('@orders');
    const orders = safeJsonParse(data, []);
    const todayOrders = orders.filter((o: any) => isToday(o.dateFormatted || o.date));
    const totalAmount = todayOrders.reduce((sum: number, o: any) => sum + (parseFloat(o.totalAmount) || 0), 0);
    return {
      count: todayOrders.length,
      amount: totalAmount,
    };
  },

  getMonthlyTargetProgress: async () => {
    const dData = await AsyncStorage.getItem('@doctor_visits');
    const cData = await AsyncStorage.getItem('@chemist_visits');
    const oData = await AsyncStorage.getItem('@orders');

    const docVisits = safeJsonParse(dData, []).filter((v: any) => isCurrentMonth(v.visitDate || v.date)).length;
    const chemistVisits = safeJsonParse(cData, []).filter((v: any) => isCurrentMonth(v.visitDate || v.date)).length;
    
    const orders = safeJsonParse(oData, []).filter((o: any) => isCurrentMonth(o.dateFormatted || o.date));
    const salesAchieved = orders.reduce((sum: number, item: any) => sum + (parseFloat(item.totalAmount) || 0), 0);

    const SALES_TARGET = 50000;
    const DOCS_TARGET = 30;
    const CHEMISTS_TARGET = 20;

    return {
      sales: { achieved: salesAchieved, target: SALES_TARGET, percent: Math.min(Math.round((salesAchieved / SALES_TARGET) * 100), 100) },
      docs: { achieved: docVisits, target: DOCS_TARGET, percent: Math.min(Math.round((docVisits / DOCS_TARGET) * 100), 100) },
      chemists: { achieved: chemistVisits, target: CHEMISTS_TARGET, percent: Math.min(Math.round((chemistVisits / CHEMISTS_TARGET) * 100), 100) }
    };
  },

  getPendingFollowUps: async () => {
    const dData = await AsyncStorage.getItem('@doctor_visits');
    const visits = safeJsonParse(dData, []);
    const followUps = visits.filter((v: any) => v.followUpDate && v.followUpDate.trim() !== '');
    
    let dueTodayCount = 0;
    let overdueCount = 0;
    const today = new Date();
    today.setHours(0,0,0,0);

    const mappedFollowups = followUps.map((v: any) => {
      let status = 'Upcoming';
      if (isToday(v.followUpDate)) {
        status = 'Due Today';
        dueTodayCount++;
      } else {
        const fDate = new Date(v.followUpDate);
        if (!isNaN(fDate.getTime()) && fDate < today) {
          status = 'Overdue';
          overdueCount++;
        }
      }
      return {
        name: v.doctorName || v.name,
        status: status,
        date: v.followUpDate,
      };
    });

    return {
      dueTodayCount,
      overdueCount,
      list: mappedFollowups.slice(0, 5)
    };
  },

  getTodaySchedule: async () => {
    const dData = await AsyncStorage.getItem('@doctor_visits');
    const visits = safeJsonParse(dData, []);
    const followUps = visits.filter((v: any) => v.followUpDate && isToday(v.followUpDate));
    
    const schedule = followUps.map((v: any, idx: number) => ({
      time: `10:${idx}0 AM`,
      title: `Follow-up ${v.doctorName || v.name}`
    }));

    return schedule.length > 0 ? schedule : null;
  },

  getRecentOrders: async () => {
    const data = await AsyncStorage.getItem('@orders');
    const orders = safeJsonParse(data, []);
    
    if (orders.length === 0) return [];
    
    return orders.slice(0, 4).map((o: any, idx: number) => ({
      id: o.orderNumber || `ORD-NEW-${o.id || idx}`,
      client: o.customerName || 'Chemist Store',
      status: o.status === 'Booked' ? 'Pending' : o.status === 'Fulfilled' ? 'Shipped' : 'Failed',
      amount: `₹${(parseFloat(o.totalAmount) || 0).toLocaleString()}`,
      date: o.dateFormatted ? o.dateFormatted.split(' ')[0] : 'Today'
    }));
  },

  getRecentVisits: async () => {
    const dData = await AsyncStorage.getItem('@doctor_visits');
    const cData = await AsyncStorage.getItem('@chemist_visits');
    
    const docVisits = safeJsonParse(dData, []);
    const chemVisits = safeJsonParse(cData, []);
    
    const allVisits = [...docVisits.map((v: any) => ({ name: v.doctorName, time: v.visitTime || '10:30 AM'})), 
                       ...chemVisits.map((v: any) => ({ name: v.chemistName, time: v.visitTime || '11:15 AM'}))];
    
    return allVisits.slice(0, 3);
  }
};
