const {
  registerUser,
  loginUser,
  getCurrentUser,
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

module.exports = {
  register,
  login,
  logout,
  me,
};