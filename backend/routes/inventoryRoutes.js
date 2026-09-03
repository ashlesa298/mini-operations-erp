const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/authMiddleware");
const { list, getOne, create, adjust } = require("../controllers/inventoryController");

router.use(authenticate);

router.get("/", list);
router.get("/:id", getOne);
router.post("/", authorize("ADMIN", "OPERATIONS"), create);
router.patch("/:id/adjust", authorize("ADMIN", "OPERATIONS"), adjust);

module.exports = router;