// "Current price" rule for tickets and packages: an empty, zero or higher-than-price `priceAfterDiscount` means NO
// discount, so the current price is the price. The current price is what is shown and charged; the old price and the
// SAVE badge only exist when the current price is lower than `price`.

const num = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : NaN;
};

// The price a customer pays for a document with `price` and `priceAfterDiscount`
const currentPriceOf = (doc) => {
    const price = num(doc && doc.price);
    const disc = num(doc && doc.priceAfterDiscount);
    return disc > 0 && (Number.isNaN(price) || disc <= price) ? disc : price;
};

// Sets priceAfterDiscount to the current price on a plain object (no-op when there is no price)
const normalizeCurrentPrice = (obj) => {
    if (obj && obj.price !== undefined && obj.price !== null && !Number.isNaN(num(obj.price))) {
        obj.priceAfterDiscount = currentPriceOf(obj);
    }
    return obj;
};

// Schema plugin: stores the current price on save / update and returns it in JSON, even for records that
// were saved with priceAfterDiscount 0 before (stored data is left as it is; only the output is corrected).
const applyCurrentPrice = (schema) => {
    // plain functions: this Mongoose version does not pass the next callback to hooks

    schema.pre("validate", function () {
        normalizeCurrentPrice(this);
    });

    schema.pre("findOneAndUpdate", function () {
        const update = this.getUpdate() || {};
        // the fields are top-level, or under $set (timestamps add a $set of their own)
        const set = (update.price !== undefined || update.priceAfterDiscount !== undefined) ? update : (update.$set || update);
        if (set.price !== undefined && set.price !== null) {
            set.priceAfterDiscount = currentPriceOf({ price: set.price, priceAfterDiscount: set.priceAfterDiscount });
        } else if (set.priceAfterDiscount !== undefined && !(Number(set.priceAfterDiscount) > 0)) {
            // no discount given and no new price: keep the stored price as the current price
            delete set.priceAfterDiscount;
            this.__resetDiscount = true;
        }
    });

    schema.post("findOneAndUpdate", async function (doc) {
        if (doc && this.__resetDiscount && Number(doc.priceAfterDiscount) !== currentPriceOf(doc)) {
            doc.priceAfterDiscount = currentPriceOf(doc);
            await doc.save();
        }
    });

    const wrap = (key) => {
        const opts = schema.get(key) || {};
        const prev = opts.transform;
        schema.set(key, {
            ...opts,
            transform: (doc, ret, o) => {
                const out = prev ? prev(doc, ret, o) || ret : ret;
                return normalizeCurrentPrice(out);
            },
        });
    };
    wrap("toJSON");
    wrap("toObject");
};

module.exports = { currentPriceOf, normalizeCurrentPrice, applyCurrentPrice };