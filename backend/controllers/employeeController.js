const bcrypt = require("bcryptjs");
const prisma = require("../config/db");
const AppError = require("../utils/AppError");
const { requireFields, isValidEmail } = require("../utils/validate");

const VALID_ROLES = ["ADMIN", "OPERATIONS", "SALES"];

// "Employees" here means user/account management (Admin only).
// Distinct from /api/meta/users, which only supplies read-only dropdown data.

const list = async (req, res, next) => {
  try {
    const data = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        locationId: true,
        location: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        locationId: true,
        location: true,
        createdAt: true,
      },
    });
    if (!user) throw new AppError("Employee not found.", 404);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { name, email, password, role, locationId } = req.body;
    requireFields(req.body, ["name", "email", "password", "role"]);

    if (!isValidEmail(email)) throw new AppError("Invalid email format.", 400);
    if (password.length < 6) throw new AppError("Password must be at least 6 characters.", 400);
    if (!VALID_ROLES.includes(role)) {
      throw new AppError(`Role must be one of: ${VALID_ROLES.join(", ")}`, 400);
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError("An account with this email already exists.", 409);

    const hashedPassword = await bcrypt.hash(password, 10);

    const data = await prisma.user.create({
      data: { name, email, password: hashedPassword, role, locationId: locationId || null },
      select: { id: true, name: true, email: true, role: true, locationId: true },
    });

    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { name, role, locationId } = req.body;

    if (role !== undefined && !VALID_ROLES.includes(role)) {
      throw new AppError(`Role must be one of: ${VALID_ROLES.join(", ")}`, 400);
    }

    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError("Employee not found.", 404);

    const data = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(role !== undefined && { role }),
        ...(locationId !== undefined && { locationId: locationId || null }),
      },
      select: { id: true, name: true, email: true, role: true, locationId: true },
    });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, getOne, create, update };