const express = require("express");
const router = express.Router();

// GET /api/v1/health - simple check to confirm the server is running
router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: "ok",
      timestamp: new Date().toISOString(),
    },
    message: "Server is healthy",
  });
});

module.exports = router;
