const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authMiddleware");
const { dashboard } = require("../controllers/reportController");

router.use(authenticate);
router.get("/dashboard", dashboard);

module.exports = router;