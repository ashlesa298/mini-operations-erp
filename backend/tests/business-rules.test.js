
const request = require("supertest");
const app = require("../server");
const prisma = require("../config/db");

let adminCookie, opsCookie, salesCookie;
let location, location2, category, item;

const uniqueEmail = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`;

const registerAndLogin = async (role) => {
  const res = await request(app)
    .post("/api/auth/register")
    .send({
      name: `${role} Tester`,
      email: uniqueEmail(role.toLowerCase()),
      password: "password123",
      role,
    });

  return res.headers["set-cookie"];
};

beforeAll(async () => {
  adminCookie = await registerAndLogin("ADMIN");
  opsCookie = await registerAndLogin("OPERATIONS");
  salesCookie = await registerAndLogin("SALES");

  category = await prisma.category.create({
    data: {
      name: `Cat-${Date.now()}`,
    },
  });

  item = await prisma.item.create({
    data: {
      name: "Test Widget",
      sku: `SKU-${Date.now()}`,
      categoryId: category.id,
    },
  });

  location = await prisma.location.create({
    data: {
      name: `WH-${Date.now()}-A`,
    },
  });

  location2 = await prisma.location.create({
    data: {
      name: `WH-${Date.now()}-B`,
    },
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Mandatory business rule tests", () => {
  // =========================================================
  // TEST 1
  // Cannot reserve more than available inventory
  // =========================================================
  test("Test 1: cannot reserve more than available inventory", async () => {
    const inv = await prisma.inventory.create({
      data: {
        itemId: item.id,
        locationId: location.id,
        batchNumber: `B1-${Date.now()}`,
        physicalQty: 10,
        reservedQty: 0,
      },
    });

    const customer = await prisma.customer.create({
      data: {
        name: `Cust-${Date.now()}`,
      },
    });

    const res = await request(app)
      .post("/api/orders")
      .set("Cookie", salesCookie)
      .send({
        customerId: customer.id,
        items: [
          {
            itemId: item.id,
            locationId: location.id,
            quantity: 15,
          },
        ],
      });

    expect(res.status).toBe(409);

    const check = await prisma.inventory.findUnique({
      where: {
        id: inv.id,
      },
    });

    expect(check.reservedQty).toBe(0);
  });

  // =========================================================
  // TEST 2
  // Cannot transfer more than available inventory
  // =========================================================
  test("Test 2: cannot transfer more than available inventory", async () => {
    const inv = await prisma.inventory.create({
      data: {
        itemId: item.id,
        locationId: location.id,
        batchNumber: `B2-${Date.now()}`,
        physicalQty: 5,
        reservedQty: 0,
      },
    });

    const createRes = await request(app)
      .post("/api/transfers")
      .set("Cookie", opsCookie)
      .send({
        sourceLocationId: location.id,
        destinationLocationId: location2.id,
        itemId: item.id,
        quantity: 100,
      });

    expect(createRes.status).toBe(201);

    const transferId = createRes.body.data.id;

    const dispatchRes = await request(app)
      .patch(`/api/transfers/${transferId}/dispatch`)
      .set("Cookie", opsCookie);

    expect(dispatchRes.status).toBe(409);

    const check = await prisma.inventory.findUnique({
      where: {
        id: inv.id,
      },
    });

    expect(check.physicalQty).toBe(5);
  });

  // =========================================================
  // TEST 3
  // Destination stock increases only after receipt
  // =========================================================
  test("Test 3: destination stock increases only after receipt", async () => {
    // Create completely fresh data for this test.
    // This prevents Test 1 and Test 2 inventory records
    // from interfering with the transfer calculation.

    const testCategory = await prisma.category.create({
      data: {
        name: `TransferCat-${Date.now()}-${Math.random()}`,
      },
    });

    const testItem = await prisma.item.create({
      data: {
        name: `Transfer Widget-${Date.now()}`,
        sku: `TRANSFER-SKU-${Date.now()}-${Math.random()}`,
        categoryId: testCategory.id,
      },
    });

    const sourceLocation = await prisma.location.create({
      data: {
        name: `TRANSFER-SOURCE-${Date.now()}-${Math.random()}`,
      },
    });

    const destinationLocation = await prisma.location.create({
      data: {
        name: `TRANSFER-DEST-${Date.now()}-${Math.random()}`,
      },
    });

    // Source inventory = 50
    await prisma.inventory.create({
      data: {
        itemId: testItem.id,
        locationId: sourceLocation.id,
        batchNumber: `B3-${Date.now()}`,
        physicalQty: 50,
        reservedQty: 0,
      },
    });

    // Create transfer
    const createRes = await request(app)
      .post("/api/transfers")
      .set("Cookie", opsCookie)
      .send({
        sourceLocationId: sourceLocation.id,
        destinationLocationId: destinationLocation.id,
        itemId: testItem.id,
        quantity: 20,
      });

    expect(createRes.status).toBe(201);

    const transferId = createRes.body.data.id;

    // ---------------------------------------------------------
    // REQUESTED -> DISPATCHED
    // ---------------------------------------------------------
    const dispatchRes = await request(app)
      .patch(`/api/transfers/${transferId}/dispatch`)
      .set("Cookie", opsCookie);

    expect(dispatchRes.status).toBe(200);

    // Source should now have 30
    const sourceAfterDispatch = await prisma.inventory.findFirst({
      where: {
        itemId: testItem.id,
        locationId: sourceLocation.id,
      },
    });

    expect(sourceAfterDispatch.physicalQty).toBe(30);

    // Destination should still have NO inventory
    // before receipt.
    const destBefore = await prisma.inventory.findFirst({
      where: {
        itemId: testItem.id,
        locationId: destinationLocation.id,
      },
    });

    const before = destBefore?.physicalQty || 0;

    expect(before).toBe(0);

    // ---------------------------------------------------------
    // DISPATCHED -> RECEIVED
    // ---------------------------------------------------------
    const receiveRes = await request(app)
      .patch(`/api/transfers/${transferId}/receive`)
      .set("Cookie", opsCookie);

    expect(receiveRes.status).toBe(200);

    // Destination should increase only now.
    const destAfter = await prisma.inventory.findFirst({
      where: {
        itemId: testItem.id,
        locationId: destinationLocation.id,
      },
    });

    expect(destAfter).not.toBeNull();
    expect(destAfter.physicalQty).toBe(before + 20);
  });

  // =========================================================
  // TEST 4
  // Same transfer cannot be received twice
  // =========================================================
  test("Test 4: same transfer cannot be received twice", async () => {
    const inv = await prisma.inventory.create({
      data: {
        itemId: item.id,
        locationId: location.id,
        batchNumber: `B4-${Date.now()}`,
        physicalQty: 50,
        reservedQty: 0,
      },
    });

    const createRes = await request(app)
      .post("/api/transfers")
      .set("Cookie", opsCookie)
      .send({
        sourceLocationId: location.id,
        destinationLocationId: location2.id,
        itemId: item.id,
        quantity: 10,
      });

    expect(createRes.status).toBe(201);

    const transferId = createRes.body.data.id;

    // REQUESTED -> DISPATCHED
    const dispatchRes = await request(app)
      .patch(`/api/transfers/${transferId}/dispatch`)
      .set("Cookie", opsCookie);

    expect(dispatchRes.status).toBe(200);

    // First receive should succeed.
    const first = await request(app)
      .patch(`/api/transfers/${transferId}/receive`)
      .set("Cookie", opsCookie);

    expect(first.status).toBe(200);

    // Second receive must fail.
    const second = await request(app)
      .patch(`/api/transfers/${transferId}/receive`)
      .set("Cookie", opsCookie);

    expect(second.status).toBe(400);
  });

  // =========================================================
  // TEST 5
  // Unauthorized user cannot perform restricted operation
  // =========================================================
  test("Test 5: unauthorized user cannot perform restricted operation", async () => {
    const res = await request(app)
      .post("/api/work-orders")
      .set("Cookie", salesCookie)
      .send({
        locationId: location.id,
        itemId: item.id,
        requiredQty: 5,
        assignedUserId: "irrelevant",
      });

    expect(res.status).toBe(403);
  });
});
