const prisma = require("../config/db");
const AppError = require("../utils/AppError");

// Atomically reserve stock. Must run inside a transaction (tx passed in).
// Uses a conditional UPDATE so Postgres row-locks the row during the check+write,
// preventing two concurrent requests from both succeeding (no lost-update race).
const reserveStock = async (tx, inventoryId, quantity, referenceType, referenceId) => {
  const affected = await tx.$executeRaw`
    UPDATE "Inventory"
    SET "reservedQty" = "reservedQty" + ${quantity}, "updatedAt" = NOW()
    WHERE id = ${inventoryId} AND "physicalQty" - "reservedQty" >= ${quantity}
  `;

  if (affected === 0) {
    const current = await tx.inventory.findUnique({ where: { id: inventoryId } });
    const available = current ? current.physicalQty - current.reservedQty : 0;
    throw new AppError(`Insufficient stock. Only ${available} units are available.`, 409);
  }

  await tx.inventoryTransaction.create({
    data: { inventoryId, type: "RESERVE", quantity, referenceType, referenceId },
  });
};

// Release a previously reserved quantity (e.g. order cancellation)
const releaseStock = async (tx, inventoryId, quantity, referenceType, referenceId) => {
  const affected = await tx.$executeRaw`
    UPDATE "Inventory"
    SET "reservedQty" = GREATEST("reservedQty" - ${quantity}, 0), "updatedAt" = NOW()
    WHERE id = ${inventoryId}
  `;
  if (affected === 0) {
    throw new AppError("Inventory record not found while releasing stock.", 404);
  }
  await tx.inventoryTransaction.create({
    data: { inventoryId, type: "RELEASE", quantity, referenceType, referenceId },
  });
};

const listInventory = async (filters = {}) => {
  const { locationId, itemId, categoryId, search } = filters;

  return prisma.inventory.findMany({
    where: {
      ...(locationId && { locationId }),
      ...(itemId && { itemId }),
      ...(categoryId && { item: { categoryId } }),
      ...(search && {
        item: { name: { contains: search, mode: "insensitive" } },
      }),
    },
    include: {
      item: { include: { category: true } },
      location: true,
    },
    orderBy: { updatedAt: "desc" },
  });
};

const getInventoryById = async (id) => {
  const record = await prisma.inventory.findUnique({
    where: { id },
    include: { item: { include: { category: true } }, location: true },
  });
  if (!record) throw new AppError("Inventory record not found.", 404);
  return record;
};

const createInventory = async ({ itemId, locationId, batchNumber, physicalQty }) => {
  const existing = await prisma.inventory.findUnique({
    where: { itemId_locationId_batchNumber: { itemId, locationId, batchNumber } },
  });
  if (existing) {
    throw new AppError(
      "Duplicate inventory transaction: this item/location/batch combination already exists.",
      409
    );
  }

  return prisma.$transaction(async (tx) => {
    const record = await tx.inventory.create({
      data: { itemId, locationId, batchNumber, physicalQty, reservedQty: 0 },
    });
    await tx.inventoryTransaction.create({
      data: {
        inventoryId: record.id,
        type: "ADJUST",
        quantity: physicalQty,
        referenceType: "MANUAL_CREATE",
        referenceId: record.id,
      },
    });
    return record;
  });
};

// Manual physical quantity adjustment (e.g. stock count correction / damage)
const adjustPhysicalQty = async (inventoryId, delta, reason) => {
  return prisma.$transaction(async (tx) => {
    const inventory = await tx.inventory.findUnique({ where: { id: inventoryId } });
    if (!inventory) throw new AppError("Inventory record not found.", 404);

    const newPhysical = inventory.physicalQty + delta;
    if (newPhysical < 0) {
      throw new AppError("Adjustment would result in negative inventory.", 400);
    }
    if (newPhysical < inventory.reservedQty) {
      throw new AppError("Adjustment would drop physical stock below reserved stock.", 400);
    }

    const updated = await tx.inventory.update({
      where: { id: inventoryId },
      data: { physicalQty: newPhysical },
    });

    await tx.inventoryTransaction.create({
      data: {
        inventoryId,
        type: "ADJUST",
        quantity: delta,
        referenceType: reason || "MANUAL_ADJUST",
        referenceId: inventoryId,
      },
    });

    return updated;
  });
};

module.exports = {
  reserveStock,
  releaseStock,
  listInventory,
  getInventoryById,
  createInventory,
  adjustPhysicalQty,
};