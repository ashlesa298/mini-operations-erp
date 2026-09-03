const express = require("express");
const router = express.Router();

const {
  authenticate,
  authorize,
} = require("../middleware/authMiddleware");

const {
  create,
  list,
  getOne,
  cancel,
} = require("../controllers/customerOrderController");

router.use(authenticate);

router.get("/", list);
router.get("/:id", getOne);

router.post(
  "/",
  authorize("ADMIN", "SALES"),
  create
);

router.patch(
  "/:id/cancel",
  authorize("ADMIN", "SALES"),
  cancel
);

module.exports = router;