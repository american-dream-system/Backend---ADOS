// Checkout trace for every bookable type, against a THROWAWAY database and a locally running server.
//   SCRATCH_DB_URL=mongodb://127.0.0.1:27017/ados_scratch API=http://localhost:5001 \
//     node scratch/test_checkout_types.js [full | zero-packages | zero-data]
// It seeds the scratch DB itself (refuses any db not named ados_scratch), posts the same payloads the
// cart sends (Kids Area offer, Fun Park offer, Challenge pass, Adventure pass, Packages-tab package,
// featured items booked from the Play Zone home, an old cart, a deleted item), then reads the saved
// order back and checks which item each line points at, its names and its price.
const mongoose = require("mongoose");
const Ticket = require("../src/modules/tickets/model");
const Pkg = require("../src/modules/packges/model");
const Buying = require("../src/modules/buying/model");

const url = process.env.SCRATCH_DB_URL || "";
const API = (process.env.API || "http://localhost:5001").replace(/\/$/, "");
const mode = process.argv[2] || "full";
if (!/\/ados_scratch$/.test(url)) throw new Error("refusing: SCRATCH_DB_URL must end with /ados_scratch");
if (!/^http:\/\/(localhost|127\.0\.0\.1)/.test(API)) throw new Error("refusing: API must be local");

