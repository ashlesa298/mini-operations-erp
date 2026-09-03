const bcrypt = require("bcryptjs");
const prisma = require("../config/db");
const AppError = require("../utils/AppError");
const generateToken = require("../utils/generateToken");
const { requireFields, isValidEmail } = require("../utils/validate");

const VALID_ROLES = ["ADMIN", "OPERATIONS", "SALES"];

const register = async (req, res, next) => {
  try {
    const { name, email, password, role, locationId } = req.body;
    requireFields(req.body, ["name", "email", "password", "role"]);

    if (!isValidEmail(email)) throw new AppError("Invalid email format.", 400);
    if (password.length < 6) throw new AppError("Password must be at least 6 characters.", 400);
    if (!VALID_ROLES.includes(role)) throw new AppError(`Role must be one of: ${VALID_ROLES.join(", ")}`, 400);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError("An account with this email already exists.", 409);

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role, locationId: locationId || null },
      select: { id: true, name: true, email: true, role: true, locationId: true },
    });

    generateToken(res, user.id, user.role);
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    requireFields(req.body, ["email", "password"]);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError("Invalid email or password.", 401);

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new AppError("Invalid email or password.", 401);

    generateToken(res, user.id, user.role);

    res.json({
      success: true,
      data: { id: user.id, name: user.name, email: user.email, role: user.role, locationId: user.locationId },
    });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    res.json({ success: true, data: req.user });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    res.clearCookie("token");
    res.json({ success: true, message: "Logged out successfully." });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe, logout };