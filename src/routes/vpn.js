const express = require("express");
const { v4: uuidv4 } = require("uuid");
const QRCode = require("qrcode");

const prisma = require("../lib/prisma");
const authMiddleware = require("../middleware/auth");
const { generateClientConfig } = require("../utils/wireguard");
const fs = require("fs");
const { execSync } = require("child_process");

const router = express.Router();

// GET /vpn — list all VPN users
router.get("/", authMiddleware, async (req, res) => {
  try {
    const users = await prisma.vPNUser.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /vpn/:id — get single VPN user
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const user = await prisma.vPNUser.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /vpn/create — create new VPN user
router.post("/create", authMiddleware, async (req, res) => {
  try {
    const { name, email, expiredAt } = req.body;

    if (!name || !expiredAt) {
      return res.status(400).json({ message: "name and expiredAt are required" });
    }

    // Generate unique IP in 10.10.0.x range
    const existingUsers = await prisma.vPNUser.findMany({ select: { ipAddress: true } });
    const usedIPs = existingUsers.map((u) => u.ipAddress).filter(Boolean);
    let clientIp;
    let attempts = 0;
    do {
      clientIp = `10.10.0.${Math.floor(Math.random() * 200) + 2}`;
      attempts++;
    } while (usedIPs.includes(clientIp) && attempts < 300);

    const { clientPrivateKey, clientPublicKey, config } = generateClientConfig(
      name,
      clientIp
    );

    // Append peer to WireGuard config
    fs.appendFileSync(
      "/etc/wireguard/wg0.conf",
      `\n[Peer]\nPublicKey = ${clientPublicKey}\nAllowedIPs = ${clientIp}/32\n`
    );

    execSync("sudo wg syncconf wg0 <(wg-quick strip wg0)", {
      shell: "/bin/bash",
    });

    // Generate QR code as data URL
    const qrCode = await QRCode.toDataURL(config);

    const vpnUser = await prisma.vPNUser.create({
      data: {
        name,
        email: email || null,
        uuid: uuidv4(),
        config,
        ipAddress: clientIp,
        expiredAt: new Date(expiredAt),
      },
    });

    res.json({
      message: "VPN user created",
      vpnUser,
      qrCode,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// PATCH /vpn/:id/toggle — toggle active/inactive
router.patch("/:id/toggle", authMiddleware, async (req, res) => {
  try {
    const user = await prisma.vPNUser.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    const updated = await prisma.vPNUser.update({
      where: { id: parseInt(req.params.id) },
      data: { isActive: !user.isActive },
    });

    res.json({ message: "User status updated", vpnUser: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE /vpn/:id — delete VPN user
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const user = await prisma.vPNUser.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    await prisma.vPNUser.delete({
      where: { id: parseInt(req.params.id) },
    });

    res.json({ message: "VPN user deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
