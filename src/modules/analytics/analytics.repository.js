const prisma = require("../../config/db");

const getDashboardAnalyticsRepo = async () => {
  const [
    totalMRs,
    totalDoctors,
    totalChemists,
    totalDoctorVisits,
    totalChemistVisits,
    totalMeetings,
    totalFollowUps,
    totalLeads,
    convertedLeads,
    pendingLeaves,
    approvedLeaves,
    pendingExpenses,
    approvedExpenses,
  ] = await Promise.all([
    prisma.mR.count(),
    prisma.doctor.count(),
    prisma.chemist.count(),
    prisma.doctorVisit.count(),
    prisma.chemistVisit.count(),
    prisma.meeting.count(),
    prisma.followUp.count(),
    prisma.lead.count(),

    prisma.lead.count({
      where: {
        status: "CONVERTED",
      },
    }),

    prisma.leaveRequest.count({
      where: {
        status: "PENDING",
      },
    }),

    prisma.leaveRequest.count({
      where: {
        status: "APPROVED",
      },
    }),

    prisma.expenseClaim.count({
      where: {
        status: "PENDING",
      },
    }),

    prisma.expenseClaim.count({
      where: {
        status: "APPROVED",
      },
    }),
  ]);

  return {
    totalMRs,
    totalDoctors,
    totalChemists,
    totalDoctorVisits,
    totalChemistVisits,
    totalMeetings,
    totalFollowUps,
    totalLeads,
    convertedLeads,
    pendingLeaves,
    approvedLeaves,
    pendingExpenses,
    approvedExpenses,
  };
};

const getLeadAnalyticsRepo = async () => {
  const [
    totalLeads,
    convertedLeads,
    pendingLeads,
  ] = await Promise.all([
    prisma.lead.count(),

    prisma.lead.count({
      where: {
        status: "CONVERTED",
      },
    }),

    prisma.lead.count({
      where: {
        status: {
          not: "CONVERTED",
        },
      },
    }),
  ]);

  return {
    totalLeads,
    convertedLeads,
    pendingLeads,
  };
};

const getExpenseAnalyticsRepo = async () => {
  const [
    pending,
    approved,
    rejected,
  ] = await Promise.all([
    prisma.expenseClaim.count({
      where: {
        status: "PENDING",
      },
    }),

    prisma.expenseClaim.count({
      where: {
        status: "APPROVED",
      },
    }),

    prisma.expenseClaim.count({
      where: {
        status: "REJECTED",
      },
    }),
  ]);

  return {
    pending,
    approved,
    rejected,
  };
};

const getLeaveAnalyticsRepo = async () => {
  const [
    pending,
    approved,
    rejected,
  ] = await Promise.all([
    prisma.leaveRequest.count({
      where: {
        status: "PENDING",
      },
    }),

    prisma.leaveRequest.count({
      where: {
        status: "APPROVED",
      },
    }),

    prisma.leaveRequest.count({
      where: {
        status: "REJECTED",
      },
    }),
  ]);

  return {
    pending,
    approved,
    rejected,
  };
};

const getMrPerformanceRepo = async () => {
  const mrs = await prisma.mR.findMany();

  const result = await Promise.all(
    mrs.map(async (mr) => {
      const doctorVisits =
        await prisma.doctorVisit.count({
          where: {
            mrId: mr.id,
          },
        });

      const chemistVisits =
        await prisma.chemistVisit.count({
          where: {
            mrId: mr.id,
          },
        });

      const meetings =
        await prisma.meeting.count({
          where: {
            mrId: mr.id,
          },
        });

      const followUps =
        await prisma.followUp.count({
          where: {
            mrId: mr.id,
          },
        });

      return {
        mrId: mr.id,
        mrName: mr.name,
        doctorVisits,
        chemistVisits,
        meetings,
        followUps,
      };
    })
  );

  return result;
};

