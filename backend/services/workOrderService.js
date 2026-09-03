const prisma = require("../config/db");
const AppError = require("../utils/AppError");

const createWorkOrder = async ({ locationId, itemId, requiredQty, assignedUserId }) => {
  const [location, item, user] = await Promise.all([
    prisma.location.findUnique({ where: { id: locationId } }),
    prisma.item.findUnique({ where: { id: itemId } }),
    prisma.user.findUnique({ where: { id: assignedUserId } }),
  ]);

  if (!location) throw new AppError("Location not found.", 404);
  if (!item) throw new AppError("Item not found.", 404);
  if (!user) throw new AppError("Assigned user not found.", 404);

  return prisma.workOrder.create({
    data: { locationId, itemId, requiredQty, assignedUserId, status: "ASSIGNED" },
    include: { location: true, item: true, assignedUser: { select: { id: true, name: true, email: true } } },
  });
};

const listWorkOrders = async (filters = {}) => {
  const { locationId, status, assignedUserId } = filters;
  const orders = await prisma.workOrder.findMany({
    where: {
      ...(locationId && { locationId }),
      ...(status && { status }),
      ...(assignedUserId && { assignedUserId }),
    },
    include: { location: true, item: true, assignedUser: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return Promise.all(orders.map(attachShortage));
};

const getWorkOrderById = async (id) => {
  const order = await prisma.workOrder.findUnique({
    where: { id },
    include: { location: true, item: true, assignedUser: { select: { id: true, name: true, email: true } } },
  });
  if (!order) throw new AppError("Work order not found.", 404);
  return attachShortage(order);
};

// Computes available stock at the work order's location and the resulting shortage.
// Kept as a derived/computed value rather than stored, so it's always consistent
// with current inventory (no risk of stale cached shortage figures).
const attachShortage = async (workOrder) => {
  const inventories = await prisma.inventory.findMany({
    where: { itemId: workOrder.itemId, locationId: workOrder.locationId },
  });

  const available = inventories.reduce((sum, inv) => sum + (inv.physicalQty - inv.reservedQty), 0);
  const shortage = Math.max(workOrder.requiredQty - available, 0);

  return { ...workOrder, availableQty: available, shortage };
};

const VALID_TRANSITIONS = {
  ASSIGNED: ["IN_PROGRESS"],
  IN_PROGRESS: ["COMPLETED"],
  COMPLETED: [],
};

const updateStatus = async (id, newStatus) => {
  const order = await prisma.workOrder.findUnique({ where: { id } });
  if (!order) throw new AppError("Work order not found.", 404);

  const allowed = VALID_TRANSITIONS[order.status] || [];
  if (!allowed.includes(newStatus)) {
    throw new AppError(
      `Invalid status transition from ${order.status} to ${newStatus}.`,
      400
    );
  }

  return prisma.workOrder.update({
    where: { id },
    data: { status: newStatus },
    include: { location: true, item: true, assignedUser: { select: { id: true, name: true, email: true } } },
  });
};

module.exports = { createWorkOrder, listWorkOrders, getWorkOrderById, updateStatus };