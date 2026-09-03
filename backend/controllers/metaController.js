const prisma = require("../config/db");

// Supplies dropdown data for the frontend (locations, categories, items, users)
const getLocations = async (req, res, next) => {
  try {
    const data = await prisma.location.findMany({ orderBy: { name: "asc" } });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const createLocation = async (req, res, next) => {
  try {
    const { name } = req.body;
    const data = await prisma.location.create({ data: { name } });
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const data = await prisma.category.findMany({ orderBy: { name: "asc" } });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const { name } = req.body;
    const data = await prisma.category.create({ data: { name } });
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getItems = async (req, res, next) => {
  try {
    const data = await prisma.item.findMany({ include: { category: true }, orderBy: { name: "asc" } });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const createItem = async (req, res, next) => {
  try {
    const { name, sku, categoryId } = req.body;
    const data = await prisma.item.create({ data: { name, sku, categoryId } });
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const data = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, locationId: true },
      orderBy: { name: "asc" },
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getCustomers = async (req, res, next) => {
  try {
    const data = await prisma.customer.findMany({ orderBy: { name: "asc" } });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getLocations,
  createLocation,
  getCategories,
  createCategory,
  getItems,
  createItem,
  getUsers,
  getCustomers,
};