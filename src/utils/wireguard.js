const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function generateClientConfig(name, clientIp) {
  const clientPrivateKey = execSync("wg genkey").toString().trim();

  const clientPublicKey = execSync(
    `echo "${clientPrivateKey}" | wg pubkey`
  )
    .toString()
    .trim();

  // FIX PATH DI SINI
  const serverPublicKey = fs
    .readFileSync(
      path.join("/home/ubuntu/apps/wireguard", "server_public.key"),
      "utf8"
    )
    .trim();

  const config = `
[Interface]
PrivateKey = ${clientPrivateKey}
Address = ${clientIp}/32
DNS = 1.1.1.1

[Peer]
PublicKey = ${serverPublicKey}
Endpoint = 150.109.24.101:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
`;

  return {
    clientPrivateKey,
    clientPublicKey,
    config,
  };
}

module.exports = {
  generateClientConfig,
};