const getMrDashboardAnalyticsRepo = async (mrId) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  // 1. Attendance for today
  const attendance = await prisma.attendance.findFirst({
    where: {
      mrId,
      attendanceDate: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
  });

  // 2. Doctor visits count for today
  const todayDocVisits = await prisma.doctorVisit.count({
    where: {
      mrId,
      visitDate: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
  });

  // 3. Chemist visits count for today
  const todayChemVisits = await prisma.chemistVisit.count({
    where: {
      mrId,
      visitDate: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
  });

  // 4a. Retailer orders for today
  const todayRetailerOrders = await prisma.retailerOrder.findMany({
    where: {
      mrId,
      createdAt: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
  });
  const todayRetailerOrdersCount = todayRetailerOrders.length;
  const todayRetailerOrdersAmount = todayRetailerOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // 4b. Chemist visits with orders (POB) for today
  const todayChemistOrderVisits = await prisma.chemistVisit.findMany({
    where: {
      mrId,
      visitDate: {
        gte: todayStart,
        lte: todayEnd,
      },
      orderValue: {
        gt: 0,
      },
    },
  });
  const todayChemistOrdersCount = todayChemistOrderVisits.length;
  const todayChemistOrdersAmount = todayChemistOrderVisits.reduce((sum, v) => sum + (v.orderValue || 0), 0);

  const todayOrdersCount = todayRetailerOrdersCount + todayChemistOrdersCount;
  const todayOrdersAmount = todayRetailerOrdersAmount + todayChemistOrdersAmount;

  // 5. Monthly doctor visits count
  const monthlyDocVisits = await prisma.doctorVisit.count({
    where: {
      mrId,
      visitDate: {
        gte: monthStart,
      },
    },
  });

  // 6. Monthly chemist visits count
  const monthlyChemVisits = await prisma.chemistVisit.count({
    where: {
      mrId,
      visitDate: {
        gte: monthStart,
      },
    },
  });

  // 7a. Monthly retailer orders amount
  const monthlyRetailerOrders = await prisma.retailerOrder.findMany({
    where: {
      mrId,
      createdAt: {
        gte: monthStart,
      },
    },
  });
  const monthlyRetailerSales = monthlyRetailerOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // 7b. Monthly chemist orders (POB) amount
  const monthlyChemistOrderVisits = await prisma.chemistVisit.findMany({
    where: {
      mrId,
      visitDate: {
        gte: monthStart,
      },
      orderValue: {
        gt: 0,
      },
    },
  });
  const monthlyChemistSales = monthlyChemistOrderVisits.reduce((sum, v) => sum + (v.orderValue || 0), 0);

  const monthlySalesAchieved = monthlyRetailerSales + monthlyChemistSales;

  // 8. Follow ups
  const followUps = await prisma.followUp.findMany({
    where: {
      mrId,
      status: "PENDING",
    },
    include: {
      doctor: true,
      chemist: true,
    },
    orderBy: {
      followUpDate: "asc",
    },
  });

  let dueTodayCount = 0;
  let overdueCount = 0;
  const now = new Date();
  now.setHours(0,0,0,0);

  const followUpList = followUps.map((f) => {
    const fDate = new Date(f.followUpDate);
    fDate.setHours(0,0,0,0);
    
    let status = 'Upcoming';
    if (fDate.getTime() === now.getTime()) {
      status = 'Due Today';
      dueTodayCount++;
    } else if (fDate.getTime() < now.getTime()) {
      status = 'Overdue';
      overdueCount++;
    }

    return {
      id: f.id,
      name: f.doctor?.name || f.chemist?.name || f.title,
      status,
      date: f.followUpDate,
    };
  });

  const SALES_TARGET = 50000;
  const DOCS_TARGET = 30;
  const CHEMISTS_TARGET = 20;

  return {
    attendance: {
      status: attendance ? 'Present' : 'Absent',
      checkInTime: attendance?.checkInTime || '',
      checkOutTime: attendance?.checkOutTime || '',
      locationVerified: !!attendance,
    },
    todayDoctorVisits: {
      completed: todayDocVisits,
      target: 15,
    },
    todayChemistVisits: {
      completed: todayChemVisits,
      target: 10,
    },
    todayOrders: {
      count: todayOrdersCount,
      amount: todayOrdersAmount,
    },
    monthlyProgress: {
      sales: {
        achieved: monthlySalesAchieved,
        target: SALES_TARGET,
        percent: Math.min(Math.round((monthlySalesAchieved / SALES_TARGET) * 100), 100),
      },
      docs: {
        achieved: monthlyDocVisits,
        target: DOCS_TARGET,
        percent: Math.min(Math.round((monthlyDocVisits / DOCS_TARGET) * 100), 100),
      },
      chemists: {
        achieved: monthlyChemVisits,
        target: CHEMISTS_TARGET,
        percent: Math.min(Math.round((monthlyChemVisits / CHEMISTS_TARGET) * 100), 100),
      },
    },
    pendingFollowUps: {
      dueTodayCount,
      overdueCount,
      list: followUpList.slice(0, 5),
    },
    todaySchedule: followUpList
      .filter(f => f.status === 'Due Today')
      .map((f, idx) => ({
        time: `10:${idx}0 AM`,
        title: `Follow-up ${f.name}`,
      })).slice(0, 4),
  };
};

module.exports = {
  getDashboardAnalyticsRepo,
  getMrDashboardAnalyticsRepo,
  getLeadAnalyticsRepo,
  getExpenseAnalyticsRepo,
  getLeaveAnalyticsRepo,
  getMrPerformanceRepo,
};