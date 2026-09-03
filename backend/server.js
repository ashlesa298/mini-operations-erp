require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const { notFound, errorHandler } = require("./middleware/errorMiddleware");

// Routes
const authRoutes = require("./routes/authRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const workOrderRoutes = require("./routes/workOrderRoutes");
const transferRoutes = require("./routes/transferRoutes");
const customerOrderRoutes = require("./routes/customerOrderRoutes");
const reportRoutes = require("./routes/reportRoutes");
const metaRoutes = require("./routes/metaRoutes");

const app = express();

// --------------------
// Middleware
// --------------------

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// --------------------
// Health Check
// --------------------

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
  });
});

// --------------------
// API Routes
// --------------------

app.use("/api/auth", authRoutes);

app.use("/api/employees", employeeRoutes);

app.use("/api/inventory", inventoryRoutes);

app.use("/api/work-orders", workOrderRoutes);

app.use("/api/transfers", transferRoutes);

app.use("/api/orders", customerOrderRoutes);

app.use("/api/reports", reportRoutes);

app.use("/api/meta", metaRoutes);

// --------------------
// Error Handling
// --------------------

app.use(notFound);
app.use(errorHandler);

// --------------------
// Server
// --------------------

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export app for testing
module.exports = app;