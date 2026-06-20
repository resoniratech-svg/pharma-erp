const prisma = require("../../config/db");

const createMeetingRepo = async (data) => {
  const {
    mrId,
    title,
    description,
    meetingDate,
    location,
    doctorIds = [],
    chemistIds = [],
  } = data;

  return prisma.meeting.create({
    data: {
      mrId,
      title,
      description,
      meetingDate: new Date(meetingDate),
      location,

      meetingDoctors: {
        create: doctorIds.map((doctorId) => ({
          doctor: {
            connect: {
              id: doctorId,
            },
          },
        })),
      },

      meetingChemists: {
        create: chemistIds.map((chemistId) => ({
          chemist: {
            connect: {
              id: chemistId,
            },
          },
        })),
      },
    },

    include: {
      mr: true,

      meetingDoctors: {
        include: {
          doctor: true,
        },
      },

      meetingChemists: {
        include: {
          chemist: true,
        },
      },
    },
  });
};

const getAllMeetingsRepo = async () => {
  return prisma.meeting.findMany({
    include: {
      mr: true,

      meetingDoctors: {
        include: {
          doctor: true,
        },
      },

      meetingChemists: {
        include: {
          chemist: true,
        },
      },
    },
  });
};

const getMeetingByIdRepo = async (id) => {
  return prisma.meeting.findUnique({
    where: {
      id: Number(id),
    },

    include: {
      mr: true,

      meetingDoctors: {
        include: {
          doctor: true,
        },
      },

      meetingChemists: {
        include: {
          chemist: true,
        },
      },
    },
  });
};

const updateMeetingRepo = async (id, data) => {
  return prisma.meeting.update({
    where: {
      id: Number(id),
    },
    data,
  });
};

const deleteMeetingRepo = async (id) => {
  await prisma.meetingDoctor.deleteMany({
    where: {
      meetingId: Number(id),
    },
  });

  await prisma.meetingChemist.deleteMany({
    where: {
      meetingId: Number(id),
    },
  });

  return prisma.meeting.delete({
    where: {
      id: Number(id),
    },
  });
};

const getMeetingsByMrRepo = async (mrId) => {
  return prisma.meeting.findMany({
    where: {
      mrId: Number(mrId),
    },

    include: {
      mr: true,

      meetingDoctors: {
        include: {
          doctor: true,
        },
      },

      meetingChemists: {
        include: {
          chemist: true,
        },
      },
    },
  });
};

const getMeetingsByDateRepo = async (date) => {
  const start = new Date(date);
  const end = new Date(date);

  end.setDate(end.getDate() + 1);

  return prisma.meeting.findMany({
    where: {
      meetingDate: {
        gte: start,
        lt: end,
      },
    },

    include: {
      mr: true,
      meetingDoctors: true,
      meetingChemists: true,
    },
  });
};

const completeMeetingRepo = async (id) => {
  return prisma.meeting.update({
    where: {
      id: Number(id),
    },

    data: {
      status: "COMPLETED",
    },
  });
};

const cancelMeetingRepo = async (id) => {
  return prisma.meeting.update({
    where: {
      id: Number(id),
    },

    data: {
      status: "CANCELLED",
    },
  });
};

module.exports = {
  createMeetingRepo,
  getAllMeetingsRepo,
  getMeetingByIdRepo,
  updateMeetingRepo,
  deleteMeetingRepo,
  getMeetingsByMrRepo,
  getMeetingsByDateRepo,
  completeMeetingRepo,
  cancelMeetingRepo,
};