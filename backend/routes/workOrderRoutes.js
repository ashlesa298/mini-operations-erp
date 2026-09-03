const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/authMiddleware");
const { create, list, getOne, updateStatus } = require("../controllers/workOrderController");

router.use(authenticate);

router.get("/", list);
router.get("/:id", getOne);
router.post("/", authorize("ADMIN"), create);
router.patch("/:id/status", authorize("ADMIN", "OPERATIONS"), updateStatus);

module.exports = router;