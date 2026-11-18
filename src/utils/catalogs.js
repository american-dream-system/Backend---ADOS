// Server-side catalogs for the order routes that do not have their own collection:
//  - restaurant menu (Media page "restaurant", sections "items" and "combos"; MenuItem documents by id)
//  - events (Media page "events": "packages", "add-items")
// The admin saves these sections from the dashboard; until a section is saved, the built-in defaults apply
// (the same ids and prices the website shows). The client never supplies a price.
const mongoose = require("mongoose");
const Media = require("../modules/media/model");
const MenuItem = require("../modules/menu/model");
const defaults = require("./defaultCatalogs");
const { currentPrice } = require("./orderPricing");

const extraOf = async (page, section) => {
    const doc = await Media.findOne({ page, section }).lean();
    return (doc && doc.extraData) || {};
};
// A saved array (even an empty one) wins; the fallback is used only when nothing was ever saved.
const savedOr = (saved, fallback) => (Array.isArray(saved) ? saved : fallback);
const listOr = (saved, fallback) => (Array.isArray(saved) && saved.length > 0 ? saved : fallback);

// One restaurant item (dish, combo or MenuItem document) by id: { id, titleEn, titleAr, price } or null.
const findRestaurantItem = async (rawId) => {
    const id = String(rawId || "").trim();
    if (!id) return null;
    const [items, combos] = await Promise.all([extraOf("restaurant", "items"), extraOf("restaurant", "combos")]);
    const dishDefaults = defaults.restaurant.items.filter((i) => !defaults.restaurant.combosIds.includes(i.id));
    const comboDefaults = defaults.restaurant.items.filter((i) => defaults.restaurant.combosIds.includes(i.id));
    // Once the admin has saved a section, the saved list is the only menu, even when it is empty (a deleted item must
    // never come back from the built-in defaults). The defaults apply only to a section that was never saved.
    const all = [...savedOr(items.items, dishDefaults), ...savedOr(combos.combos, comboDefaults)];
    const hit = all.find((i) => i && String(i.id) === id);
    if (hit) {
        const price = Number(hit.price);
        if (!Number.isFinite(price) || price < 0) return null;
        return { id, titleEn: hit.title || hit.nameEn || "", titleAr: hit.titleAr || hit.nameAr || "", price: currentPrice({ price }) };
    }
    if (mongoose.Types.ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id)) {
        const doc = await MenuItem.findById(id).lean();
        if (doc && doc.available !== false) {
            return { id, titleEn: doc.nameEn, titleAr: doc.nameAr, price: currentPrice(doc), menuItem: doc._id };
        }
    }
    return null;
};

// Events catalog: packages per occasion, add-on cards and the per-guest rate per occasion.
const getEventsCatalog = async () => {
    const [pk, add] = await Promise.all([extraOf("events", "packages"), extraOf("events", "add-items")]);
    const packagesByOccasion = { ...defaults.events.packagesByOccasion };
    if (pk.packagesByOccasion && typeof pk.packagesByOccasion === "object") {
        Object.entries(pk.packagesByOccasion).forEach(([k, list]) => {
            if (Array.isArray(list)) packagesByOccasion[k] = list;
        });
    }
    if (Array.isArray(pk.packages) && pk.packages.length > 0) packagesByOccasion.birthday = pk.packages;
    return {
        packagesByOccasion,
        addItems: listOr(add.addItems, defaults.events.addItems),
        pricePerGuestByOccasion: { ...defaults.events.pricePerGuestByOccasion, ...(add.pricePerGuestByOccasion || {}) },
    };
};

module.exports = { findRestaurantItem, getEventsCatalog };
