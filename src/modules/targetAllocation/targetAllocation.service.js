const repo = require("./targetAllocation.repository");
const employeeRepo = require("../salesOrganization/employee.repository");
const prisma = require("../../config/db");

// --- Code Generators ---

const generateTargetCode = async (financialYear) => {
  const fy = financialYear ? financialYear.replace(/[^0-9-]/g, "") : "2026-27";
  const count = await prisma.nationalTarget.count();
  return `NAT-${fy}-${String(count + 1).padStart(3, "0")}`;
};

const generateAllocationCode = async () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(100 + Math.random() * 900);
  return `ALL-${timestamp}-${random}`;
};

// --- National Target Business Logic ---

const createNationalTargetService = async (data, user) => {
  let createdByEmployeeId = data.createdByEmployeeId ? Number(data.createdByEmployeeId) : null;
  
  if (!createdByEmployeeId && user) {
    const emp = await employeeRepo.getEmployeeByUserIdRepo(user.id);
    if (emp) createdByEmployeeId = emp.id;
  }

  const targetCode = data.targetCode || (await generateTargetCode(data.financialYear));

  const parseDate = (d, fallback) => {
    if (!d) return fallback;
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? fallback : parsed;
  };

  const payload = {
    targetCode,
    financialYear: data.financialYear || "2026-27",
    planningPeriod: data.planningPeriod || "Annual",
    targetType: data.targetType || "Sales Value",
    targetAmount: Number(data.targetAmount) || 0,
    startDate: parseDate(data.startDate, new Date("2026-04-01")),
    endDate: parseDate(data.endDate, new Date("2027-03-31")),
    remarks: data.remarks || null,
    createdByEmployeeId,
    status: data.status || "Active",
  };

  return repo.createNationalTargetRepo(payload);
};

const getNationalTargetsService = async (filters = {}) => {
  return repo.getNationalTargetsRepo(filters);
};

const getNationalTargetByIdService = async (id) => {
  const target = await repo.getNationalTargetByIdRepo(id);
  if (!target) {
    throw new Error("National target not found");
  }
  return target;
};

const updateNationalTargetService = async (id, data) => {
  const existing = await repo.getNationalTargetByIdRepo(id);
  if (!existing) {
    throw new Error("National target not found");
  }

  const payload = {};
  if (data.targetAmount !== undefined) payload.targetAmount = Number(data.targetAmount);
  if (data.planningPeriod !== undefined) payload.planningPeriod = data.planningPeriod;
  if (data.targetType !== undefined) payload.targetType = data.targetType;
  if (data.startDate !== undefined) payload.startDate = new Date(data.startDate);
  if (data.endDate !== undefined) payload.endDate = new Date(data.endDate);
  if (data.remarks !== undefined) payload.remarks = data.remarks;
  if (data.status !== undefined) payload.status = data.status;

  return repo.updateNationalTargetRepo(id, payload);
};

// --- Target Allocation Business Logic ---