const post = async (body) => {
    const r = await fetch(`${API}/api/buying`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return { status: r.status, json: await r.json().catch(() => ({})) };
};

(async () => {
    await mongoose.connect(url);
    await Promise.all([Ticket.deleteMany({}), Pkg.deleteMany({}), Buying.deleteMany({})]);
    const t = (o) => Ticket.create({ active: true, ...o });
    const p = (o) => Pkg.create({ page: "packages", category: "general", description: "d", active: true, ...o });
    const D = {};
    if (mode !== "zero-data") {
        D.kids = await t({ title: "تذكرة لعب الأطفال", titleAr: "تذكرة لعب الأطفال", titleEn: "Kids Play Pass", page: "kids-area", price: 200, priceAfterDiscount: 150 });
        D.fun = await t({ title: "يوم فن بارك", titleAr: "يوم فن بارك", titleEn: "Fun Park Day", page: "fun-park", price: 300, priceAfterDiscount: 250 });
        D.ch = await t({ title: "تذكرة التحدي", titleAr: "تذكرة التحدي", titleEn: "Challenge Pass", page: "challenge", category: "package", price: 500, priceAfterDiscount: 400 });
        D.adv = await t({ title: "تذكرة المغامرة", titleAr: "تذكرة المغامرة", titleEn: "Adventure Pass", page: "adventure", category: "package", price: 450, priceAfterDiscount: 350 });
        D.game = await t({ title: "لعبة الليزر", titleAr: "لعبة الليزر", titleEn: "Laser Game", page: "challenge", category: "laser", price: 90, priceAfterDiscount: 90 });
        D.gone = await t({ title: "محذوفة", titleAr: "محذوفة", titleEn: "Deleted Ticket", page: "kids-area", price: 10, priceAfterDiscount: 10 });
        await Ticket.deleteOne({ _id: D.gone._id });
    }
    if (mode === "full") {
        D.pkg = await p({ title: "باقة العائلة", titleAr: "باقة العائلة", titleEn: "Family Pass", price: 800, priceAfterDiscount: 600 });
        D.pkg2 = await p({ title: "باقة VIP", titleAr: "باقة VIP", titleEn: "VIP Pass", price: 1000, priceAfterDiscount: 1000 });
    }
    const id = (d) => (d ? String(d._id) : "000000000000000000000000");

    // What the cart sends. Tickets: `tickets` list. Zone-page passes and Packages-tab packages: `packages` list.
    const ticketLine = (d, title) => ({ ticket: id(d), title, quantity: 1, priceEgp: d ? d.priceAfterDiscount : 1, zone: d && d.page });
    const packageLine = (d, title) => ({ package: id(d), title, quantity: 1, priceEgp: d ? d.priceAfterDiscount : 1 });
    const cases = [
        { name: "Kids Area offer", body: { tickets: [ticketLine(D.kids, "تذكرة لعب الأطفال")] }, want: { id: id(D.kids), en: "Kids Play Pass", price: 150 } },
        { name: "Fun Park offer", body: { tickets: [ticketLine(D.fun, "يوم فن بارك - فن بارك")] }, want: { id: id(D.fun), en: "Fun Park Day", price: 250 } },
        { name: "Challenge pass (zone page: type package, ticket id)", body: { packages: [packageLine(D.ch, "تذكرة التحدي")] }, want: { id: id(D.ch), en: "Challenge Pass", price: 400 } },
        { name: "Adventure pass (zone page: type package, ticket id)", body: { packages: [packageLine(D.adv, "تذكرة المغامرة")] }, want: { id: id(D.adv), en: "Adventure Pass", price: 350 } },
        { name: "Packages-tab package", body: { packages: [packageLine(D.pkg, "باقة العائلة")] }, want: { id: id(D.pkg), en: "Family Pass", price: 600 }, needsPackage: true },
        { name: "Home featured: Kids offer", body: { tickets: [ticketLine(D.kids, "تذكرة لعب الأطفال")] }, want: { id: id(D.kids), en: "Kids Play Pass", price: 150 } },
        { name: "Home featured: Challenge pass (ticket line)", body: { tickets: [ticketLine(D.ch, "تذكرة التحدي")] }, want: { id: id(D.ch), en: "Challenge Pass", price: 400 } },
        { name: "Home featured: package", body: { packages: [packageLine(D.pkg, "باقة العائلة")] }, want: { id: id(D.pkg), en: "Family Pass", price: 600 }, needsPackage: true },
        { name: "Old cart: Adventure pass as package, title differs", body: { packages: [packageLine(D.adv, "Adventure Pass")] }, want: { id: id(D.adv), en: "Adventure Pass", price: 350 } },
        { name: "Deleted ticket id", body: { tickets: [ticketLine(D.gone, "محذوفة")] }, want: null },
        { name: "Unknown package id", body: { packages: [packageLine(null, "لا شيء")] }, want: null }
    ];

    let failed = 0;
    console.log(`MODE ${mode}  (tickets=${await Ticket.countDocuments()}, packages=${await Pkg.countDocuments()})`);
    for (const c of cases) {
        const before = await Buying.countDocuments();
        const res = await post({ guestName: "Scratch", guestPhone: "01011112222", paymentMethod: "cash", ...c.body });
        const after = await Buying.countDocuments();
        let verdict, detail;
        const expectOk = c.want && (mode === "full" || !c.needsPackage) && mode !== "zero-data";
        if (!expectOk) {
            // must fail cleanly: an error status and no order saved, never another item
            const ok = res.status >= 400 && after === before;
            verdict = ok ? "PASS" : "FAIL";
            detail = `${res.status} ${res.json.message ? String(res.json.message).slice(0, 60) : ""}${after > before ? " ORDER SAVED (wrong)" : ""}`;
        } else if (res.status !== 201) {
            verdict = "FAIL";
            detail = `${res.status} ${String(res.json.message || "").slice(0, 70)}`;
        } else {
            const o = await Buying.findOne({ orderCode: res.json.data.orderCode }).lean();
            const line = [
                ...o.tickets.map((x) => ({ ...x, ref: String(x.ticket), kind: "ticket" })),
                ...o.packages.map((x) => ({ ...x, ref: String(x.package), kind: "package" }))
            ][0];
            const ok = line.ref === c.want.id && line.titleEn === c.want.en && line.unitPrice === c.want.price && o.totalPrice === c.want.price;
            verdict = ok ? "PASS" : "FAIL";
            detail = `line=${line.kind} title="${line.titleEn}"/"${line.titleAr}" zone="${line.zoneEn}" unit=${line.unitPrice} total=${o.totalPrice}${line.ref === c.want.id ? "" : " WRONG ITEM"}`;
        }
        if (verdict === "FAIL") failed += 1;
        console.log(`${verdict}  ${c.name}\n      ${detail}`);
    }
    await mongoose.disconnect();
    console.log(failed ? `\n${failed} FAILED` : "\nALL PASSED");
    process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e.message); process.exit(1); });
