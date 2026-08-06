const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function seedSalesOrg() {
  console.log("Seeding Sales Organization (NSM, RSMs, and Targets)...");

  const hashedPassword = await bcrypt.hash("1234", 10);

  // 1. Create NSM User & Employee
  const nsmUser = await prisma.user.upsert({
    where: { email: "nsm@pharmaerp.com" },
    update: {
      role: "NATIONAL_SALES_HEAD",
    },
    create: {
      name: "Rajesh Sharma",
      email: "nsm@pharmaerp.com",
      password: hashedPassword,
      role: "NATIONAL_SALES_HEAD",
      mobile: "9876500000",
    },
  });

  const nsmEmployee = await prisma.employee.upsert({
    where: { employeeCode: "EMP-NSM-001" },
    update: {
      userId: nsmUser.id,
    },
    create: {
      employeeCode: "EMP-NSM-001",
      name: "Rajesh Sharma",
      designation: "National Sales Head",
      zone: "All India",
      region: "National",
      headquarters: "Corporate Office, Mumbai",
      states: ["Maharashtra", "Gujarat", "Karnataka", "Delhi", "Tamil Nadu"],
      mobile: "9876500000",
      email: "nsm@pharmaerp.com",
      status: "Active",
      userId: nsmUser.id,
    },
  });

  // 2. Create RSM Users & Employees
  const rsms = [
    {
      code: "RSM001",
      name: "Arun Kumar",
      email: "arun.k@pharma.com",
      mobile: "9876543210",
      states: ["Maharashtra"],
      hq: "Mumbai",
      area: "Mumbai City",
      joiningDate: new Date("2025-01-15"),
    },
    {
      code: "RSM002",
      name: "Rajesh Singh",
      email: "rajesh.s@pharma.com",
      mobile: "9876543211",
      states: ["Gujarat"],
      hq: "Ahmedabad",
      area: "",
      joiningDate: new Date("2025-02-10"),
    },
    {
      code: "RSM003",
      name: "Priya Sharma",
      email: "priya.s@pharma.com",
      mobile: "9876543212",
      states: ["Karnataka"],
      hq: "Bangalore",
      area: "Bangalore Urban",
      joiningDate: new Date("2025-03-01"),
    },
  ];

  const createdRsms = [];
  for (const r of rsms) {
    const user = await prisma.user.upsert({
      where: { email: r.email },
      update: {
        role: "REGIONAL_SALES_MANAGER",
      },
      create: {
        name: r.name,
        email: r.email,
        password: hashedPassword,
        role: "REGIONAL_SALES_MANAGER",
        mobile: r.mobile,
      },
    });

    const emp = await prisma.employee.upsert({
      where: { employeeCode: r.code },
      update: {
        reportsToId: nsmEmployee.id,
        reportsTo: nsmEmployee.name,
        userId: user.id,
      },
      create: {
        employeeCode: r.code,
        name: r.name,
        designation: "Regional Sales Manager",
        reportsToId: nsmEmployee.id,
        reportsTo: nsmEmployee.name,
        headquarters: r.hq,
        area: r.area,
        states: r.states,
        mobile: r.mobile,
        email: r.email,
        joiningDate: r.joiningDate,
        status: "Active",
        userId: user.id,
      },
    });
    createdRsms.push(emp);
  }

  // 3. Create National Target for FY 2026-27
  const nationalTarget = await prisma.nationalTarget.upsert({
    where: { targetCode: "NAT-2026-27-001" },
    update: {},
    create: {
      targetCode: "NAT-2026-27-001",
      financialYear: "2026-27",
      planningPeriod: "Annual",
      targetType: "Sales Value",
      targetAmount: 150000000, // 15 Crore
      startDate: new Date("2026-04-01"),
      endDate: new Date("2027-03-31"),
      remarks: "Corporate annual sales target for FY 2026-27",
      createdByEmployeeId: nsmEmployee.id,
      status: "Active",
    },
  });

  // 4. Create Initial Allocations to RSMs
  const allocations = [
    {
      code: "ALL-2026-RSM001",
      empId: createdRsms[0].id,
      amount: 12000000, // 1.2 Crore
    },
    {
      code: "ALL-2026-RSM002",
      empId: createdRsms[1].id,
      amount: 15000000, // 1.5 Crore
    },
    {
      code: "ALL-2026-RSM003",
      empId: createdRsms[2].id,
      amount: 11000000, // 1.1 Crore
    },
  ];

  for (const a of allocations) {
    await prisma.targetAllocation.upsert({
      where: { allocationCode: a.code },
      update: {},
      create: {
        allocationCode: a.code,
        nationalTargetId: nationalTarget.id,
        financialYear: "2026-27",
        allocationPeriod: "Annual",
        allocatedToEmployeeId: a.empId,
        allocatedByEmployeeId: nsmEmployee.id,
        targetAmount: a.amount,
        achievedAmount: 0,
        startDate: new Date("2026-04-01"),
        endDate: new Date("2027-03-31"),
        remarks: "Initial regional target allocation",
        status: "Active",
      },
    });
  }

  console.log("Successfully seeded Sales Organization hierarchy, targets, and allocations!");
}

seedSalesOrg()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
