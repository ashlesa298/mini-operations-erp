const inventoryService = require("../services/inventoryService");
const AppError = require("../utils/AppError");
const { requireFields, requirePositiveInt } = require("../utils/validate");

const list = async (req, res, next) => {
  try {
    const { locationId, itemId, categoryId, search } = req.query;
    const data = await inventoryService.listInventory({ locationId, itemId, categoryId, search });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const data = await inventoryService.getInventoryById(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { itemId, locationId, batchNumber, physicalQty } = req.body;
    requireFields(req.body, ["itemId", "locationId", "batchNumber", "physicalQty"]);
    requirePositiveInt(physicalQty, "physicalQty");

    const data = await inventoryService.createInventory({ itemId, locationId, batchNumber, physicalQty });
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const adjust = async (req, res, next) => {
  try {
    const { delta, reason } = req.body;
    if (!Number.isInteger(delta) || delta === 0) {
      throw new AppError("delta must be a non-zero integer.", 400);
    }
    const data = await inventoryService.adjustPhysicalQty(req.params.id, delta, reason);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, getOne, create, adjust };