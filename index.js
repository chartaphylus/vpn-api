const express = require("express");
const cors = require("cors");

const authRoutes = require("./src/routes/auth");
const protectedRoutes = require("./src/routes/protected");

const vpnRoutes = require("./src/routes/vpn");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "VPN API Running 🚀",
  });
});

app.use("/auth", authRoutes);
app.use("/protected", protectedRoutes);
app.use("/vpn", vpnRoutes);

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
