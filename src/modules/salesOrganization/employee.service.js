const repo = require("./employee.repository");
const prisma = require("../../config/db");
const bcrypt = require("bcrypt");

const generateEmployeeCode = async (designation, preferredCode = null) => {
  let prefix = "EMP-";
  if (designation === "National Sales Head" || designation === "NATIONAL_SALES_HEAD") prefix = "EMP-NSM-";
  else if (designation === "Regional Sales Manager" || designation === "REGIONAL_SALES_MANAGER") prefix = "EMP-RSM-";
  else if (designation === "Area Sales Manager" || designation === "AREA_SALES_MANAGER") prefix = "EMP-ASM-";
  else if (designation === "Medical Representative" || designation === "MEDICAL_REPRESENTATIVE") prefix = "EMP-MR-";

  const allEmployees = await repo.getEmployeesRepo();
  const existingCodes = new Set(allEmployees.map((e) => (e.employeeCode || "").toUpperCase().trim()));

  if (preferredCode && preferredCode.trim() && !existingCodes.has(preferredCode.toUpperCase().trim())) {
    return preferredCode.trim();
  }

  const altPrefix = prefix.replace("EMP-", "").replace("-", ""); // e.g. "RSM"
  let maxNum = 0;
  for (const emp of allEmployees) {
    const code = (emp.employeeCode || "").trim();
    if (code.startsWith(prefix)) {
      const num = parseInt(code.replace(prefix, ""), 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    } else if (code.startsWith(altPrefix)) {
      const num = parseInt(code.replace(altPrefix, ""), 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
  }

  let nextNum = maxNum + 1;
  let candidate = `${prefix}${String(nextNum).padStart(3, "0")}`;
  while (existingCodes.has(candidate.toUpperCase())) {
    nextNum++;
    candidate = `${prefix}${String(nextNum).padStart(3, "0")}`;
  }

  return candidate;
};

const createEmployeeService = async (data) => {
  const employeeName = data.name || data.employeeName || "Employee";

  const employeeCode = await generateEmployeeCode(data.designation, data.employeeCode);

  if (data.email) {
    const existingEmp = await prisma.employee.findUnique({
      where: { email: data.email }
    });
    if (existingEmp) {
      throw new Error(`An employee with email "${data.email}" already exists.`);
    }
  }

  // Handle password / user creation if provided
  let userId = data.userId ? Number(data.userId) : null;
  if (data.email && data.password && !userId) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      let role = "REGIONAL_SALES_MANAGER";
      if (data.designation === "National Sales Head") role = "NATIONAL_SALES_HEAD";
      if (data.designation === "Area Sales Manager") role = "AREA_SALES_MANAGER";
      if (data.designation === "Medical Representative") role = "MEDICAL_REPRESENTATIVE";

      const newUser = await prisma.user.create({
        data: {
          name: employeeName,
          email: data.email,
          password: hashedPassword,
          role,
          mobile: data.mobile || null,
        },
      });
      userId = newUser.id;
    } else {
      userId = existingUser.id;
    }
  }

  // Resolve manager name if reportsToId is passed
  let reportsTo = data.reportsTo || null;
  let reportsToId = data.reportsToId ? Number(data.reportsToId) : null;
  if (!reportsToId && data.creatorUserId) {
    let currentEmp = await repo.getEmployeeByUserIdRepo(data.creatorUserId);
    
    // Fallback if user lacks employee record
    if (!currentEmp && data.creatorUserRole) {
      const all = await repo.getEmployeesRepo();
      if (data.creatorUserRole === 'NATIONAL_SALES_HEAD' || data.creatorUserRole === 'National Sales Head') {
        currentEmp = all.find((e) => e.designation === 'National Sales Head');
      } else if (data.creatorUserRole === 'REGIONAL_SALES_MANAGER' || data.creatorUserRole === 'Regional Sales Manager') {
        currentEmp = all.find((e) => e.designation === 'Regional Sales Manager');
      }
    }

    if (currentEmp) {
      reportsToId = currentEmp.id;
      if (!reportsTo) reportsTo = currentEmp.name;
    }
  }
  if (reportsToId && !reportsTo) {
    const manager = await repo.getEmployeeByIdRepo(reportsToId);
    if (manager) reportsTo = manager.name;
  }

  const payload = {
    employeeCode,
    name: employeeName,
    designation: data.designation,
    reportsToId,
    reportsTo,
    zone: data.zone || null,
    region: data.region || null,
    area: data.area || null,
    headquarters: data.headquarters || data.hq || null,
    states: (Array.isArray(data.states) && data.states.length > 0) ? data.states : (data.state ? [data.state] : (Array.isArray(data.states) ? data.states : [])),
    mobile: data.mobile || null,
    email: data.email || null,
    gender: data.gender || null,
    territory: data.territory || null,
    remarks: data.remarks || null,
    dob: data.dob ? new Date(data.dob) : null,
    joiningDate: data.joiningDate ? new Date(data.joiningDate) : new Date(),
    status: data.status || "Active",
    userId,
  };

  return repo.createEmployeeRepo(payload);
};

const getEmployeesService = async (filters = {}) => {
  return repo.getEmployeesRepo(filters);
};

const getEmployeeByIdService = async (id) => {
  const employee = await repo.getEmployeeByIdRepo(id);
  if (!employee) {
    throw new Error("Employee not found");
  }
  return employee;
};

const getSalesOrganizationTreeService = async () => {
  const allEmployees = await repo.getEmployeesRepo({ status: "Active" });

  const buildTree = (parentId = null) => {
    return allEmployees
      .filter((emp) => emp.reportsToId === parentId)
      .map((emp) => ({
        id: String(emp.id),
        employeeCode: emp.employeeCode,
        employeeName: emp.name,
        designation: emp.designation,
        reportsTo: emp.reportsTo || "",
        zone: emp.zone || "",
        region: emp.region || "",
        area: emp.area || "",
        headquarters: emp.headquarters || "",
        states: emp.states || [],
        status: emp.status,
        children: buildTree(emp.id),
      }));
  };

  const roots = buildTree(null);
  if (roots.length > 0) return roots;

  // Fallback: If no null parent, pick National Sales Head as root
  const nsh = allEmployees.filter((e) => e.designation === "National Sales Head");
  return nsh.map((emp) => ({
    id: String(emp.id),
    employeeCode: emp.employeeCode,
    employeeName: emp.name,
    designation: emp.designation,
    reportsTo: emp.reportsTo || "",
    zone: emp.zone || "",
    region: emp.region || "",
    area: emp.area || "",
    headquarters: emp.headquarters || "",
    states: emp.states || [],
    status: emp.status,
    children: buildTree(emp.id),
  }));
};

const getMyTeamService = async (userId, userRole) => {
  let currentEmp = await repo.getEmployeeByUserIdRepo(userId);
  
  // Fallback lookup if not mapped by userId
  if (!currentEmp) {
    const all = await repo.getEmployeesRepo();
    if (userRole === "NATIONAL_SALES_HEAD" || userRole === "National Sales Head") {
      currentEmp = all.find((e) => e.designation === "National Sales Head");
    } else if (userRole === "REGIONAL_SALES_MANAGER" || userRole === "Regional Sales Manager") {
      currentEmp = all.find((e) => e.designation === "Regional Sales Manager");
    }
  }

  if (!currentEmp) {
    return [];
  }

  // Get direct subordinates
  return repo.getEmployeesRepo({ reportsToId: currentEmp.id });
};

const updateEmployeeService = async (id, data) => {
  const existing = await repo.getEmployeeByIdRepo(id);
  if (!existing) {
    throw new Error("Employee not found");
  }

  const payload = {};
  if (data.name !== undefined || data.employeeName !== undefined) {
    payload.name = data.name || data.employeeName;
  }
  if (data.designation !== undefined) payload.designation = data.designation;
  if (data.reportsToId !== undefined) payload.reportsToId = data.reportsToId ? Number(data.reportsToId) : null;
  if (data.reportsTo !== undefined) payload.reportsTo = data.reportsTo;
  if (data.zone !== undefined) payload.zone = data.zone;
  if (data.region !== undefined) payload.region = data.region;
  if (data.area !== undefined) payload.area = data.area;
  if (data.headquarters !== undefined || data.hq !== undefined) payload.headquarters = data.headquarters || data.hq;
    
  if (data.states !== undefined && Array.isArray(data.states) && data.states.length > 0) {
    payload.states = data.states;
  } else if (data.state) {
    payload.states = [data.state];
  } else if (data.states !== undefined) {
    payload.states = data.states;
  }

  if (data.territory !== undefined) payload.territory = data.territory;
  if (data.remarks !== undefined) payload.remarks = data.remarks;
  if (data.mobile !== undefined) payload.mobile = data.mobile;
  if (data.email !== undefined) payload.email = data.email;
  if (data.gender !== undefined) payload.gender = data.gender;
  if (data.status !== undefined) payload.status = data.status;
  if (data.dob !== undefined) payload.dob = data.dob ? new Date(data.dob) : null;
  if (data.joiningDate !== undefined) payload.joiningDate = new Date(data.joiningDate);

  return repo.updateEmployeeRepo(id, payload);
};

const deleteEmployeeService = async (id) => {
  const existing = await repo.getEmployeeByIdRepo(id);
  if (!existing) {
    throw new Error("Employee not found");
  }
  return repo.deleteEmployeeRepo(id);
};

module.exports = {
  createEmployeeService,
  getEmployeesService,
  getEmployeeByIdService,
  getSalesOrganizationTreeService,
  getMyTeamService,
  updateEmployeeService,
  deleteEmployeeService,
};
