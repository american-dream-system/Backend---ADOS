// Real visitor IP behind Cloudflare -> Traefik -> this app.
//
// Traefik overwrites X-Forwarded-For with the address it actually saw, which behind Cloudflare is a
// Cloudflare edge address. Cloudflare puts the visitor's address in CF-Connecting-IP. That header is
// only believable when the request really came from Cloudflare, so it is used ONLY when the peer
// address (what Traefik saw, i.e. req.ip with `trust proxy` = 1) falls inside Cloudflare's published
// ranges. A direct request to the server with a forged CF-Connecting-IP keeps its own address.
//
// Cloudflare ranges: https://www.cloudflare.com/ips-v4 and https://www.cloudflare.com/ips-v6
// (they change rarely; refresh this list if Cloudflare announces a change).
const net = require("net");

const CLOUDFLARE_V4 = [
    "173.245.48.0/20", "103.21.244.0/22", "103.22.200.0/22", "103.31.4.0/22", "141.101.64.0/18",
    "108.162.192.0/18", "190.93.240.0/20", "188.114.96.0/20", "197.234.240.0/22", "198.41.128.0/17",
    "162.158.0.0/15", "104.16.0.0/13", "104.24.0.0/14", "172.64.0.0/13", "131.0.72.0/22",
];
const CLOUDFLARE_V6 = [
    "2400:cb00::/32", "2606:4700::/32", "2803:f800::/32", "2405:b500::/32", "2405:8100::/32",
    "2a06:98c0::/29", "2c0f:f248::/32",
];

const cloudflare = new net.BlockList();
const addSubnets = (list, family) =>
    list.forEach((cidr) => {
        const [addr, bits] = cidr.split("/");
        cloudflare.addSubnet(addr, Number(bits), family);
    });
addSubnets(CLOUDFLARE_V4, "ipv4");
addSubnets(CLOUDFLARE_V6, "ipv6");

// "::ffff:1.2.3.4" (IPv4 seen on a dual-stack socket) -> "1.2.3.4"
const normalize = (ip) => (typeof ip === "string" ? ip.replace(/^::ffff:/i, "") : "");

const isCloudflare = (ip) => {
    const addr = normalize(ip);
    const family = net.isIP(addr);
    return family !== 0 && cloudflare.check(addr, family === 4 ? "ipv4" : "ipv6");
};

const realClientIp = (req, res, next) => {
    const header = req.headers["cf-connecting-ip"];
    const visitor = typeof header === "string" ? normalize(header.trim()) : "";
    if (visitor && net.isIP(visitor) && isCloudflare(req.ip)) {
        // req.ip is a getter on Express's prototype; shadow it on this request only
        Object.defineProperty(req, "ip", { value: visitor, configurable: true, enumerable: true });
    }
    next();
};

module.exports = { realClientIp, isCloudflare };
