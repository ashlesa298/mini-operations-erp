const orderService = require("../services/orderService");
const AppError = require("../utils/AppError");
const {
  requireFields,
  requirePositiveInt,
} = require("../utils/validate");

const create = async (req, res, next) => {
  try {
    const { customerId, customerName, items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      throw new AppError(
        "Order must include at least one item.",
        400
      );
    }

    for (const line of items) {
      requireFields(line, [
        "itemId",
        "locationId",
        "quantity",
      ]);

      requirePositiveInt(
        line.quantity,
        "quantity"
      );
    }

    let data;

    if (customerId) {
      data =
        await orderService.createOrderWithReservation({
          customerId,
          createdById: req.user.id,
          items,
        });
    } else if (customerName) {
      data =
        await orderService.createOrderWithNewCustomer({
          customerName,
          createdById: req.user.id,
          items,
        });
    } else {
      throw new AppError(
        "Either customerId or customerName is required.",
        400
      );
    }

    return res.status(201).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

const list = async (req, res, next) => {
  try {
    const { status, customerId } = req.query;

    const data = await orderService.listOrders({
      status,
      customerId,
    });

    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const data = await orderService.getOrderById(
      req.params.id
    );

    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

const cancel = async (req, res, next) => {
  try {
    const data = await orderService.cancelOrder(
      req.params.id
    );

    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  create,
  list,
  getOne,
  cancel,
};