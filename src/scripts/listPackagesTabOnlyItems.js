// READ-ONLY audit. Lists what could only be managed from the old "Packages & Tickets" admin tab:
//  - tickets whose page is none of Kids Area / Fun Park / Challenge / Adventure (no zone tab lists them)
//  - package documents that are not plain Packages-page packages (older zone passes, zone-page packages)
//  - every item currently flagged as featured on the Play Zone home
// Usage: DB_URL=mongodb://127.0.0.1:27017/<db> node src/scripts/listPackagesTabOnlyItems.js
// Writes nothing.
const mongoose = require("mongoose");
const ticketModel = require("../modules/tickets/model");
const packageModel = require("../modules/packges/model");

const ZONES = ["kids-area", "fun-park", "challenge", "adventure"];
const zoneOf = (page) => {
    const s = String(page || "").toLowerCase().replace(/[-_\s]/g, "");
    if (s.includes("kid")) return "kids-area";
    if (s.includes("fun")) return "fun-park";
    if (s.includes("chal")) return "challenge";
    if (s.includes("adv")) return "adventure";
    return "other";
};
const row = (kind, d) => ({
    kind,
    id: String(d._id),
    title: d.titleEn || d.titleAr || d.title,
    page: d.page || "",
    category: d.category || "",
    featuredZone: d.featuredZone || "",
    active: d.active !== false,
    homePopular: d.homePopular === true || d.homePopular === "true",
});

(async () => {
    if (!process.env.DB_URL) throw new Error("DB_URL is not set");
    await mongoose.connect(process.env.DB_URL);
    const [tickets, packages] = await Promise.all([ticketModel.find().lean(), packageModel.find().lean()]);
    const orphanTickets = tickets.filter((t) => !ZONES.includes(zoneOf(t.page))).map((t) => row("ticket", t));
    const zonePackages = packages
        .filter((p) => p.category !== "birthday" && p.page !== "birthday")
        .filter((p) => (p.page && !/pack/i.test(p.page)) || p.featuredZone)
        .map((p) => row("package", p));
    const flagged = [...tickets.map((t) => row("ticket", t)), ...packages.map((p) => row("package", p))].filter((r) => r.homePopular);
    console.log(`tickets: ${tickets.length}, packages: ${packages.length}`);
    console.log("\nTickets in no zone tab (only the old Packages & Tickets tab managed them):");
    console.table(orphanTickets);
    console.log("\nPackages that are zone items, not Packages-page packages:");
    console.table(zonePackages);
    console.log("\nFlagged as featured on the Play Zone home:");
    console.table(flagged);
    await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