const allocateTargetService = async (data, user) => {
  let allocatedByEmployeeId = data.allocatedByEmployeeId ? Number(data.allocatedByEmployeeId) : null;
  
  if (!allocatedByEmployeeId && user) {
    const emp = await employeeRepo.getEmployeeByUserIdRepo(user.id);
    if (emp) allocatedByEmployeeId = emp.id;
  }

  const targetAmount = Number(data.targetAmount) || 0;
  if (targetAmount <= 0) {
    throw new Error("Allocation amount must be greater than 0");
  }

  // Validate pool limit if nationalTargetId is given
  if (data.nationalTargetId) {
    const nationalTarget = await repo.getNationalTargetByIdRepo(data.nationalTargetId);
    if (!nationalTarget) throw new Error("National target not found");

    const existingAllocations = await repo.getTargetAllocationsRepo({
      nationalTargetId: data.nationalTargetId,
      status: "Active",
    });

    const totalAllocated = existingAllocations.reduce(
      (sum, a) => sum + Number(a.targetAmount),
      0
    );

    const nationalAmount = Number(nationalTarget.targetAmount);
    if (totalAllocated + targetAmount > nationalAmount) {
      const remaining = nationalAmount - totalAllocated;
      throw new Error(
        `Cannot allocate ₹${targetAmount}. Maximum remaining pool is ₹${remaining}`
      );
    }
  }

  // Validate pool limit if sourceAllocationId is given (e.g. RSM allocating to ASM)
  if (data.sourceAllocationId) {
    const parentAlloc = await repo.getTargetAllocationByIdRepo(data.sourceAllocationId);
    if (!parentAlloc) throw new Error("Source allocation not found");

    const childAllocations = await repo.getTargetAllocationsRepo({
      sourceAllocationId: data.sourceAllocationId,
      status: "Active",
    });

    const totalAllocated = childAllocations.reduce(
      (sum, a) => sum + Number(a.targetAmount),
      0
    );

    const parentAmount = Number(parentAlloc.targetAmount);
    if (totalAllocated + targetAmount > parentAmount) {
      const remaining = parentAmount - totalAllocated;
      throw new Error(
        `Cannot allocate ₹${targetAmount}. Maximum remaining pool is ₹${remaining}`
      );
    }
  }

  const allocationCode = data.allocationCode || (await generateAllocationCode());

  const parseDate = (d, fallback) => {
    if (!d) return fallback;
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? fallback : parsed;
  };

  const payload = {
    allocationCode,
    nationalTargetId: data.nationalTargetId ? Number(data.nationalTargetId) : null,
    sourceAllocationId: data.sourceAllocationId ? Number(data.sourceAllocationId) : null,
    financialYear: data.financialYear || "2026-27",
    allocationPeriod: data.allocationPeriod || "Annual",
    allocatedToEmployeeId: Number(data.allocatedToEmployeeId),
    allocatedByEmployeeId,
    targetAmount,
    achievedAmount: Number(data.achievedAmount) || 0,
    startDate: parseDate(data.startDate, new Date("2026-04-01")),
    endDate: parseDate(data.endDate, new Date("2027-03-31")),
    remarks: data.remarks || null,
    status: data.status || "Active",
  };

  return repo.createTargetAllocationRepo(payload);
};

const getTargetAllocationsService = async (filters = {}) => {
  return repo.getTargetAllocationsRepo(filters);
};

const getTargetAllocationByIdService = async (id) => {
  const allocation = await repo.getTargetAllocationByIdRepo(id);
  if (!allocation) {
    throw new Error("Target allocation not found");
  }
  return allocation;
};

// Summary for National Sales Head (NSM Overview)
const getNationalTargetSummaryService = async (financialYear = "2026-27") => {
  const nationalTargets = await repo.getNationalTargetsRepo({
    financialYear,
    status: "Active",
  });

  const totalNational = nationalTargets.reduce(
    (sum, t) => sum + Number(t.targetAmount),
    0
  );

  const allocations = await repo.getTargetAllocationsRepo({
    financialYear,
    status: "Active",
  });

  const allocatedToRSMs = allocations
    .filter((a) => a.nationalTargetId !== null)
    .reduce((sum, a) => sum + Number(a.targetAmount), 0);

  const totalAchieved = allocations.reduce(
    (sum, a) => sum + Number(a.achievedAmount),
    0
  );

  const remainingToAllocate = Math.max(0, totalNational - allocatedToRSMs);

  return {
    financialYear,
    totalNationalTarget: totalNational,
    totalAllocatedToRSMs: allocatedToRSMs,
    remainingToAllocate,
    totalAchieved,
    allocationCount: allocations.length,
    nationalTargets,
  };
};

// Summary for Regional Sales Manager (RSM Overview)
const getRSMTargetSummaryService = async (employeeId, financialYear = "2026-27") => {
  let resolvedEmpId = employeeId ? Number(employeeId) : null;

  if (!resolvedEmpId) {
    const allRSMs = await employeeRepo.getEmployeesRepo({
      designation: "Regional Sales Manager",
      status: "Active",
    });
    if (allRSMs.length > 0) resolvedEmpId = allRSMs[0].id;
  }

  if (!resolvedEmpId) {
    return [];
  }

  // Find allocations where this RSM is the recipient
  const assignedAllocations = await repo.getTargetAllocationsRepo({
    allocatedToEmployeeId: resolvedEmpId,
    financialYear,
    status: "Active",
  });

  // Find ASMs reporting to this RSM
  const reportingAsms = await employeeRepo.getEmployeesRepo({
    designation: "Area Sales Manager",
    reportsToId: resolvedEmpId,
    status: "Active",
  });
  const reportingAsmIds = new Set(reportingAsms.map((a) => a.id));

  const allAllocations = await repo.getTargetAllocationsRepo({
    financialYear,
    status: "Active",
  });

  const summaries = await Promise.all(
    assignedAllocations.map(async (parentAlloc) => {
      // Find downstream allocations made by this RSM out of this allocation or to reporting ASMs
      const childAllocations = allAllocations.filter(
        (a) =>
          a.sourceAllocationId === parentAlloc.id ||
          a.allocatedByEmployeeId === resolvedEmpId ||
          (a.allocatedToEmployeeId && reportingAsmIds.has(a.allocatedToEmployeeId))
      );

      const allocatedAmount = childAllocations.reduce(
        (sum, a) => sum + Number(a.targetAmount),
        0
      );

      const targetAmount = Number(parentAlloc.targetAmount);
      const remainingAmount = Math.max(0, targetAmount - allocatedAmount);

      return {
        parentAllocation: parentAlloc,
        allocatedAmount,
        remainingAmount,
        allocations: childAllocations,
        achievement: Number(parentAlloc.achievedAmount) || 0,
      };
    })
  );

  return summaries;
};

