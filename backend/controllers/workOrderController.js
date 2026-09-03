const workOrderService = require("../services/workOrderService");
const { requireFields, requirePositiveInt } = require("../utils/validate");

const VALID_STATUSES = ["ASSIGNED", "IN_PROGRESS", "COMPLETED"];

const create = async (req, res, next) => {
  try {
    const { locationId, itemId, requiredQty, assignedUserId } = req.body;
    requireFields(req.body, ["locationId", "itemId", "requiredQty", "assignedUserId"]);
    requirePositiveInt(requiredQty, "requiredQty");

    const data = await workOrderService.createWorkOrder({ locationId, itemId, requiredQty, assignedUserId });
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const list = async (req, res, next) => {
  try {
    const { locationId, status, assignedUserId } = req.query;
    const data = await workOrderService.listWorkOrders({ locationId, status, assignedUserId });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const data = await workOrderService.getWorkOrderById(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) {
      return next(new (require("../utils/AppError"))(`status must be one of: ${VALID_STATUSES.join(", ")}`, 400));
    }
    const data = await workOrderService.updateStatus(req.params.id, status);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = { create, list, getOne, updateStatus };