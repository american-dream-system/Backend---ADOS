// Tampered-request test for every order route, against a THROWAWAY database and a locally running server.
//   SCRATCH_DB_URL=mongodb://127.0.0.1:27017/ados_scratch API=http://localhost:5001 node scratch/test_order_pricing.js
// Each case sends a request with a lower / negative / absurd price or quantity and checks that the order is
// either saved at the REAL server price or refused (and nothing is saved). Exit code 1 on any failure.
const mongoose = require("mongoose");
const Ticket = require("../src/modules/tickets/model");
const Pkg = require("../src/modules/packges/model");
const Buying = require("../src/modules/buying/model");
const MenuItem = require("../src/modules/menu/model");
const MenuOrder = require("../src/modules/menu/orderModel");
const Event = require("../src/modules/events/model");
const Trip = require("../src/modules/trips/model");

const url = process.env.SCRATCH_DB_URL || "";
const API = (process.env.API || "http://localhost:5001").replace(/\/$/, "");
if (!/\/ados_scratch$/.test(url)) throw new Error("refusing: SCRATCH_DB_URL must end with /ados_scratch");
if (!/^http:\/\/(localhost|127\.0\.0\.1)/.test(API)) throw new Error("refusing: API must be local");

const post = async (path, body) => {
    const r = await fetch(`${API}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return { status: r.status, json: await r.json().catch(() => ({})) };
};

let failed = 0;
const check = (name, ok, detail) => {
    if (!ok) failed += 1;
    console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `\n      ${detail}` : ""}`);
};

