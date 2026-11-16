// Server-side pricing rules shared by every order route. The client may send what it likes:
// prices, totals, discounts, fees and VAT are always recomputed here from the database.

class OrderError extends Error {
    constructor(message, status = 400) {
        super(message);
        this.name = "OrderError";
        this.status = status;
    }
}

const MAX_LINE_QTY = 50; // per line of a shop / menu order
const MAX_ADDON_QTY = 20; // per add-on of an event booking
const MAX_GUESTS = 1000; // event guests
const MAX_STUDENTS = 2000; // trip students

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

// A positive whole number within [1, max]. Numeric strings are accepted ("3"), anything else is refused:
// zero, negatives, fractions, NaN, arrays, objects, "1e3", "2abc".
const wholeQty = (value, { max = MAX_LINE_QTY, label = "الكمية", fallback } = {}) => {
    const v = value === undefined || value === null || value === "" ? fallback : value;
    const n = typeof v === "string" && /^\d+$/.test(v.trim()) ? Number(v.trim()) : v;
    if (typeof n !== "number" || !Number.isInteger(n) || n < 1 || n > max) {
        throw new OrderError(`${label} يجب أن تكون رقماً صحيحاً موجباً (من 1 إلى ${max})`, 400);
    }
    return n;
};

// Current price of a ticket / package / menu item document: the discounted price when one is set
// and lower than the base price, else the base price. Never negative, never NaN.
const currentPrice = (doc) => {
    const base = Number(doc && doc.price);
    const disc = Number(doc && doc.priceAfterDiscount);
    const price = Number.isFinite(disc) && disc > 0 && (!Number.isFinite(base) || disc <= base) ? disc : base;
    if (!Number.isFinite(price) || price < 0) {
        throw new OrderError("سعر هذا العنصر غير متاح حالياً", 409);
    }
    return round2(price);
};

// Sends an OrderError as its own status; returns false for any other error (caller passes it on).
const sendOrderError = (res, err) => {
    if (err instanceof OrderError) {
        res.status(err.status).json({ success: false, message: err.message });
        return true;
    }
    return false;
};

module.exports = { OrderError, MAX_LINE_QTY, MAX_ADDON_QTY, MAX_GUESTS, MAX_STUDENTS, round2, wholeQty, currentPrice, sendOrderError };
