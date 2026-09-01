const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const prisma = require("../../config/db");

const registerUser = async (data) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });

  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(
    data.password,
    10
  );

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role || "ADMIN",
    },
  });

  if (user.role === "MEDICAL_REPRESENTATIVE") {
    // Automatically create the MR record and link it to the newly created user
    await prisma.mR.create({
      data: {
        userId: user.id,
        name: user.name,
        email: user.email,
        mrCode: `MR-${user.id}`, // Generate a basic code, can be updated later
        territory: "General",
        mobile: data.mobile || "",
        status: "Active"
      }
    });
  } else if (["REGIONAL_SALES_MANAGER", "AREA_SALES_MANAGER", "NATIONAL_SALES_HEAD"].includes(user.role)) {
    // Automatically create Employee record for manager roles
    let prefix = "EMP";
    if (user.role === "REGIONAL_SALES_MANAGER") prefix = "RSM";
    if (user.role === "AREA_SALES_MANAGER") prefix = "ASM";
    if (user.role === "NATIONAL_SALES_HEAD") prefix = "NSH";
    
    await prisma.employee.create({
      data: {
        userId: user.id,
        name: user.name,
        email: user.email,
        employeeCode: `${prefix}-00${user.id}`,
        designation: user.role,
        mobile: data.mobile || "",
        territory: data.state || "",
        headquarters: data.hq || "",
        area: data.area || ""
      }
    });
  }

  return user;
};

const loginUser = async (
  email,
  password,
  deviceId = null,
  force = false
) => {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
    include: {
      mr: true,
      employee: true,
    },
  });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isMatch = await bcrypt.compare(
    password,
    user.password
  );

  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  // Single-device login restriction for MRs
  if (
    user.role === "MEDICAL_REPRESENTATIVE" &&
    deviceId
  ) {
    if (
      user.currentDeviceId &&
      user.currentDeviceId !== deviceId &&
      !force
    ) {
      const error = new Error(
        "This account is already logged in on another device. Do you want to log out of the other device?"
      );
      error.statusCode = 409;
      throw error;
    }

    // Update currentDeviceId for this MR
    await prisma.user.update({
      where: { id: user.id },
      data: { currentDeviceId: deviceId },
    });
  }

  const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
      email: user.email,
      companyId: user.companyId,
      employeeId: user.employee ? user.employee.id : null,
      employeeCode: user.employee ? user.employee.employeeCode : null,
      deviceId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn:
        process.env.JWT_EXPIRES_IN || "7d",
    }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      linkedDistributorCode: user.linkedDistributorCode,
      linkedRetailerCode: user.linkedRetailerCode,
      employeeId: user.employee ? user.employee.id : null,
      employeeCode: user.employee ? user.employee.employeeCode : null,
      mrId: user.mr ? user.mr.id : null,
    },
    employee: user.employee
      ? {
          id: user.employee.id,
          employeeCode: user.employee.employeeCode,
          name: user.employee.name,
          designation: user.employee.designation,
          headquarters: user.employee.headquarters,
          states: user.employee.states,
          zone: user.employee.zone,
          region: user.employee.region,
          area: user.employee.area,
        }
      : null,
    mr: user.mr
      ? {
          id: user.mr.id,
          mrCode: user.mr.mrCode,
          name: user.mr.name,
          territory: user.mr.territory,
        }
      : null,
  };
};


const getCurrentUser = async (userId) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      employee: true, // INCLUDE EMPLOYEE META DATA
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

const forgotPassword = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const error = new Error("Please enter the correct email id.");
    error.statusCode = 404;
    throw error;
  }

  const secret = process.env.JWT_SECRET + user.password;
  const payload = { email: user.email, id: user.id };
  const token = jwt.sign(payload, secret, { expiresIn: '15m' });

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const link = `${frontendUrl}/reset-password?token=${token}&id=${user.id}`;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: user.email,
    subject: "Password Reset - MJ Healthcare ERP",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
        <h3>Password Reset Request</h3>
        <p>You requested a password reset for your account.</p>
        <p>Please click the button below to reset your password. This link is valid for 15 minutes.</p>
        <a href="${link}" style="display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 10px;">Reset Password</a>
        <p style="margin-top: 20px;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p><a href="${link}">${link}</a></p>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  return { message: "Reset link sent successfully to your email." };
};

const resetPassword = async (id, token, newPassword) => {
  const user = await prisma.user.findUnique({ where: { id: parseInt(id) } });
  if (!user) {
    const error = new Error("Invalid reset link.");
    error.statusCode = 400;
    throw error;
  }

  const secret = process.env.JWT_SECRET + user.password;
  try {
    jwt.verify(token, secret);
  } catch (err) {
    const error = new Error("Reset link has expired or is invalid. Please request a new one.");
    error.statusCode = 400;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: parseInt(id) },
    data: { password: hashedPassword },
  });

  return { message: "Password updated successfully" };
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  forgotPassword,
  resetPassword,
};