// Summary for Area Sales Manager (ASM Overview)
const getASMTargetSummaryService = async (employeeId, financialYear = "2026-27") => {
  let resolvedEmpId = employeeId ? Number(employeeId) : null;

  if (!resolvedEmpId) {
    const allASMs = await employeeRepo.getEmployeesRepo({
      designation: "Area Sales Manager",
      status: "Active",
    });
    if (allASMs.length > 0) resolvedEmpId = allASMs[0].id;
  }

  if (!resolvedEmpId) {
    return [];
  }

  // Find allocations where this ASM is the recipient
  const assignedAllocations = await repo.getTargetAllocationsRepo({
    allocatedToEmployeeId: resolvedEmpId,
    financialYear,
    status: "Active",
  });

  // Find MRs reporting to this ASM
  const reportingMRs = await employeeRepo.getEmployeesRepo({
    designation: "Medical Representative",
    reportsToId: resolvedEmpId,
    status: "Active",
  });
  const reportingMRIds = new Set(reportingMRs.map((m) => m.id));

  const allAllocations = await repo.getTargetAllocationsRepo({
    financialYear,
    status: "Active",
  });

  const summaries = await Promise.all(
    assignedAllocations.map(async (parentAlloc) => {
      // Find downstream allocations made by this ASM to reporting MRs
      const childAllocations = allAllocations.filter(
        (a) =>
          a.sourceAllocationId === parentAlloc.id ||
          a.allocatedByEmployeeId === resolvedEmpId ||
          (a.allocatedToEmployeeId && reportingMRIds.has(a.allocatedToEmployeeId))
      );

      const allocatedAmount = childAllocations.reduce(
        (sum, a) => sum + Number(a.targetAmount),
        0
      );

      const targetAmount = Number(parentAlloc.targetAmount);
      const remainingAmount = Math.max(0, targetAmount - allocatedAmount);

      return {
        parentAllocation: parentAlloc,
        allocatedAmount,
        remainingAmount,
        allocations: childAllocations,
        achievement: Number(parentAlloc.achievedAmount) || 0,
      };
    })
  );

  return summaries;
};

const updateTargetAllocationService = async (id, data) => {
  const existing = await repo.getTargetAllocationByIdRepo(id);
  if (!existing) {
    throw new Error("Target allocation not found");
  }

  const payload = {};
  if (data.targetAmount !== undefined) payload.targetAmount = Number(data.targetAmount);
  if (data.achievedAmount !== undefined) payload.achievedAmount = Number(data.achievedAmount);
  if (data.startDate !== undefined) payload.startDate = new Date(data.startDate);
  if (data.endDate !== undefined) payload.endDate = new Date(data.endDate);
  if (data.remarks !== undefined) payload.remarks = data.remarks;
  if (data.status !== undefined) payload.status = data.status;

  return repo.updateTargetAllocationRepo(id, payload);
};

const deleteTargetAllocationService = async (id) => {
  const existing = await repo.getTargetAllocationByIdRepo(id);
  if (!existing) {
    throw new Error("Target allocation not found");
  }
  return repo.deleteTargetAllocationRepo(id);
};

module.exports = {
  createNationalTargetService,
  getNationalTargetsService,
  getNationalTargetByIdService,
  updateNationalTargetService,
  allocateTargetService,
  getTargetAllocationsService,
  getTargetAllocationByIdService,
  getNationalTargetSummaryService,
  getRSMTargetSummaryService,
  getASMTargetSummaryService,
  updateTargetAllocationService,
  deleteTargetAllocationService,
};
