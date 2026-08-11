const repo = require("./employee.repository");
const prisma = require("../../config/db");
const bcrypt = require("bcrypt");

const generateEmployeeCode = async (designation) => {
  let prefix = "EMP-";
  if (designation === "National Sales Head") prefix = "EMP-NSM-";
  else if (designation === "Regional Sales Manager") prefix = "RSM";
  else if (designation === "Area Sales Manager") prefix = "ASM";
  else if (designation === "Medical Representative") prefix = "EMP-MR-";

  const allEmployees = await repo.getEmployeesRepo();
  const matching = allEmployees.filter((e) => e.employeeCode.startsWith(prefix));
  
  if (prefix === "RSM" || prefix === "ASM") {
    const nextNum = matching.length + 1;
    return `${prefix}${String(nextNum).padStart(3, "0")}`;
  }

  const nextNum = matching.length + 1;
  return `${prefix}${String(nextNum).padStart(3, "0")}`;
};

const createEmployeeService = async (data) => {
  const employeeName = data.name || data.employeeName || "Employee";

  let employeeCode = data.employeeCode;
  if (!employeeCode) {
    employeeCode = await generateEmployeeCode(data.designation);
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
    states: Array.isArray(data.states) ? data.states : (data.state ? [data.state] : []),
    mobile: data.mobile || null,
    email: data.email || null,
    gender: data.gender || null,
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
  if (data.states !== undefined) payload.states = data.states;
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
