// dashboardService.ts

const isToday = (dateStr: string) => {
  if (!dateStr) return false;
  const today = new Date();
  const todayStr = today.toDateString();
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

export const dashboardService = {
  getAttendanceStatus: (attendanceData: any[] = []) => {
    try {
      const authUserString = localStorage.getItem('authUser');
      const authUser = authUserString ? JSON.parse(authUserString) : null;
      const userName = authUser?.fullName || authUser?.name || 'Medical Representative';

      const now = new Date();
      const todayDateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');

      const todayRecord = attendanceData.find((r: any) => 
        (r.date === todayDateStr || isToday(r.date)) && 
        (r.repName === userName || r.userId === authUser?.id || r.mr?.name === userName)
      );
      
      if (todayRecord) {
         const isCheckedOut = todayRecord.checkOutTime && todayRecord.checkOutTime !== '-';
         return {
           status: isCheckedOut ? 'Completed' : 'Present',
           checkInTime: todayRecord.checkInTime,
           checkOutTime: todayRecord.checkOutTime,
           locationVerified: true,
         };
      }
    } catch (e) {
      console.error("Error reading attendance:", e);
    }

    return {
      status: 'Absent',
      checkInTime: '',
      locationVerified: false,
    };
  },

  getTodayDoctorVisits: (visits: any[] = []) => {
    const todayVisits = visits.filter((v: any) => isToday(v.visitDate || v.date));
    return {
      completed: todayVisits.length,
      target: 15,
    };
  },

  getTodayChemistVisits: (visits: any[] = []) => {
    const todayVisits = visits.filter((v: any) => isToday(v.visitDate || v.date));
    return {
      completed: todayVisits.length,
      target: 10
    };
  },

  getTodayOrders: (orders: any[] = []) => {
    const todayOrders = orders.filter((o: any) => isToday(o.dateFormatted || o.date || o.orderDate));
    const totalAmount = todayOrders.reduce((sum: number, o: any) => sum + (parseFloat(o.totalAmount) || 0), 0);
    return {
      count: todayOrders.length,
      amount: totalAmount,
    };
  },

  getMonthlyTargetProgress: (docData: any[] = [], chemData: any[] = [], orderData: any[] = []) => {
    const docVisits = docData.filter((v: any) => isCurrentMonth(v.visitDate || v.date)).length;
    const chemistVisits = chemData.filter((v: any) => isCurrentMonth(v.visitDate || v.date)).length;
    const orders = orderData.filter((o: any) => isCurrentMonth(o.dateFormatted || o.date || o.orderDate));
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

  getPendingFollowUps: (doctorVisits: any[] = []) => {
    const doctorFollowUps = doctorVisits.filter((v: any) => v.nextFollowUp && v.nextFollowUp.trim() !== '');

    let dueTodayCount = 0;
    let overdueCount = 0;
    const today = new Date();
    today.setHours(0,0,0,0);

    const list2 = doctorFollowUps.map((v: any) => {
      let status = 'Upcoming';
      if (isToday(v.nextFollowUp)) {
        status = 'Due Today';
        dueTodayCount++;
      } else {
        const fDate = new Date(v.nextFollowUp);
        if (!isNaN(fDate.getTime()) && fDate < today) {
          status = 'Overdue';
          overdueCount++;
        }
      }
      return {
        name: `Dr. ${v.doctorName || v.name}`,
        status: status,
        date: v.nextFollowUp,
      };
    });

    list2.sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    return {
      dueTodayCount,
      overdueCount,
      list: list2.slice(0, 5) 
    };
  },

  getTodaySchedule: (doctorVisits: any[] = []) => {
    const todayDoctors = doctorVisits.filter((v: any) => v.nextFollowUp && isToday(v.nextFollowUp));
    const schedule = todayDoctors.map((v: any, idx: number) => ({
      time: `11:${idx}0 AM`,
      title: `Visit: Dr. ${v.doctorName}`
    }));
    return schedule.length > 0 ? schedule : null;
  },

  getRecentOrders: (orders: any[] = []) => {
    return orders.slice(0, 3).map((o: any) => ({
      client: o.customerName || o.client || o.chemist?.name || o.retailer?.name || 'Unknown Customer',
      chemistName: o.customerName || o.client || o.chemist?.name || o.retailer?.name || 'Unknown Customer',
      orderNumber: o.orderNumber || `ORD-${o.id}`,
      productName: o.productName || (o.orderItems && o.orderItems.length > 0 ? o.orderItems[0].product?.name : 'General Product'),
      amount: parseFloat(o.totalAmount || 0),
      date: o.date || o.dateFormatted || o.orderDate || new Date().toISOString().split('T')[0],
      status: o.status === 'PENDING' ? 'Pending' : (o.status === 'DELIVERED' ? 'Approved' : o.status || 'Pending')
    }));
  },

  getRecentVisits: (docVisits: any[] = [], chemVisits: any[] = []) => {
    const allVisits = [...docVisits.map((v: any) => ({ name: v.doctorName, time: v.visitTime || '10:30 AM'})), 
                       ...chemVisits.map((v: any) => ({ name: v.chemistName, time: v.visitTime || '11:15 AM'}))];
    return allVisits.slice(0, 3);
  },

  getTodayNotifications: (docVisits: any[] = []) => {
    let dynamicNotifs: any[] = [];
    const followUpsDueToday = docVisits.filter((v: any) => v.nextFollowUp && isToday(v.nextFollowUp));
    
    followUpsDueToday.forEach((f: any) => {
      dynamicNotifs.push({ message: `Follow-up due for ${f.doctorName || f.name}` });
    });

    if (dynamicNotifs.length === 0) {
      return [{ message: 'No new notifications today.' }];
    }
    return dynamicNotifs.slice(0, 3);
  },

  getTodayRouteSummary: () => {
    return {
      totalDistance: '0 KM',
      routeActive: false
    };
  }
};
