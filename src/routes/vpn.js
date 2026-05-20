const express = require("express");
const { v4: uuidv4 } = require("uuid");

const prisma = require("../lib/prisma");
const authMiddleware = require("../middleware/auth");
const { generateClientConfig } = require("../utils/wireguard");
const fs = require("fs");
const { execSync } = require("child_process");

const router = express.Router();

router.post("/create", authMiddleware, async (req, res) => {
  try {
    const { name, email, expiredAt } = req.body;

    const clientIp = `10.10.0.${Math.floor(Math.random() * 200) + 2}`;

    const {
      clientPrivateKey,
      clientPublicKey,
      config,
    } = generateClientConfig(name, clientIp);

    fs.appendFileSync(
      "/etc/wireguard/wg0.conf",
      `

[Peer]
PublicKey = ${clientPublicKey}
AllowedIPs = ${clientIp}/32
`
    );

    execSync("sudo wg syncconf wg0 <(wg-quick strip wg0)", {
      shell: "/bin/bash",
    });

    const vpnUser = await prisma.vPNUser.create({
      data: {
        name,
        email,
        uuid: uuidv4(),
        config,
        ipAddress: clientIp,
        expiredAt: new Date(expiredAt),
      },
    });

    res.json({
      message: "VPN user created",
      vpnUser,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  const users = await prisma.vPNUser.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  res.json(users);
});

module.exports = router;
