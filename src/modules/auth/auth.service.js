const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

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
    },
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
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
};