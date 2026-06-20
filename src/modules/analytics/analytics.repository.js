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

module.exports = {
  getDashboardAnalyticsRepo,
  getLeadAnalyticsRepo,
  getExpenseAnalyticsRepo,
  getLeaveAnalyticsRepo,
  getMrPerformanceRepo,
};