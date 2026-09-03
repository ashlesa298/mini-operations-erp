const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/authMiddleware");
const meta = require("../controllers/metaController");

router.use(authenticate);

router.get("/locations", meta.getLocations);
router.post("/locations", authorize("ADMIN"), meta.createLocation);

router.get("/categories", meta.getCategories);
router.post("/categories", authorize("ADMIN"), meta.createCategory);

router.get("/items", meta.getItems);
router.post("/items", authorize("ADMIN", "OPERATIONS"), meta.createItem);

router.get("/users", authorize("ADMIN"), meta.getUsers);
router.get("/customers", meta.getCustomers);

module.exports = router;