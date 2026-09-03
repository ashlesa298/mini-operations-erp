const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/authMiddleware");
const { create, list, getOne, dispatch, receive } = require("../controllers/transferController");

router.use(authenticate);

router.get("/", list);
router.get("/:id", getOne);
router.post("/", authorize("ADMIN", "OPERATIONS"), create);
router.patch("/:id/dispatch", authorize("ADMIN", "OPERATIONS"), dispatch);
router.patch("/:id/receive", authorize("ADMIN", "OPERATIONS"), receive);

module.exports = router;