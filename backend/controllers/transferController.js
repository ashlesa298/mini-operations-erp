const transferService = require("../services/transferService");
const { requireFields, requirePositiveInt } = require("../utils/validate");

const create = async (req, res, next) => {
  try {
    const { sourceLocationId, destinationLocationId, itemId, quantity } = req.body;
    requireFields(req.body, ["sourceLocationId", "destinationLocationId", "itemId", "quantity"]);
    requirePositiveInt(quantity, "quantity");

    const data = await transferService.requestTransfer({
      sourceLocationId,
      destinationLocationId,
      itemId,
      quantity,
      requestedById: req.user.id,
    });
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const list = async (req, res, next) => {
  try {
    const { status, locationId } = req.query;
    const data = await transferService.listTransfers({ status, locationId });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const data = await transferService.getTransferById(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const dispatch = async (req, res, next) => {
  try {
    const data = await transferService.dispatchTransfer(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const receive = async (req, res, next) => {
  try {
    const data = await transferService.receiveTransfer(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = { create, list, getOne, dispatch, receive };