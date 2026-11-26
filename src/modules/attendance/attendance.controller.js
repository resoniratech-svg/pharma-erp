const prisma = require("../../config/db");
const service = require("./attendance.service");

const checkIn =
  async (req, res) => {
    try {
      if (req.user && ['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
        const dummyRecord = {
          id: 999900 + Math.floor(Math.random() * 100),
          mrId: 2,
          attendanceDate: new Date().toISOString(),
          checkInTime: new Date().toISOString(),
          checkOutTime: null,
          checkInLatitude: req.body.checkInLatitude || 18.4467,
          checkInLongitude: req.body.checkInLongitude || 79.1332,
          status: "PRESENT",
          createdAt: new Date().toISOString(),
          dayStatus: 'In-Progress'
        };
        return res.status(201).json({
          success: true,
          data: dummyRecord
        });
      }

      let mrId = Number(req.body.mrId);
      if (req.user && req.user.id) {
        let mr = await prisma.mR.findUnique({
          where: { userId: req.user.id },
        });
        if (!mr && ['NATIONAL_SALES_HEAD', 'REGIONAL_SALES_MANAGER', 'AREA_SALES_MANAGER'].includes(req.user.role)) {
          mr = await prisma.mR.create({
            data: {
              mrCode: `MGR-${req.user.id}`,
              name: req.user.name || req.user.role,
              mobile: req.user.mobile || '0000000000',
              userId: req.user.id,
              status: 'ACTIVE'
            }
          });
        }
        if (mr) {
          mrId = mr.id;
        }
      }

      const result =
        await service.checkInService({
          ...req.body,
          mrId,
          checkInTime: new Date(),
        });

      res.status(201).json({
        success: true,
        data: result,
      });

    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

const checkOut =
  async (req, res) => {
    try {
      if (req.user && ['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
        const dummyRecord = {
          id: Number(req.params.id) || 999900,
          mrId: 2,
          attendanceDate: new Date().toISOString(),
          checkInTime: new Date().toISOString(),
          checkOutTime: new Date().toISOString(),
          status: "PRESENT"
        };
        return res.status(200).json({
          success: true,
          data: dummyRecord
        });
      }

      let attendanceId = Number(req.params.id);
      
      if (isNaN(attendanceId) || attendanceId <= 0 || req.params.id === 'active') {
        let mrId = 1;
        if (req.user && req.user.id) {
          let mr = await prisma.mR.findUnique({
            where: { userId: req.user.id },
          });
          if (!mr && ['NATIONAL_SALES_HEAD', 'REGIONAL_SALES_MANAGER', 'AREA_SALES_MANAGER'].includes(req.user.role)) {
            mr = await prisma.mR.create({
              data: {
                mrCode: `MGR-${req.user.id}`,
                name: req.user.name || req.user.role,
                mobile: req.user.mobile || '0000000000',
                userId: req.user.id,
                status: 'ACTIVE'
              }
            });
          }
          if (mr) mrId = mr.id;
        }
        
        const latestRecord = await prisma.attendance.findFirst({
          where: { mrId, checkOutTime: null },
          orderBy: { id: 'desc' }
        });
        
        if (latestRecord) {
          attendanceId = latestRecord.id;
        } else {
          throw new Error("No active check-in record found to check out");
        }
      }

      const result =
        await service.checkOutService(
          attendanceId,
          {
            ...req.body,
            checkOutTime: new Date(),
          }
        );

      res.status(200).json({
        success: true,
        data: result,
      });

    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

const getAttendances =
  async (req, res) => {

    try {

      const result =
        await service.getAttendancesService();

      res.status(200).json({
        success: true,
        data: result,
      });

    } catch (error) {

      res.status(400).json({
        success: false,
        message:
          error.message,
      });

    }

  };

const getAttendanceById =
  async (req, res) => {
    try {
      if (isNaN(Number(req.params.id))) {
        if (req.params.id === 'status') {
          return getAttendanceStatus(req, res);
        }
        return res.status(404).json({
          success: false,
          message: 'Invalid attendance ID'
        });
      }

      const result =
        await service.getAttendanceByIdService(
          Number(req.params.id)
        );

      res.status(200).json({
        success: true,
        data: result,
      });

    } catch (error) {

      res.status(400).json({
        success: false,
        message:
          error.message,
      });

    }

  };

const getAttendanceByMR =
  async (req, res) => {

    try {

      const result =
        await service.getAttendanceByMRService(
          Number(req.params.mrId)
        );

      res.status(200).json({
        success: true,
        data: result,
      });

    } catch (error) {

      res.status(400).json({
        success: false,
        message:
          error.message,
      });

    }

  };

const getASMTeamAttendance = async (req, res) => {
  try {
    let employeeId = null;
    if (req.user) {
      const employee = await prisma.employee.findUnique({
        where: { userId: req.user.id }
      });
      if (employee) {
        employeeId = employee.id;
      }
    }
    
    // Fallback for testing: pick the first ASM if none is logged in
    if (!employeeId) {
      const asm = await prisma.employee.findFirst({
        where: { designation: "Area Sales Manager", status: "Active" }
      });
      if (asm) employeeId = asm.id;
    }

    let result = [];
    if (!employeeId) {
      result = await service.getAttendancesService();
    } else {
      result = await service.getASMTeamAttendanceService(employeeId);
    }
    
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAttendanceStatus = async (req, res) => {
  try {
    let mrId = null;
    if (req.user && req.user.id) {
      let mr = await prisma.mR.findUnique({
        where: { userId: req.user.id }
      });
      if (mr) mrId = mr.id;
    }
    if (!mrId && req.query.mrId) {
      mrId = Number(req.query.mrId);
    }

    if (!mrId) {
      return res.status(200).json({
        success: true,
        data: {
          isCheckedIn: false,
          isCheckedOut: false,
          activeRecord: null,
          todayRecord: null,
          records: []
        }
      });
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const records = await prisma.attendance.findMany({
      where: {
        mrId: mrId,
        attendanceDate: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      orderBy: { id: 'desc' }
    });

    const activeRecord = records.find(r => r.checkOutTime === null) || null;
    const completedRecord = records.find(r => r.checkOutTime !== null) || null;
    const latestRecord = records[0] || null;

    const isCheckedIn = !!activeRecord;
    const isCheckedOut = !isCheckedIn && !!completedRecord;

    return res.status(200).json({
      success: true,
      data: {
        isCheckedIn,
        isCheckedOut,
        activeRecord,
        todayRecord: latestRecord,
        records
      }
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  checkIn,
  checkOut,
  getAttendances,
  getAttendanceById,
  getAttendanceByMR,
  getASMTeamAttendance,
  getAttendanceStatus,
};