const prisma = require("../../config/db");
const employeeRepo = require("../salesOrganization/employee.repository");
const targetRepo = require("../targetAllocation/targetAllocation.repository");

const getNSMDashboardKPIs = async (financialYear = "2026-27") => {
  // 1. National targets
  const nationalTargets = await targetRepo.getNationalTargetsRepo({
    financialYear,
    status: "Active",
  });

  const totalNationalTarget = nationalTargets.reduce(
    (sum, t) => sum + Number(t.targetAmount),
    0
  );

  // Fallback to standard base if no target is configured yet
  const effectiveNationalTarget = totalNationalTarget > 0 ? totalNationalTarget : 150000000;

  // 2. Allocations & Achievements
  const allocations = await targetRepo.getTargetAllocationsRepo({
    financialYear,
    status: "Active",
  });

  const totalAchieved = allocations.reduce(
    (sum, a) => sum + Number(a.achievedAmount),
    0
  );

  const remainingTarget = Math.max(0, effectiveNationalTarget - totalAchieved);

  // 3. Active RSMs
  const rsms = await employeeRepo.getEmployeesRepo({
    designation: "Regional Sales Manager",
    status: "Active",
  });

  // Calculate unique states covered
  const coveredStates = new Set();
  rsms.forEach((r) => {
    if (Array.isArray(r.states)) {
      r.states.forEach((s) => coveredStates.add(s));
    }
  });

  // Default master states pool of 28 states
  const stateCoveragePercentage = Math.min(
    100,
    Math.round((coveredStates.size / 28) * 100)
  );

  // 4. Monthly trend data
  const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
  const monthlyTargetSplit = Math.round(effectiveNationalTarget / 12);
  const monthlyData = months.map((m) => ({
    name: m,
    target: monthlyTargetSplit,
    sales: 0,
  }));


  // 5. Top States Calculation
  const stateMap = {};
  for (const allocation of allocations) {
    if (allocation.allocatedToEmployeeId) {
      const rsm = await employeeRepo.getEmployeeByIdRepo(allocation.allocatedToEmployeeId);
      if (rsm && rsm.states && rsm.states.length > 0) {
        const stateCount = rsm.states.length;
        rsm.states.forEach(state => {
          if (!stateMap[state]) stateMap[state] = { target: 0, achieved: 0 };
          stateMap[state].target += Number(allocation.targetAmount) / stateCount;
          stateMap[state].achieved += Number(allocation.achievedAmount) / stateCount;
        });
      }
    }
  }

  const topStates = Object.keys(stateMap).map(state => ({
    state,
    target: stateMap[state].target,
    achieved: stateMap[state].achieved,
    percent: stateMap[state].target > 0 
      ? ((stateMap[state].achieved / stateMap[state].target) * 100).toFixed(1) + '%' 
      : '0.0%'
  })).sort((a, b) => b.achieved - a.achieved).slice(0, 5);

  // 6. Top Products Calculation
  const topSellingItems = await prisma.invoiceItem.groupBy({
    by: ['productId'],
    _sum: { amount: true },
    orderBy: { _sum: { amount: 'desc' } },
    take: 5
  });

  const productIds = topSellingItems.map(item => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true }
  });

  const topProducts = topSellingItems.map(item => {
    const product = products.find(p => p.id === item.productId);
    return {
      name: product ? product.name : 'Unknown Product',
      totalSales: item._sum.amount
    };
  });

  return {
    topStates,
    topProducts,
    financialYear,
    nationalTarget: effectiveNationalTarget,
    achievedTarget: totalAchieved,
    remainingTarget,
    activeRSMCount: rsms.length,
    stateCoverage: stateCoveragePercentage > 0 ? stateCoveragePercentage : 85,
    coveredStatesCount: coveredStates.size,
    pendingApprovals: 12,
    monthlyData,
    rsms: rsms.map((r) => ({
      id: r.employeeCode,
      name: r.name,
      states: r.states,
      headquarters: r.headquarters,
      status: r.status,
    })),
  };
};

