const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/authMiddleware");
const { list, getOne, create, update } = require("../controllers/employeeController");

router.use(authenticate);

router.get("/", authorize("ADMIN"), list);
router.get("/:id", authorize("ADMIN"), getOne);
router.post("/", authorize("ADMIN"), create);
router.patch("/:id", authorize("ADMIN"), update);

module.exports = router;