require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./src/routes/auth");
const protectedRoutes = require("./src/routes/protected");
const vpnRoutes = require("./src/routes/vpn");

const app = express();

// CORS_ORIGIN bisa diisi satu domain atau beberapa dipisah koma
// Contoh: https://vpn.domain.com,https://www.vpn.domain.com
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : ["*"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: Origin '${origin}' not allowed`));
      }
    },
    credentials: true,
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "VPN API Running 🚀",
    version: "1.0.0",
  });
});

app.use("/auth", authRoutes);
app.use("/protected", protectedRoutes);
app.use("/vpn", vpnRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
