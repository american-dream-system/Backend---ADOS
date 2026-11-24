// Server-rule check for the account endpoints (edit personal information, change password). No database, no network:
//   node src/scripts/check-account.js
const assert = require("assert");
process.env.JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || "check-access-secret-0123456789abcdef-xyz";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "check-refresh-secret-0123456789abcdef-qrs";

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
    const { updateMe, changePassword } = require("../modules/auth/services");
    const limits = require("../middlewares/rateLimits");
    const router = require("../modules/auth/routes");
    const { protectGuest } = require("../middlewares/authMiddleware");
    const { createToken } = require("../utils/token");

    const makeMe = (over = {}) => {
        const me = {
            _id: "me-id", name: "Old Name", phone: "01012345678", age: "30", gender: "male", password: "hashed",
            comparePassword: async (p) => p === "current-pass",
            save: async () => { me.saved = true; },
            ...over
        };
        return me;
    };
    let updates = [];
    let otherOwner = null;
    guestModel.updateOne = async (filter, update) => { updates.push({ filter, update }); };
    guestModel.findOne = () => ({ select: () => ({ lean: async () => otherOwner }) });
    guestModel.findById = async () => ({ name: "fresh", toJSON() { return { name: "fresh" }; } });
    const edit = async (body, me = makeMe()) => { updates = []; const res = fakeRes(); await updateMe({ body, guest: me, params: { id: "other" }, query: {} }, res, (e) => { throw e; }); return res; };

    await test("edit: only the account in the token is changed, never an id from the request", async () => {
        const r = await edit({ name: "New Name", _id: "someone-else", id: "someone-else", guestId: "someone-else" });
        assert.strictEqual(r.code, 200);
        assert.strictEqual(updates[0].filter._id, "me-id");
        assert.deepStrictEqual(Object.keys(updates[0].update.$set), ["name"]);
    });
    await test("edit: nothing but name, phone, age and gender can be set (no role, points, password, email)", async () => {
        const r = await edit({ name: "New Name", role: "admin", points: 99999, password: "x", email: "a@b.c", isVip: true });
        assert.strictEqual(r.code, 200);
        assert.deepStrictEqual(Object.keys(updates[0].update.$set), ["name"]);
    });
    await test("edit: the same rules as sign-up (name 3+, Egyptian mobile, age, gender)", async () => {
        assert.strictEqual((await edit({ name: "ab" })).code, 400);
        assert.strictEqual((await edit({ phone: "0123" })).code, 400);
        assert.strictEqual((await edit({ phone: "01312345678", currentPassword: "current-pass" })).code, 400);
        assert.strictEqual((await edit({ age: "  " })).code, 400);
        assert.strictEqual((await edit({ gender: "other" })).code, 400);
        assert.strictEqual((await edit({})).code, 400);
        assert.strictEqual(updates.length, 0);
    });
    await test("edit: a new phone needs the current password; a wrong one is refused with a clear 403", async () => {
        assert.strictEqual((await edit({ phone: "01112345678" })).code, 400);
        const wrong = await edit({ phone: "01112345678", currentPassword: "nope" });
        assert.strictEqual(wrong.code, 403);
        assert.ok(/غير صحيحة/.test(wrong.body.message));
        assert.strictEqual(updates.length, 0);
    });
    await test("edit: a phone another account uses gives a clear 409 and saves nothing", async () => {
        otherOwner = { _id: "other-account" };
        const r = await edit({ phone: "01112345678", currentPassword: "current-pass" });
        otherOwner = null;
        assert.strictEqual(r.code, 409);
        assert.ok(/مسجل بالفعل/.test(r.body.message));
        assert.strictEqual(updates.length, 0);
    });
    await test("edit: phone formatting is the sign-up / login one (+20 and spaces become 01...)", async () => {
        const r = await edit({ phone: "+20 111 234 5678", currentPassword: "current-pass" });
        assert.strictEqual(r.code, 200);
        assert.strictEqual(updates[0].update.$set.phone, "01112345678");
    });
    await test("edit: keeping the same phone needs no password", async () => {
        const r = await edit({ phone: "0101 234 5678", name: "Same Phone" });
        assert.strictEqual(r.code, 200);
        assert.strictEqual(updates[0].update.$set.phone, undefined);
    });

    // ---- change password
    const hashed = [];
    const change = async (body, me = makeMe()) => { const res = fakeRes(); await changePassword({ body, guest: { _id: "me-id" } }, res, (e) => { throw e; }); return { res, me }; };
    let meDoc;
    guestModel.findById = async () => meDoc;
    await test("password: wrong current password is refused (403) and nothing changes", async () => {
        meDoc = makeMe();
        const { res } = await change({ currentPassword: "bad", newPassword: "brand-new-1", newPasswordConfirm: "brand-new-1" });
        assert.strictEqual(res.code, 403);
        assert.ok(!meDoc.saved);
    });
    await test("password: the same rules as sign-up (6+ characters, confirmation matches)", async () => {
        meDoc = makeMe();
        assert.strictEqual((await change({ currentPassword: "current-pass", newPassword: "12345", newPasswordConfirm: "12345" })).res.code, 400);
        assert.strictEqual((await change({ currentPassword: "current-pass", newPassword: "brand-new-1", newPasswordConfirm: "different" })).res.code, 400);
        assert.strictEqual((await change({ newPassword: "brand-new-1" })).res.code, 400);
        assert.ok(!meDoc.saved);
    });
    await test("password: a new password equal to the current one is rejected", async () => {
        meDoc = makeMe();
        const { res } = await change({ currentPassword: "current-pass", newPassword: "current-pass", newPasswordConfirm: "current-pass" });
        assert.strictEqual(res.code, 400);
        assert.ok(!meDoc.saved);
    });
    await test("password: success stores it for hashing, ends other sessions, returns fresh tokens and no password", async () => {
        meDoc = makeMe();
        const { res } = await change({ currentPassword: "current-pass", newPassword: "brand-new-1", newPasswordConfirm: "brand-new-1" });
        assert.strictEqual(res.code, 200);
        assert.ok(meDoc.saved);
        assert.strictEqual(meDoc.password, "brand-new-1"); // hashed by the model's pre-save hook, the same one sign-up uses
        assert.ok(meDoc.passwordChangedAt instanceof Date);
        assert.ok(meDoc.refreshToken && res.body.refreshToken === meDoc.refreshToken && res.body.token);
        assert.ok(!JSON.stringify(res.body).includes("brand-new-1") && !JSON.stringify(res.body).includes("current-pass"));
    });
    await test("password hook: the model hashes with the same bcrypt as sign-up", () => {
        assert.ok(guestModel.schema.s.hooks._pres.get("save").length >= 1);
    });
    await test("sessions: a token issued before the password change is refused, a newer one works", async () => {
        const old = createToken({ id: "me-id" });
        const changedAt = new Date(Date.now() + 5000); // the change happened after the old token was issued
        guestModel.findById = async () => ({ _id: "me-id", passwordChangedAt: changedAt });
        const r1 = fakeRes(); let passed = false;
        await protectGuest({ headers: { authorization: `Bearer ${old}` } }, r1, () => { passed = true; });
        assert.strictEqual(r1.code, 401); assert.ok(!passed);
        guestModel.findById = async () => ({ _id: "me-id", passwordChangedAt: new Date(Date.now() - 10000) });
        const r2 = fakeRes(); passed = false;
        await protectGuest({ headers: { authorization: `Bearer ${old}` } }, r2, () => { passed = true; });
        assert.ok(passed);
        guestModel.findById = async () => ({ _id: "me-id" }); // never changed: unaffected
        passed = false;
        await protectGuest({ headers: { authorization: `Bearer ${old}` } }, fakeRes(), () => { passed = true; });
        assert.ok(passed);
    });

    await test("routes: both need a signed-in guest and the account limiters", () => {
        for (const [method, p] of [["put", "/me"], ["post", "/change-password"]]) {
            const layer = router.stack.find((l) => l.route && l.route.path === p && l.route.methods[method]);
            assert.ok(layer, `${method} ${p}`);
            assert.strictEqual(layer.route.stack.length, 4, "ip limit, protect, account limit, handler");
        }
    });
    await test("rate limit per account: the 9th failed try in 15 minutes is refused with 429", async () => {
        const req = { guest: { _id: "acct-1" }, ip: "3.3.3.3", headers: {} };
        let last;
        for (let i = 0; i < 9; i += 1) {
            last = fakeRes();
            let finish;
            last.on = (ev, cb) => { if (ev === "finish") finish = cb; return last; };
            await limits.accountPerAccount(req, last, () => { last.statusCode = 403; });
            if (finish) { last.statusCode = 403; finish(); }
        }
        assert.strictEqual(last.code, 429);
    });
    await test("rate limit per address: the 31st request is refused with 429", async () => {
        const req = { ip: "4.4.4.4", headers: {} };
        let last;
        for (let i = 0; i < 31; i += 1) { last = fakeRes(); await limits.accountPerIp(req, last, () => {}); }
        assert.strictEqual(last.code, 429);
    });
    await test("no password is ever logged by the account code", () => {
        const src = require("fs").readFileSync(require("path").join(__dirname, "..", "modules", "auth", "services.js"), "utf8");
        const part = src.slice(src.indexOf("// OWN ACCOUNT"));
        assert.ok(!/console\./.test(part), "no console output in the account code");
    });

    console.log(failed ? `\n${failed} failed` : "\nall passed");
    process.exit(failed ? 1 : 0);
})();
