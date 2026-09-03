const prisma = require("../config/db");
const AppError = require("../utils/AppError");

const requestTransfer = async ({ sourceLocationId, destinationLocationId, itemId, quantity, requestedById }) => {
  if (sourceLocationId === destinationLocationId) {
    throw new AppError("Source and destination locations must differ.", 400);
  }

  const [source, destination, item] = await Promise.all([
    prisma.location.findUnique({ where: { id: sourceLocationId } }),
    prisma.location.findUnique({ where: { id: destinationLocationId } }),
    prisma.item.findUnique({ where: { id: itemId } }),
  ]);

  if (!source) throw new AppError("Source location not found.", 404);
  if (!destination) throw new AppError("Destination location not found.", 404);
  if (!item) throw new AppError("Item not found.", 404);

  return prisma.stockTransfer.create({
    data: { sourceLocationId, destinationLocationId, itemId, quantity, requestedById, status: "REQUESTED" },
    include: { sourceLocation: true, destinationLocation: true, item: true },
  });
};

// Dispatch: atomically validate transfer + source stock, reduce source, update status.
// On dispatch, destination stock is intentionally left untouched (per spec).
const dispatchTransfer = async (transferId) => {
  return prisma.$transaction(async (tx) => {
    const transfer = await tx.stockTransfer.findUnique({ where: { id: transferId } });
    if (!transfer) throw new AppError("Transfer not found.", 404);
    if (transfer.status !== "REQUESTED") {
      throw new AppError(`Cannot dispatch a transfer with status ${transfer.status}.`, 400);
    }

    const sourceInventory = await tx.inventory.findFirst({
      where: { itemId: transfer.itemId, locationId: transfer.sourceLocationId },
    });
    if (!sourceInventory) {
      throw new AppError("No inventory found for this item at the source location.", 400);
    }

    const affected = await tx.$executeRaw`
      UPDATE "Inventory"
      SET "physicalQty" = "physicalQty" - ${transfer.quantity}, "updatedAt" = NOW()
      WHERE id = ${sourceInventory.id} AND "physicalQty" - "reservedQty" >= ${transfer.quantity}
    `;
    if (affected === 0) {
      throw new AppError("Insufficient available stock at source location to dispatch this transfer.", 409);
    }

    await tx.inventoryTransaction.create({
      data: {
        inventoryId: sourceInventory.id,
        type: "DISPATCH",
        quantity: -transfer.quantity,
        referenceType: "TRANSFER",
        referenceId: transfer.id,
      },
    });

    return tx.stockTransfer.update({
      where: { id: transferId },
      data: { status: "DISPATCHED", dispatchedAt: new Date() },
      include: { sourceLocation: true, destinationLocation: true, item: true },
    });
  });
};

// Receive: atomically flip status DISPATCHED -> RECEIVED (guards double-receive races),
// then increase destination stock. Uses upsert-style logic since the destination
// may not have an existing inventory row for this item yet.
const receiveTransfer = async (transferId) => {
  return prisma.$transaction(async (tx) => {
    const transfer = await tx.stockTransfer.findUnique({ where: { id: transferId } });
    if (!transfer) throw new AppError("Transfer not found.", 404);

    if (transfer.status === "RECEIVED") {
      throw new AppError("This transfer has already been received.", 400);
    }
    if (transfer.status !== "DISPATCHED") {
      throw new AppError(`Cannot receive a transfer with status ${transfer.status}.`, 400);
    }

    // Atomic guarded status flip — the WHERE status='DISPATCHED' clause ensures
    // that even if two receive requests race, only one updates a row.
    const affected = await tx.$executeRaw`
      UPDATE "StockTransfer"
      SET status = 'RECEIVED', "receivedAt" = NOW(), "updatedAt" = NOW()
      WHERE id = ${transferId} AND status = 'DISPATCHED'
    `;
    if (affected === 0) {
      throw new AppError("This transfer has already been received.", 409);
    }

    let destInventory = await tx.inventory.findFirst({
      where: { itemId: transfer.itemId, locationId: transfer.destinationLocationId },
    });

    if (destInventory) {
      destInventory = await tx.inventory.update({
        where: { id: destInventory.id },
        data: { physicalQty: { increment: transfer.quantity } },
      });
    } else {
      destInventory = await tx.inventory.create({
        data: {
          itemId: transfer.itemId,
          locationId: transfer.destinationLocationId,
          batchNumber: `TRANSFER-${transfer.id.slice(0, 8)}`,
          physicalQty: transfer.quantity,
          reservedQty: 0,
        },
      });
    }

    await tx.inventoryTransaction.create({
      data: {
        inventoryId: destInventory.id,
        type: "RECEIVE",
        quantity: transfer.quantity,
        referenceType: "TRANSFER",
        referenceId: transfer.id,
      },
    });

    return tx.stockTransfer.findUnique({
      where: { id: transferId },
      include: { sourceLocation: true, destinationLocation: true, item: true },
    });
  });
};

const listTransfers = async (filters = {}) => {
  const { status, locationId } = filters;
  return prisma.stockTransfer.findMany({
    where: {
      ...(status && { status }),
      ...(locationId && {
        OR: [{ sourceLocationId: locationId }, { destinationLocationId: locationId }],
      }),
    },
    include: { sourceLocation: true, destinationLocation: true, item: true },
    orderBy: { createdAt: "desc" },
  });
};

const getTransferById = async (id) => {
  const transfer = await prisma.stockTransfer.findUnique({
    where: { id },
    include: { sourceLocation: true, destinationLocation: true, item: true },
  });
  if (!transfer) throw new AppError("Transfer not found.", 404);
  return transfer;
};

module.exports = { requestTransfer, dispatchTransfer, receiveTransfer, listTransfers, getTransferById };