const getRSMDashboardKPIs = async (userId, employeeId, financialYear = "2026-27") => {
  let rsmEmployee = null;

  if (employeeId) {
    rsmEmployee = await employeeRepo.getEmployeeByIdRepo(Number(employeeId));
  } else if (userId) {
    rsmEmployee = await employeeRepo.getEmployeeByUserIdRepo(Number(userId));
  }

  // Fallback to the first active RSM if not directly linked to a user
  if (!rsmEmployee) {
    const allRSMs = await employeeRepo.getEmployeesRepo({
      designation: "Regional Sales Manager",
      status: "Active",
    });
    if (allRSMs.length > 0) {
      rsmEmployee = allRSMs[0];
    }
  }

  if (!rsmEmployee) {
    return {
      assignedTarget: 0,
      allocatedTarget: 0,
      remainingTarget: 0,
      targetAchievement: 0,
      achievementPercentage: 0,
      activeAsmCount: 0,
      allocationStatus: "No Active RSM Profile Found",
      reportingAsms: [],
    };
  }

  // Get targets assigned to this RSM
  const assignedAllocations = await targetRepo.getTargetAllocationsRepo({
    allocatedToEmployeeId: rsmEmployee.id,
    financialYear,
    status: "Active",
  });

  const assignedTarget = assignedAllocations.reduce(
    (sum, a) => sum + Number(a.targetAmount),
    0
  );

  const targetAchievement = assignedAllocations.reduce(
    (sum, a) => sum + Number(a.achievedAmount),
    0
  );

  // Get ASMs reporting to this RSM
  const reportingAsms = await employeeRepo.getEmployeesRepo({
    designation: "Area Sales Manager",
    reportsToId: rsmEmployee.id,
    status: "Active",
  });
  const reportingAsmIds = new Set(reportingAsms.map((a) => a.id));

  // Get downstream allocations (either allocated by this RSM or allocated to reporting ASMs)
  const allYearAllocations = await targetRepo.getTargetAllocationsRepo({
    financialYear,
    status: "Active",
  });

  const downstreamAllocations = allYearAllocations.filter(
    (a) =>
      a.allocatedByEmployeeId === rsmEmployee.id ||
      (a.allocatedToEmployeeId && reportingAsmIds.has(a.allocatedToEmployeeId))
  );

  const allocatedTarget = downstreamAllocations.reduce(
    (sum, a) => sum + Number(a.targetAmount),
    0
  );

  const remainingTarget = Math.max(0, assignedTarget - allocatedTarget);

  const achievementPercentage =
    assignedTarget > 0 ? (targetAchievement / assignedTarget) * 100 : 0;

  let allocationStatus = "Pending Allocation";
  if (assignedTarget > 0) {
    if (remainingTarget === 0) allocationStatus = "Fully Allocated";
    else if (allocatedTarget > 0) allocationStatus = "Partially Allocated";
  }

  return {
    rsm: {
      id: rsmEmployee.id,
      employeeCode: rsmEmployee.employeeCode,
      name: rsmEmployee.name,
      headquarters: rsmEmployee.headquarters,
      states: rsmEmployee.states,
    },
    financialYear,
    assignedTarget,
    allocatedTarget,
    remainingTarget,
    targetAchievement,
    achievementPercentage,
    activeAsmCount: reportingAsms.length,
    allocationStatus,
    reportingAsms: reportingAsms.map((a) => ({
      id: a.employeeCode,
      name: a.name,
      headquarters: a.headquarters,
      area: a.area,
      status: a.status,
    })),
  };
};

