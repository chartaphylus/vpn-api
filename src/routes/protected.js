const express = require("express");

const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.get("/me", authMiddleware, async (req, res) => {
  res.json({
    message: "Protected route success",
    user: req.user,
  });
});

module.exports = router;
