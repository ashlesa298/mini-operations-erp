const prisma = require("../config/db");

const dashboard = async (req, res, next) => {
  try {
    const [totalItems, lowStockInventories, openWorkOrders, pendingTransfers, pendingOrders, inventories] =
      await Promise.all([
        prisma.item.count(),
        prisma.inventory.findMany(),
        prisma.workOrder.count({ where: { status: { in: ["ASSIGNED", "IN_PROGRESS"] } } }),
        prisma.stockTransfer.count({ where: { status: { in: ["REQUESTED", "DISPATCHED"] } } }),
        prisma.customerOrder.count({ where: { status: { in: ["PENDING", "RESERVED"] } } }),
        prisma.inventory.findMany(),
      ]);

    const LOW_STOCK_THRESHOLD = 10;
    const lowStockCount = lowStockInventories.filter(
      (inv) => inv.physicalQty - inv.reservedQty < LOW_STOCK_THRESHOLD
    ).length;

    const totalReserved = inventories.reduce((sum, inv) => sum + inv.reservedQty, 0);

    res.json({
      success: true,
      data: {
        totalInventoryItems: totalItems,
        lowStockItems: lowStockCount,
        openWorkOrders,
        pendingTransfers,
        pendingOrders,
        totalReservedStock: totalReserved,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { dashboard };