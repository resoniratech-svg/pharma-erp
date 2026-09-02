const {
  registerUser,
  loginUser,
  getCurrentUser,
  forgotPassword: forgotPasswordService,
  resetPassword: resetPasswordService,
  changePassword: changePasswordService,
} = require("./auth.service");

const register = async (req, res) => {
  try {
    const user = await registerUser(req.body);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const result = await loginUser(
      req.body.email,
      req.body.password,
      req.body.deviceId,
      req.body.force === true || req.body.force === "true"
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    const statusCode = error.statusCode || 401;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

const logout = async (req, res) => {
  try {
    const prisma = require("../../config/db");
    if (req.user && req.user.id) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { currentDeviceId: null },
      });
    }
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const me = async (req, res) => {
  try {
    const user = await getCurrentUser(
      req.user.id
    );

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, email, mobile, profileImage, currentPassword, newPassword } = req.body;
    const prisma = require("../../config/db");
    const bcrypt = require("bcrypt");

    const userId = req.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { mr: true } });
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    let updateData = {
      name: name || user.name,
      email: email || user.email,
    };
    
    if (mobile !== undefined) updateData.mobile = mobile;
    if (profileImage !== undefined) updateData.profileImage = profileImage;

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: "Current password required to set a new password." });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: "Incorrect current password." });
      }
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        mobile: true,
        profileImage: true,
      }
    });

    if (user.mr) {
      await prisma.mR.update({
        where: { id: user.mr.id },
        data: {
          name: updateData.name,
          email: updateData.email,
          mobile: updateData.mobile || user.mr.mobile,
        }
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }
    const result = await forgotPasswordService(email);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const statusCode = error.statusCode || 400;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { id, token, newPassword } = req.body;
    if (!id || !token || !newPassword) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    const result = await resetPasswordService(id, token, newPassword);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const statusCode = error.statusCode || 400;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};


const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const result = await changePasswordService(userId, currentPassword, newPassword);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const statusCode = error.statusCode || 400;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

module.exports = {
  register,
  login,
  logout,
  me,
  updateProfile,
  forgotPassword,
  resetPassword,
  changePassword,
};