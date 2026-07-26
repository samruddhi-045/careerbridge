const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/auth.routes");
const companyRoutes = require("./routes/company.routes");
const candidateProfileRoutes = require("./routes/candidateProfile.routes");
const { errorHandler, notFound } = require("./middleware/errorHandler");

const app = express();

// so rate-limiter sees the real client IP when behind a proxy (Render, nginx, etc)
app.set("trust proxy", 1);

// ---- Core middleware ----
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true, // needed so the refresh cookie can be sent cross-origin
  })
);
app.use(express.json({ limit: "10kb" })); // keep request bodies small
app.use(cookieParser());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ---- Routes ----
app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/companies", companyRoutes);
app.use("/api/v1/candidates", candidateProfileRoutes);

// ---- Error handling (must be last) ----
app.use(notFound);
app.use(errorHandler);

module.exports = app;