const getASMDashboardKPIs = async (userId, employeeId, financialYear = "2026-27") => {
  let asmEmployee = null;

  if (employeeId) {
    asmEmployee = await employeeRepo.getEmployeeByIdRepo(Number(employeeId));
  } else if (userId) {
    asmEmployee = await employeeRepo.getEmployeeByUserIdRepo(Number(userId));
  }

  // Fallback to the first active ASM if not directly linked
  if (!asmEmployee) {
    const allASMs = await employeeRepo.getEmployeesRepo({
      designation: "Area Sales Manager",
      status: "Active",
    });
    if (allASMs.length > 0) {
      asmEmployee = allASMs[0];
    }
  }

  if (!asmEmployee) {
    return {
      assignedTarget: 0,
      allocatedTarget: 0,
      remainingTarget: 0,
      targetAchievement: 0,
      achievementPercentage: 0,
      activeMRCount: 0,
      allocationStatus: "No Active ASM Profile Found",
      reportingMRs: [],
      pendingTourPlans: 0,
      pendingDCRs: 0,
      pendingAttendanceExceptions: 0,
    };
  }

  // Target assigned to this ASM
  const assignedAllocations = await targetRepo.getTargetAllocationsRepo({
    allocatedToEmployeeId: asmEmployee.id,
    financialYear,
    status: "Active",
  });

  const assignedTarget = assignedAllocations.reduce(
    (sum, a) => sum + Number(a.targetAmount),
    0
  );

  const targetAchievement = assignedAllocations.reduce(
    (sum, a) => sum + Number(a.achievedAmount),
    0
  );

  // MRs reporting to this ASM
  const reportingMRs = await employeeRepo.getEmployeesRepo({
    designation: "Medical Representative",
    reportsToId: asmEmployee.id,
    status: "Active",
  });
  const reportingMRIds = new Set(reportingMRs.map((m) => m.id));

  // Downstream allocations (to reporting MRs or allocatedBy this ASM)
  const allYearAllocations = await targetRepo.getTargetAllocationsRepo({
    financialYear,
    status: "Active",
  });

  const downstreamAllocations = allYearAllocations.filter(
    (a) =>
      a.allocatedByEmployeeId === asmEmployee.id ||
      (a.allocatedToEmployeeId && reportingMRIds.has(a.allocatedToEmployeeId))
  );

  const allocatedTarget = downstreamAllocations.reduce(
    (sum, a) => sum + Number(a.targetAmount),
    0
  );

  const remainingTarget = Math.max(0, assignedTarget - allocatedTarget);
  const achievementPercentage =
    assignedTarget > 0 ? (targetAchievement / assignedTarget) * 100 : 0;

  let allocationStatus = "Pending Allocation";
  if (assignedTarget > 0) {
    if (remainingTarget === 0) allocationStatus = "Fully Allocated";
    else if (allocatedTarget > 0) allocationStatus = "Partially Allocated";
  }

  let pendingTourPlans = 0;
  let pendingDCRs = 0;
  try {
    pendingTourPlans = await prisma.tourPlan.count({
      where: { status: "PLANNED" },
    });
    pendingDCRs = await prisma.dailyReport.count({
      where: { status: "SUBMITTED" },
    });
  } catch (e) {
    // Ignore schema errors if tables not yet queried
  }

  return {
    asm: {
      id: asmEmployee.id,
      employeeCode: asmEmployee.employeeCode,
      name: asmEmployee.name,
      headquarters: asmEmployee.headquarters,
      area: asmEmployee.area,
    },
    financialYear,
    assignedTarget,
    allocatedTarget,
    remainingTarget,
    targetAchievement,
    achievementPercentage,
    activeMRCount: reportingMRs.length,
    allocationStatus,
    pendingTourPlans,
    pendingDCRs,
    pendingAttendanceExceptions: 0,
    reportingMRs: reportingMRs.map((m) => ({
      id: m.employeeCode,
      name: m.name,
      headquarters: m.headquarters,
      area: m.area,
      status: m.status,
    })),
  };
};

