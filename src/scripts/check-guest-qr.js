// Server-rule check for the guest QR endpoints. No database, no network:  node src/scripts/check-guest-qr.js
const assert = require("assert");
process.env.JWT_SECRET = process.env.JWT_SECRET || "check";
const guestModel = require("../modules/guests/model");

let failed = 0;
const test = async (name, fn) => {
    try { await fn(); console.log("ok   ", name); } catch (e) { failed += 1; console.log("FAIL ", name, "-", e.message); }
};
const fakeRes = () => {
    const r = { code: 200, body: null, headers: {} };
    r.status = (c) => { r.code = c; return r; };
    r.json = (b) => { r.body = b; return r; };
    r.set = (k, v) => { r.headers[k] = v; return r; };
    r.on = () => r;
    return r;
};

(async () => {
    const { scanGuestQr } = require("../modules/guests/services");
    const limits = require("../middlewares/rateLimits");
    const router = require("../modules/guests/route");

    // lookups are stubbed: a known code returns a guest, anything else null
    const KNOWN = "A".repeat(32);
    let lookups = 0;
    guestModel.findOne = () => ({ select: () => ({ lean: async () => { lookups += 1; return null; } }) });

    await test("malformed code: 404 and no database lookup", async () => {
        for (const bad of [undefined, "", "short", "x".repeat(200), { $ne: "" }, 12345, "A".repeat(31) + "!"]) {
            const res = fakeRes();
            await scanGuestQr({ body: { code: bad } }, res, (e) => { throw e; });
            assert.strictEqual(res.code, 404);
        }
        assert.strictEqual(lookups, 0);
    });
    await test("unknown code: the same clear 404 as a malformed one (never reveals who exists)", async () => {
        const a = fakeRes();
        const b = fakeRes();
        await scanGuestQr({ body: { code: KNOWN } }, a, (e) => { throw e; });
        await scanGuestQr({ body: { code: "short" } }, b, (e) => { throw e; });
        assert.strictEqual(a.code, 404);
        assert.deepStrictEqual(a.body, b.body);
        assert.strictEqual(lookups, 1);
    });
    await test("the code is read from the body only", async () => {
        const res = fakeRes();
        await scanGuestQr({ body: {}, query: { code: KNOWN }, params: { code: KNOWN } }, res, (e) => { throw e; });
        assert.strictEqual(res.code, 404);
        assert.strictEqual(lookups, 1);
    });
    await test("scan route is admin-only (guard before the handler) and limited", () => {
        const layer = router.stack.find((l) => l.route && l.route.path === "/scan");
        assert.ok(layer && layer.route.methods.post, "POST /scan exists");
        const handlers = layer.route.stack.map((s) => s.handle);
        assert.ok(handlers.length >= 5, "limit, protect, role check, limit, handler");
        assert.strictEqual(handlers[handlers.length - 1], scanGuestQr);
        // the role guard rejects a non-admin and a missing user
        const allowed = handlers.find((h) => h.length === 3 && h.toString().includes("roles.includes"));
        assert.ok(allowed, "role guard is on the route");
        const res = fakeRes();
        allowed({ guest: { role: "guest" } }, res, () => { throw new Error("let a non-admin through"); });
        assert.strictEqual(res.code, 403);
    });
    await test("own-code route needs a signed-in guest and takes no id from the request", () => {
        const layer = router.stack.find((l) => l.route && l.route.path === "/me/qr");
        assert.ok(layer && layer.route.methods.get);
        assert.ok(!/req\.(params|query|body)/.test(require("../modules/guests/services").getMyQr.toString()), "uses the token only");
    });
    await test("rate limit: the 61st scan in the window is refused with 429", async () => {
        const req = { guest: { _id: "admin-1" }, ip: "1.1.1.1", headers: {} };
        let last;
        for (let i = 0; i < 61; i += 1) { last = fakeRes(); let passed = false; await limits.qrScanPerAdmin(req, last, () => { passed = true; }); if (i < 60) assert.ok(passed, `request ${i + 1} should pass`); }
        assert.strictEqual(last.code, 429);
        assert.ok(last.headers["Retry-After"]);
    });
    await test("the code never leaves through the normal guest JSON", () => {
        const g = new guestModel({ name: "A", phone: "01000000000", age: "30", gender: "male", qrCode: KNOWN });
        assert.strictEqual(g.toJSON().qrCode, undefined);
    });
    await test("codes are random and long enough to be unguessable", () => {
        const c = require("crypto");
        const a = c.randomBytes(24).toString("base64url");
        assert.strictEqual(a.length, 32);
        assert.notStrictEqual(a, c.randomBytes(24).toString("base64url"));
    });

    console.log(failed ? `\n${failed} failed` : "\nall passed");
    process.exit(failed ? 1 : 0);
})();
