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

const safeJsonParse = (key: string, fallback: any = []) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (err) {
    console.error(`Error parsing ${key}:`, err);
    return fallback;
  }
};

export const dashboardService = {
  getAttendanceStatus: () => {
    try {
      const authUserString = localStorage.getItem('authUser');
      const authUser = authUserString ? JSON.parse(authUserString) : null;
      const userName = authUser?.fullName || authUser?.name || 'Medical Representative';

      const now = new Date();
      const todayDateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');

      const existingData = localStorage.getItem('web_attendance_records');
      if (existingData) {
        const records = JSON.parse(existingData);
        const todayRecord = records.find((r: any) => r.date === todayDateStr && (r.repName === userName || r.userId === authUser?.id));
        
        if (todayRecord) {
           const isCheckedOut = todayRecord.checkOutTime && todayRecord.checkOutTime !== '-';
           return {
             status: isCheckedOut ? 'Completed' : 'Present',
             checkInTime: todayRecord.checkInTime,
             checkOutTime: todayRecord.checkOutTime,
             locationVerified: true,
           };
        }
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

  getTodayDoctorVisits: () => {
    const visits = safeJsonParse('web_doctor_visits');
    const todayVisits = visits.filter((v: any) => isToday(v.visitDate || v.date));
    return {
      completed: todayVisits.length,
    //  target: 15, // Hardcoded daily target
     target: safeJsonParse('mr_daily_doc_target', 15),
    };
  },

  getTodayChemistVisits: () => {
    const visits = safeJsonParse('web_chemist_visits');
    const todayVisits = visits.filter((v: any) => isToday(v.visitDate || v.date));
    return {
      completed: todayVisits.length,
      //target: 10,
       target: safeJsonParse('mr_daily_chem_target', 10)
    };
  },

  getTodayOrders: () => {
    const orders = safeJsonParse('web_orders');
    const todayOrders = orders.filter((o: any) => isToday(o.dateFormatted || o.date));
    const totalAmount = todayOrders.reduce((sum: number, o: any) => sum + (parseFloat(o.totalAmount) || 0), 0);
    return {
      count: todayOrders.length,
      amount: totalAmount,
    };
  },

  getMonthlyTargetProgress: () => {
    const docVisits = safeJsonParse('web_doctor_visits').filter((v: any) => isCurrentMonth(v.visitDate || v.date)).length;
    const chemistVisits = safeJsonParse('web_chemist_visits').filter((v: any) => isCurrentMonth(v.visitDate || v.date)).length;
    
    const orders = safeJsonParse('web_orders').filter((o: any) => isCurrentMonth(o.dateFormatted || o.date));
    const salesAchieved = orders.reduce((sum: number, item: any) => sum + (parseFloat(item.totalAmount) || 0), 0);

    // const SALES_TARGET = 50000;
    // const DOCS_TARGET = 30;
    // const CHEMISTS_TARGET = 20;
   const SALES_TARGET = safeJsonParse('mr_monthly_sales_target', 50000);
    const DOCS_TARGET = safeJsonParse('mr_monthly_docs_target', 30);
    const CHEMISTS_TARGET = safeJsonParse('mr_monthly_chem_target', 20);

    return {
      sales: { achieved: salesAchieved, target: SALES_TARGET, percent: Math.min(Math.round((salesAchieved / SALES_TARGET) * 100), 100) },
      docs: { achieved: docVisits, target: DOCS_TARGET, percent: Math.min(Math.round((docVisits / DOCS_TARGET) * 100), 100) },
      chemists: { achieved: chemistVisits, target: CHEMISTS_TARGET, percent: Math.min(Math.round((chemistVisits / CHEMISTS_TARGET) * 100), 100) }
    };
  },

  getPendingFollowUps: () => {
    const visits = safeJsonParse('web_doctor_visits');
   // const followUps = visits.filter((v: any) => v.followUpDate && v.followUpDate.trim() !== '');
    const followUps = visits.filter((v: any) => v.nextFollowUp && v.nextFollowUp.trim() !== '');
    let dueTodayCount = 0;
    let overdueCount = 0;
    const today = new Date();
    today.setHours(0,0,0,0);

    // const mappedFollowups = followUps.map((v: any) => {
    //   let status = 'Upcoming';
    //   if (isToday(v.followUpDate)) {
    //     status = 'Due Today';
    //     dueTodayCount++;
    //   } else {
    //     const fDate = new Date(v.followUpDate);
    //     if (!isNaN(fDate.getTime()) && fDate < today) {
    //       status = 'Overdue';
    //       overdueCount++;
    //     }
    //   }
    //   return {
    //     name: v.doctorName || v.name,
    //     status: status,
    //     date: v.followUpDate,
    //   };
    // });
    const mappedFollowups = followUps.map((v: any) => {
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
        name: v.doctorName || v.name,
        status: status,
        date: v.nextFollowUp,
      };
    });
    return {
      dueTodayCount,
      overdueCount,
      list: mappedFollowups.slice(0, 5) // Return top 5 for widget
    };
  },

  getTodaySchedule: () => {
    const visits = safeJsonParse('web_doctor_visits');
   // const followUps = visits.filter((v: any) => v.followUpDate && isToday(v.followUpDate));
    const followUps = visits.filter((v: any) => v.nextFollowUp && isToday(v.nextFollowUp));

    const schedule = followUps.map((v: any, idx: number) => ({
      time: `10:${idx}0 AM`,
      title: `Follow-up ${v.doctorName || v.name}`
    }));

    return schedule.length > 0 ? schedule : null;
  },

  getRecentOrders: () => {
    const orders = safeJsonParse('web_orders');
    return orders.slice(0, 3).map((o: any) => ({
      client: o.customerName || 'Client',
      amount: `₹${parseFloat(o.totalAmount || 0).toLocaleString()}`
    }));
  },

  getRecentVisits: () => {
    const docVisits = safeJsonParse('web_doctor_visits');
    const chemVisits = safeJsonParse('web_chemist_visits');
    
    const allVisits = [...docVisits.map((v: any) => ({ name: v.doctorName, time: v.visitTime || '10:30 AM'})), 
                       ...chemVisits.map((v: any) => ({ name: v.chemistName, time: v.visitTime || '11:15 AM'}))];
    
    return allVisits.slice(0, 3);
  },
  //   getTodayNotifications: () => {
  //   // Pulls from your Notifications module localStorage
  //   const notifs = safeJsonParse('web_notifications', [
  //     { message: 'Follow-up due for Dr. Sharma' },
  //     { message: 'Sales target reached 80%' },
  //     { message: 'Team meeting at 4:00 PM' }
  //   ]);
  //   return notifs.slice(0, 3); // Only show top 3 on dashboard
  // },
    getTodayNotifications: () => {
    let dynamicNotifs: any[] = [];

    // 1. Check for Follow-ups due today
    const visits = safeJsonParse('web_doctor_visits', []);
    const followUpsDueToday = visits.filter((v: any) => v.nextFollowUp && isToday(v.nextFollowUp));
    
    followUpsDueToday.forEach((f: any) => {
      dynamicNotifs.push({ message: `Follow-up due for ${f.doctorName || f.name}` });
    });

    // 2. Check for Meetings happening today
    const crmMeetings = safeJsonParse('crm_meetings', []);
    const mrMeetings = safeJsonParse('@mr_meetings', []);
    const allMeetings = [...crmMeetings, ...mrMeetings];
    
    const todayMeetings = allMeetings.filter((m: any) => m.status === 'Upcoming' && isToday(m.date));
    
    todayMeetings.forEach((m: any) => {
      dynamicNotifs.push({ message: `Meeting at ${m.time} with ${m.participant || m.client}` });
    });

    // 3. Optional: Read from general alerts if you have them
    const systemNotifs = safeJsonParse('@notifications', []);
    systemNotifs.forEach((n: any) => {
      dynamicNotifs.push({ message: n.title || n.message });
    });

    // 4. Return the data, or a fallback if nothing is scheduled
    if (dynamicNotifs.length === 0) {
      return [{ message: 'No new notifications today.' }];
    }

    // Return the top 3 most recent/important notifications
    return dynamicNotifs.slice(0, 3);
  },

  // getTodayRouteSummary: () => {
  //   // Pulls from your GPS module localStorage
  //   const routes = safeJsonParse('web_gps_routes', {
  //     totalDistance: '38 KM',
  //     routeActive: true
  //   });
  //   return routes;
  // }
    getTodayRouteSummary: () => {
    // 1. Fetch the real GPS logs (we will build the screen for this next!)
    const routeLogs = safeJsonParse('mr_location_logs', []);
    
    // 2. If no logs exist yet, return 0 KM
    if (routeLogs.length === 0) {
       return { 
         totalDistance: '0 KM', 
         routeActive: false 
       };
    }

    // 3. If we have logs, calculate the total distance travelled today
    let totalKm = 0;
    routeLogs.forEach((log: any) => {
       // Assuming each log has a distance property
       totalKm += (parseFloat(log.distance) || 0);
    });

    return {
      totalDistance: `${totalKm.toFixed(1)} KM`,
      routeActive: true
    };
  }
};