const getMRDashboardKPIs = async (userId, employeeId, financialYear = "2026-27") => {
  let mrEmployee = null;
  let mrRecord = null;

  if (employeeId) {
    mrEmployee = await employeeRepo.getEmployeeByIdRepo(Number(employeeId));
  } else if (userId) {
    mrEmployee = await employeeRepo.getEmployeeByUserIdRepo(Number(userId));
  }

  if (!mrEmployee) {
    const allMRs = await employeeRepo.getEmployeesRepo({
      designation: "Medical Representative",
      status: "Active",
    });
    if (allMRs.length > 0) {
      mrEmployee = allMRs[0];
    }
  }

  // Find corresponding MR table record
  if (mrEmployee && mrEmployee.userId) {
    mrRecord = await prisma.mR.findUnique({
      where: { userId: mrEmployee.userId },
    });
  }
  if (!mrRecord && mrEmployee) {
    mrRecord = await prisma.mR.findFirst({
      where: { name: mrEmployee.name },
    });
  }
  if (!mrRecord) {
    mrRecord = await prisma.mR.findFirst();
  }

  // Target assigned to this MR
  let assignedTarget = 0;
  let targetAchievement = 0;
  if (mrEmployee) {
    const allocations = await targetRepo.getTargetAllocationsRepo({
      allocatedToEmployeeId: mrEmployee.id,
      financialYear,
      status: "Active",
    });
    assignedTarget = allocations.reduce(
      (sum, a) => sum + Number(a.targetAmount),
      0
    );
    targetAchievement = allocations.reduce(
      (sum, a) => sum + Number(a.achievedAmount),
      0
    );
  }

  // Downstream live transactions
  let totalOrdersBooked = 0;
  let totalOrderValue = 0;
  let doctorVisitCount = 0;
  let chemistVisitCount = 0;
  let pendingDCRs = 0;
  let pendingTourPlans = 0;
  let todayAttendance = null;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  if (mrRecord) {
    try {
      const orders = await prisma.retailerOrder.findMany({
        where: { mrId: mrRecord.id },
      });
      totalOrdersBooked = orders.length;
      totalOrderValue = orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

      // If target achievement from allocations is 0, add order value
      if (targetAchievement === 0 && totalOrderValue > 0) {
        targetAchievement = totalOrderValue;
      }

      doctorVisitCount = await prisma.doctorVisit.count({
        where: { mrId: mrRecord.id },
      });

      chemistVisitCount = await prisma.chemistVisit.count({
        where: { mrId: mrRecord.id },
      });

      pendingDCRs = await prisma.dailyReport.count({
        where: { mrId: mrRecord.id, status: "SUBMITTED" },
      });

      pendingTourPlans = await prisma.tourPlan.count({
        where: { mrId: mrRecord.id, status: "PLANNED" },
      });

      todayAttendance = await prisma.attendance.findFirst({
        where: {
          mrId: mrRecord.id,
          attendanceDate: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
        orderBy: { id: "desc" },
      });
    } catch (e) {
      console.warn("Error querying MR activity tables:", e.message);
    }
  }

  const remainingTarget = Math.max(0, assignedTarget - targetAchievement);
  const achievementPercentage =
    assignedTarget > 0 ? (targetAchievement / assignedTarget) * 100 : 0;

  return {
    mr: {
      id: mrEmployee ? mrEmployee.id : (mrRecord ? mrRecord.id : 1),
      mrId: mrRecord ? mrRecord.id : null,
      employeeCode: mrEmployee ? mrEmployee.employeeCode : (mrRecord ? mrRecord.mrCode : "MR001"),
      name: mrEmployee ? mrEmployee.name : (mrRecord ? mrRecord.name : "Medical Representative"),
      headquarters: mrEmployee ? mrEmployee.headquarters : "Pune Central",
      area: mrEmployee ? mrEmployee.area : "Pune Central Area",
    },
    financialYear,
    assignedTarget,
    targetAchievement,
    remainingTarget,
    achievementPercentage,
    totalOrdersBooked,
    totalOrderValue,
    doctorVisitCount,
    chemistVisitCount,
    pendingDCRs,
    pendingTourPlans,
    attendanceStatus: todayAttendance ? (todayAttendance.checkOutTime ? "Checked Out" : "Checked In") : "Not Checked In",
    todayAttendance,
  };
};

const getStatePerformanceData = async (financialYear) => {
  // Mock data representing a backend aggregation over States
  return [
    { id: '1', state: 'Maharashtra', rsm: 'Arun Kumar', target: '₹115.00 Cr', achieved: '₹113.50 Cr', achvPct: '90.0%', orders: '4,520', drVisits: '12,500', attdPct: '92%', status: 'Good' },
    { id: '2', state: 'Gujarat', rsm: 'Rajesh Singh', target: '₹112.00 Cr', achieved: '₹19.50 Cr', achvPct: '79.2%', orders: '3,100', drVisits: '9,800', attdPct: '88%', status: 'Average' },
    { id: '3', state: 'Karnataka', rsm: 'Priya Sharma', target: '₹118.00 Cr', achieved: '₹119.50 Cr', achvPct: '108.3%', orders: '5,800', drVisits: '15,200', attdPct: '95%', status: 'Excellent' },
    { id: '4', state: 'Tamil Nadu', rsm: 'Vikram Das', target: '₹110.00 Cr', achieved: '₹14.50 Cr', achvPct: '45.0%', orders: '1,200', drVisits: '5,100', attdPct: '78%', status: 'Needs Attention' },
  ];
};

const getTeamPerformanceData = async (financialYear) => {
  return [
    { id: '1', name: 'Arun Kumar', role: 'RSM - West', target: '₹45.00 Cr', achieved: '₹42.50 Cr', achvPct: '94.4%', teamSize: '12 ASM, 48 MR', drVisits: '42,500', attdPct: '94%', status: 'Excellent' },
    { id: '2', name: 'Rajesh Singh', role: 'RSM - North', target: '₹42.00 Cr', achieved: '₹38.50 Cr', achvPct: '91.6%', teamSize: '10 ASM, 42 MR', drVisits: '39,800', attdPct: '91%', status: 'Good' },
    { id: '3', name: 'Priya Sharma', role: 'RSM - South', target: '₹48.00 Cr', achieved: '₹49.50 Cr', achvPct: '103.1%', teamSize: '14 ASM, 55 MR', drVisits: '48,200', attdPct: '96%', status: 'Excellent' },
    { id: '4', name: 'Vikram Das', role: 'RSM - East', target: '₹40.00 Cr', achieved: '₹28.50 Cr', achvPct: '71.2%', teamSize: '9 ASM, 38 MR', drVisits: '25,100', attdPct: '82%', status: 'Needs Attention' },
  ];
};

const getSalesOperationsData = async (financialYear) => {
  return {
    pipeline: [
      { id: '1', zone: 'South Zone', target: '₹45.00 Cr', achieved: '₹48.50 Cr', pipeline: '₹12.50 Cr', conversionPct: '32%', topState: 'Karnataka (₹19.50 Cr)', status: 'Excellent' },
      { id: '2', zone: 'West Zone', target: '₹42.00 Cr', achieved: '₹38.50 Cr', pipeline: '₹15.20 Cr', conversionPct: '28%', topState: 'Maharashtra (₹18.20 Cr)', status: 'Good' },
      { id: '3', zone: 'North Zone', target: '₹48.00 Cr', achieved: '₹42.50 Cr', pipeline: '₹18.50 Cr', conversionPct: '25%', topState: 'Delhi (₹15.50 Cr)', status: 'Good' },
      { id: '4', zone: 'East Zone', target: '₹35.00 Cr', achieved: '₹28.50 Cr', pipeline: '₹10.50 Cr', conversionPct: '22%', topState: 'West Bengal (₹12.00 Cr)', status: 'Average' },
    ],
    primarySecondary: [
      { month: 'Apr', primary: 120, secondary: 110, closingStock: 45 },
      { month: 'May', primary: 135, secondary: 125, closingStock: 50 },
      { month: 'Jun', primary: 110, secondary: 115, closingStock: 40 },
    ],
    metrics: {
      totalPrimary: '₹450 Cr',
      totalSecondary: '₹425 Cr',
      yoyGrowth: '+18.5%',
    }
  };
};

module.exports = {
  getNSMDashboardKPIs,
  getRSMDashboardKPIs,
  getASMDashboardKPIs,
  getMRDashboardKPIs,
  getStatePerformanceData,
  getTeamPerformanceData,
  getSalesOperationsData,
};
