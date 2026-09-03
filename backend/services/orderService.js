const prisma = require("../config/db");
const AppError = require("../utils/AppError");
const {
  reserveStock,
  releaseStock,
} = require("./inventoryService");

// ---------------------------------------------------------
// CREATE ORDER FOR EXISTING CUSTOMER
// ---------------------------------------------------------

const createOrderWithReservation = async ({
  customerId,
  createdById,
  items,
}) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError("Order must include at least one item.", 400);
  }

  return prisma.$transaction(async (tx) => {
    // Verify customer exists inside transaction
    const customer = await tx.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new AppError("Customer not found.", 404);
    }

    // Create order
    const order = await tx.customerOrder.create({
      data: {
        customerId,
        createdById,
        status: "PENDING",
      },
    });

    // Process every order line
    for (const line of items) {
      const inventory = await tx.inventory.findFirst({
        where: {
          itemId: line.itemId,
          locationId: line.locationId,
        },
      });

      if (!inventory) {
        throw new AppError(
          "No inventory found for one of the requested items at this location.",
          400
        );
      }

      // Atomic stock reservation
      await reserveStock(
        tx,
        inventory.id,
        line.quantity,
        "ORDER",
        order.id
      );

      // Create order item
      await tx.orderItem.create({
        data: {
          orderId: order.id,
          itemId: line.itemId,
          locationId: line.locationId,
          quantity: line.quantity,
          reservedQty: line.quantity,
        },
      });
    }

    // Mark order as reserved
    return tx.customerOrder.update({
      where: {
        id: order.id,
      },
      data: {
        status: "RESERVED",
      },
      include: {
        items: {
          include: {
            item: true,
            location: true,
          },
        },
        customer: true,
      },
    });
  });
};

// ---------------------------------------------------------
// CREATE ORDER WITH NEW CUSTOMER
// ---------------------------------------------------------

const createOrderWithNewCustomer = async ({
  customerName,
  createdById,
  items,
}) => {
  if (!customerName || !customerName.trim()) {
    throw new AppError("Customer name is required.", 400);
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError("Order must include at least one item.", 400);
  }

  return prisma.$transaction(async (tx) => {
    // IMPORTANT:
    // Customer creation is INSIDE the same transaction.
    const customer = await tx.customer.create({
      data: {
        name: customerName.trim(),
      },
    });

    // Create order
    const order = await tx.customerOrder.create({
      data: {
        customerId: customer.id,
        createdById,
        status: "PENDING",
      },
    });

    // Process every order line
    for (const line of items) {
      const inventory = await tx.inventory.findFirst({
        where: {
          itemId: line.itemId,
          locationId: line.locationId,
        },
      });

      if (!inventory) {
        throw new AppError(
          "No inventory found for one of the requested items at this location.",
          400
        );
      }

      // Atomic stock reservation
      await reserveStock(
        tx,
        inventory.id,
        line.quantity,
        "ORDER",
        order.id
      );

      // Create order item
      await tx.orderItem.create({
        data: {
          orderId: order.id,
          itemId: line.itemId,
          locationId: line.locationId,
          quantity: line.quantity,
          reservedQty: line.quantity,
        },
      });
    }

    // Mark order as reserved
    return tx.customerOrder.update({
      where: {
        id: order.id,
      },
      data: {
        status: "RESERVED",
      },
      include: {
        items: {
          include: {
            item: true,
            location: true,
          },
        },
        customer: true,
      },
    });
  });
};

// ---------------------------------------------------------
// CANCEL ORDER
// ---------------------------------------------------------

const cancelOrder = async (orderId) => {
  return prisma.$transaction(async (tx) => {
    const order = await tx.customerOrder.findUnique({
      where: {
        id: orderId,
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new AppError("Order not found.", 404);
    }

    if (order.status === "CANCELLED") {
      throw new AppError("Order is already cancelled.", 400);
    }

    if (order.status === "FULFILLED") {
      throw new AppError(
        "Cannot cancel a fulfilled order.",
        400
      );
    }

    // Release reserved stock
    for (const line of order.items) {
      if (line.reservedQty > 0) {
        const inventory = await tx.inventory.findFirst({
          where: {
            itemId: line.itemId,
            locationId: line.locationId,
          },
        });

        if (inventory) {
          await releaseStock(
            tx,
            inventory.id,
            line.reservedQty,
            "ORDER_CANCEL",
            order.id
          );
        }

        await tx.orderItem.update({
          where: {
            id: line.id,
          },
          data: {
            reservedQty: 0,
          },
        });
      }
    }

    // Cancel order
    return tx.customerOrder.update({
      where: {
        id: orderId,
      },
      data: {
        status: "CANCELLED",
      },
      include: {
        items: {
          include: {
            item: true,
            location: true,
          },
        },
        customer: true,
      },
    });
  });
};

// ---------------------------------------------------------
// LIST ORDERS
// ---------------------------------------------------------

const listOrders = async (filters = {}) => {
  const { status, customerId } = filters;

  return prisma.customerOrder.findMany({
    where: {
      ...(status && { status }),
      ...(customerId && { customerId }),
    },
    include: {
      items: {
        include: {
          item: true,
          location: true,
        },
      },
      customer: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

// ---------------------------------------------------------
// GET ORDER BY ID
// ---------------------------------------------------------

const getOrderById = async (id) => {
  const order = await prisma.customerOrder.findUnique({
    where: {
      id,
    },
    include: {
      items: {
        include: {
          item: true,
          location: true,
        },
      },
      customer: true,
    },
  });

  if (!order) {
    throw new AppError("Order not found.", 404);
  }

  return order;
};

// ---------------------------------------------------------
// EXPORTS
// ---------------------------------------------------------

module.exports = {
  createOrderWithReservation,
  createOrderWithNewCustomer,
  cancelOrder,
  listOrders,
  getOrderById,
};