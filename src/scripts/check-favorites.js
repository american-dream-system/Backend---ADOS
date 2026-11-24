// Server-rule check for the favorites endpoints. No database, no network:  node src/scripts/check-favorites.js
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
    const { setMyFavorite, getMyFavorites } = require("../modules/guests/services");
    const limits = require("../middlewares/rateLimits");
    const router = require("../modules/guests/route");

    // an in-memory stand-in for the guest document: the same add / remove / cap rules the real query expresses
    let list = [];
    let updates = 0;
    guestModel.updateOne = async (filter, update) => {
        updates += 1;
        if (update.$push) {
            const f = update.$push.favorites;
            if (!list.some((x) => x.kind === f.kind && x.itemId === f.itemId) && list.length < 200) list.push(f);
        }
        if (update.$pull) {
            const f = update.$pull.favorites;
            list = list.filter((x) => !(x.kind === f.kind && x.itemId === f.itemId));
        }
    };
    guestModel.findById = () => ({ select: () => ({ lean: async () => ({ favorites: list }) }) });
    const call = async (body, guest = { _id: "me" }) => { const res = fakeRes(); await setMyFavorite({ body, guest, params: { id: "someone-else" }, query: { id: "someone-else" } }, res, (e) => { throw e; }); return res; };

    await test("adding twice is the same as adding once (idempotent)", async () => {
        await call({ kind: "dish", itemId: "d1", favorite: true });
        const r = await call({ kind: "dish", itemId: "d1", favorite: true });
        assert.strictEqual(r.code, 200);
        assert.strictEqual(list.length, 1);
    });
    await test("removing something that is not there succeeds and changes nothing", async () => {
        const r = await call({ kind: "ticket", itemId: "nope", favorite: false });
        assert.strictEqual(r.code, 200);
        assert.strictEqual(list.length, 1);
        const r2 = await call({ kind: "dish", itemId: "d1", favorite: false });
        assert.strictEqual(r2.code, 200);
        assert.strictEqual(list.length, 0);
    });
    await test("bad input is refused before anything is written", async () => {
        const before = updates;
        for (const bad of [
            { kind: "hack", itemId: "x", favorite: true },
            { kind: "dish", itemId: "../x", favorite: true },
            { kind: "dish", itemId: "x".repeat(65), favorite: true },
            { kind: "dish", itemId: { $ne: "" }, favorite: true },
            { kind: "dish", itemId: "x", favorite: "yes" },
            { kind: "dish", itemId: "x" },
            undefined
        ]) {
            const r = await call(bad);
            assert.strictEqual(r.code, 400, JSON.stringify(bad));
        }
        assert.strictEqual(updates, before);
    });
    await test("size limit: the 201st favorite is refused", async () => {
        list = [];
        for (let i = 0; i < 200; i += 1) await call({ kind: "package", itemId: `p${i}`, favorite: true });
        assert.strictEqual(list.length, 200);
        const r = await call({ kind: "package", itemId: "p200", favorite: true });
        assert.strictEqual(r.code, 400);
        assert.strictEqual(list.length, 200);
        const again = await call({ kind: "package", itemId: "p5", favorite: true }); // already there: still fine
        assert.strictEqual(again.code, 200);
        list = [];
    });
    await test("the list is the signed-in guest's own: nothing is read from an id in the request", () => {
        const src = setMyFavorite.toString() + getMyFavorites.toString();
        assert.ok(!/req\.(params|query)/.test(src), "no id from params or query");
        assert.ok(!/req\.body[^;]*guest/i.test(src), "no guest id from the body");
        assert.ok(/req\.guest\._id/.test(src));
    });
    await test("both routes need a signed-in guest and are rate limited", () => {
        for (const method of ["get", "put"]) {
            const layer = router.stack.find((l) => l.route && l.route.path === "/me/favorites" && l.route.methods[method]);
            assert.ok(layer, `${method} /me/favorites exists`);
            assert.ok(layer.route.stack.length >= 3, "protect, limit, handler");
        }
    });
    await test("rate limit: the 121st request in the window is refused with 429", async () => {
        const req = { guest: { _id: "fav-1" }, ip: "2.2.2.2", headers: {} };
        let last;
        for (let i = 0; i < 121; i += 1) { last = fakeRes(); await limits.favoritesPerAccount(req, last, () => {}); }
        assert.strictEqual(last.code, 429);
    });
    await test("the list does not leave through the normal guest JSON", () => {
        const g = new guestModel({ name: "A", phone: "01000000000", age: "30", gender: "male", favorites: [{ kind: "dish", itemId: "d1" }] });
        assert.strictEqual(g.toJSON().favorites, undefined);
    });

    console.log(failed ? `\n${failed} failed` : "\nall passed");
    process.exit(failed ? 1 : 0);
})();