(async () => {
    await mongoose.connect(url);
    await Promise.all([Ticket, Pkg, Buying, MenuItem, MenuOrder, Event, Trip].map((m) => m.deleteMany({})));
    const kids = await Ticket.create({ title: "Kids Play Pass", titleEn: "Kids Play Pass", titleAr: "تذكرة لعب الأطفال", page: "kids-area", price: 200, priceAfterDiscount: 150, pointsGets: 5, active: true });
    const zeroDisc = await Ticket.create({ title: "Zero Disc", titleEn: "Zero Disc", page: "fun-park", price: 90, priceAfterDiscount: 0, active: true });
    const off = await Ticket.create({ title: "Off Ticket", titleEn: "Off Ticket", page: "fun-park", price: 50, priceAfterDiscount: 50, active: false });
    const pkg = await Pkg.create({ title: "Family Pass", titleEn: "Family Pass", titleAr: "باقة العائلة", page: "packages", price: 800, priceAfterDiscount: 600, description: "d", active: true });
    const hidden = await Pkg.create({ title: "Hidden Pkg", page: "packages", price: 100, priceAfterDiscount: 100, description: "d", active: false });
    const dbMenu = await MenuItem.create({ nameEn: "DB Burger", nameAr: "برجر", descEn: "d", descAr: "d", price: 100, priceAfterDiscount: 80, category: "burgers", image: "x", available: true });
    const offMenu = await MenuItem.create({ nameEn: "DB Off", nameAr: "ايقاف", descEn: "d", descAr: "d", price: 100, category: "burgers", image: "x", available: false });
    const counts = async () => (await Promise.all([Buying, MenuOrder, Event, Trip].map((m) => m.countDocuments()))).reduce((a, b) => a + b, 0);
    const refused = async (name, path, body, statuses = [400, 404, 409]) => {
        const before = await counts();
        const r = await post(path, body);
        const after = await counts();
        check(name, statuses.includes(r.status) && after === before, `${r.status} ${String(r.json.message || "").slice(0, 70)}${after > before ? " ORDER SAVED" : ""}`);
    };
    const guest = { guestName: "Scratch", guestPhone: "01011112222" };

    console.log("== Tickets / offers / passes / packages (POST /api/buying)");
    let r = await post("/api/buying", { ...guest, paymentMethod: "cash", paymentStatus: "paid", tickets: [{ ticket: String(kids._id), quantity: 2, priceEgp: 1, unitPrice: 1, totalPrice: 2, pricePts: 0 }] });
    let o = r.json.data || {};
    check("ticket sent at price 1 is saved at the real 150 x 2 = 300", r.status === 201 && o.tickets[0].unitPrice === 150 && o.totalPrice === 300, `unit=${o.tickets && o.tickets[0].unitPrice} total=${o.totalPrice}`);
    check("client paymentStatus=paid is ignored (pending)", o.paymentStatus === "pending", `paymentStatus=${o.paymentStatus}`);
    check("points come from the ticket, not the client", o.tickets && o.tickets[0].pointsGets === 10, `pointsGets=${o.tickets && o.tickets[0].pointsGets}`);
    r = await post("/api/buying", { ...guest, packages: [{ package: String(pkg._id), quantity: 1, priceEgp: 1, totalPrice: 1 }] });
    o = r.json.data || {};
    check("package sent at price 1 is saved at the real 600", r.status === 201 && o.packages[0].unitPrice === 600 && o.totalPrice === 600, `unit=${o.packages && o.packages[0].unitPrice} total=${o.totalPrice}`);
    r = await post("/api/buying", { ...guest, tickets: [{ ticket: String(zeroDisc._id), quantity: 1, priceEgp: 0 }] });
    o = r.json.data || {};
    check("discounted price 0 does not make the ticket free (base 90)", r.status === 201 && o.tickets[0].unitPrice === 90, `unit=${o.tickets && o.tickets[0].unitPrice}`);
    for (const q of [-1, 0, 2.5, "abc", "1e3", 51, 1000000, null && 1, [], {}]) {
        if (q === null) continue;
        await refused(`ticket quantity ${JSON.stringify(q)} is refused`, "/api/buying", { ...guest, tickets: [{ ticket: String(kids._id), quantity: q, priceEgp: 150 }] });
    }
    await refused("package negative quantity is refused", "/api/buying", { ...guest, packages: [{ package: String(pkg._id), quantity: -3 }] });
    await refused("inactive ticket is refused", "/api/buying", { ...guest, tickets: [{ ticket: String(off._id), quantity: 1 }] });
    await refused("inactive package is refused", "/api/buying", { ...guest, packages: [{ package: String(hidden._id), quantity: 1 }] });

    console.log("\n== Restaurant menu (POST /api/menu/order)");
    r = await post("/api/menu/order", { customerName: "S", customerPhone: "01011112222", orderType: "delivery", paymentStatus: "paid", deliveryFee: 999, vatAmount: 0, totalAmount: 1, subtotal: 1, items: [{ id: "rest-item-1", price: 1, quantity: 2, lineTotal: 2 }] });
    o = r.json.data || {};
    check("dish sent at price 1 is saved at 185 x 2, fee 0, VAT 14%, total from the server", r.status === 201 && o.items[0].price === 185 && o.subtotal === 370 && o.deliveryFee === 0 && o.vatAmount === 51.8 && o.totalAmount === 421.8, `price=${o.items && o.items[0].price} subtotal=${o.subtotal} fee=${o.deliveryFee} vat=${o.vatAmount} total=${o.totalAmount}`);
    check("menu order paymentStatus=paid is ignored", o.paymentStatus === "pending", `paymentStatus=${o.paymentStatus}`);
    r = await post("/api/menu/order", { customerName: "S", customerPhone: "01011112222", orderType: "delivery", items: [{ id: String(dbMenu._id), price: 1, quantity: 3 }, { id: "rest-combo-2", price: 1, quantity: 1 }] });
    o = r.json.data || {};
    check("MenuItem document and combo are priced from the database (80 x 3 + 360 = 600)", r.status === 201 && o.subtotal === 600, `subtotal=${o.subtotal}`);
    await refused("menu quantity -5 is refused", "/api/menu/order", { customerName: "S", items: [{ id: "rest-item-1", price: 185, quantity: -5 }] });
    await refused("menu quantity 0 is refused", "/api/menu/order", { customerName: "S", items: [{ id: "rest-item-1", quantity: 0 }] });
    await refused("menu quantity 2.5 is refused", "/api/menu/order", { customerName: "S", items: [{ id: "rest-item-1", quantity: 2.5 }] });
    await refused("menu quantity 51 is refused", "/api/menu/order", { customerName: "S", items: [{ id: "rest-item-1", quantity: 51 }] });
    await refused("unknown menu item is refused", "/api/menu/order", { customerName: "S", items: [{ id: "no-such-dish", price: 1, quantity: 1 }] });
    await refused("unavailable menu item is refused", "/api/menu/order", { customerName: "S", items: [{ id: String(offMenu._id), price: 1, quantity: 1 }] });
    await refused("menu line with no id is refused", "/api/menu/order", { customerName: "S", items: [{ price: 1, quantity: 1 }] });

    console.log("\n== Events and halls (POST /api/events/book)");
    const ev = { contactName: "S", contactPhone: "01011112222", eventType: "birthday", space: "indoor", eventDate: "2030-10-24", session: "evening", totalGuests: 30 };
    r = await post("/api/events/book", { ...ev, bookingMode: "package", basePrice: 1, depositRequired: 1, venueFee: -500, birthdayDetails: { packageId: "champion" }, selectedItems: [{ id: "item-dj-sound", price: 1, quantity: 2 }] });
    o = r.json.booking || {};
    check("birthday package sent at base price 1 is saved at 11500 + add-on 2 x 2500, VAT 14%, total 18810", r.status === 201 && o.basePrice === 11500 && o.itemsTotal === 5000 && o.vatAmount === 2310 && o.totalAmount === 18810 && o.venueFee === 0, `base=${o.basePrice} items=${o.itemsTotal} vat=${o.vatAmount} fee=${o.venueFee} total=${o.totalAmount}`);
    check("deposit is the package deposit + 30% of add-ons, not the client's", o.depositRequired === 5000, `deposit=${o.depositRequired}`);
    check("add-on price comes from the catalog", o.selectedItems && o.selectedItems[0].price === 2500, `price=${o.selectedItems && o.selectedItems[0].price}`);
    r = await post("/api/events/book", { ...ev, space: "grand_ballroom", eventType: "general_hall", bookingMode: "package", basePrice: 1, venueFee: 0, totalGuests: 250 });
    o = r.json.booking || {};
    check("hall fee is fixed on the server (grand ballroom 4500)", r.status === 201 && o.venueFee === 4500, `fee=${o.venueFee} base=${o.basePrice} total=${o.totalAmount}`);
    r = await post("/api/events/book", { ...ev, bookingMode: "per_guest", pricePerGuest: 1, basePrice: 1, totalGuests: 20 });
    o = r.json.booking || {};
    check("per-guest rate sent as 1 is saved at the real 350 x 20 = 7000", r.status === 201 && o.basePrice === 7000 && o.pricePerGuest === 350, `base=${o.basePrice} rate=${o.pricePerGuest}`);
    await refused("event add-on quantity -1 is refused", "/api/events/book", { ...ev, selectedItems: [{ id: "item-dj-sound", quantity: -1 }] });
    await refused("event add-on quantity 21 is refused", "/api/events/book", { ...ev, selectedItems: [{ id: "item-dj-sound", quantity: 21 }] });
    await refused("event add-on quantity 1.5 is refused", "/api/events/book", { ...ev, selectedItems: [{ id: "item-dj-sound", quantity: 1.5 }] });
    await refused("unknown add-on is refused", "/api/events/book", { ...ev, selectedItems: [{ id: "item-free-money", price: 0, quantity: 1 }] });
    await refused("negative guests is refused", "/api/events/book", { ...ev, totalGuests: -5 });
    await refused("zero guests is refused", "/api/events/book", { ...ev, totalGuests: 0 });
    await refused("guests above the maximum are refused", "/api/events/book", { ...ev, totalGuests: 5000 });
    await refused("unknown package id is refused", "/api/events/book", { ...ev, birthdayDetails: { packageId: "no-such-package" } });
    await refused("unknown event type is refused", "/api/events/book", { ...ev, eventType: "wedding-free" });

    console.log("\n== Trips (POST /api/trips/book)");
    const trip = { orgName: "School", contactName: "S", phone: "01011112222", tripDate: "2030-10-24", offerId: "full-dream" };
    r = await post("/api/trips/book", { ...trip, studentsCount: 20, pricePerStudent: 1, status: "confirmed" });
    o = r.json.trip || {};
    check("trip price per student sent as 1 is saved at the real 380 x 20 = 7600", r.status === 201 && o.pricePerStudent === 380 && o.totalPrice === 7600, `rate=${o.pricePerStudent} total=${o.totalPrice}`);
    check("client cannot open a trip as confirmed", o.status === "quote_generated", `status=${o.status}`);
    await refused("trip students -3 is refused", "/api/trips/book", { ...trip, studentsCount: -3, pricePerStudent: 1 });
    await refused("trip students 10 (< 15) is refused", "/api/trips/book", { ...trip, studentsCount: 10 });
    await refused("trip students 2.5 is refused", "/api/trips/book", { ...trip, studentsCount: 2.5 });
    await refused("trip students above the maximum are refused", "/api/trips/book", { ...trip, studentsCount: 100000 });
    await refused("unknown trip offer is refused", "/api/trips/book", { ...trip, offerId: "free-trip", studentsCount: 20, pricePerStudent: 0 });
    r = await post("/api/trips/calculate", { offerId: "full-dream", students: -4 });
    check("trip calculate refuses negative students", r.status === 400, `${r.status}`);

    console.log("\n== Table bookings (POST /api/booking-table)");
    console.log("      no price fields exist on this route (area, date, guests only): nothing to tamper with");

    await mongoose.disconnect();
    console.log(failed ? `\n${failed} FAILED` : "\nALL PASSED");
    process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e.message); process.exit(1); });
