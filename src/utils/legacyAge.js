// The old schema default for an age. It is not a real age, so it reads as empty.
// Stored records are left untouched; only the output is cleaned.
const LEGACY_DEFAULT_AGES = ["all ages", "جميع الأعمار"];
const AGE_FIELDS = ["age", "ageAr", "ageEn"];

const blankLegacyAge = (obj) => {
    if (!obj) return obj;
    for (const key of AGE_FIELDS) {
        if (typeof obj[key] === "string" && LEGACY_DEFAULT_AGES.includes(obj[key].trim().toLowerCase())) obj[key] = "";
    }
    return obj;
};

// Run on a query result (document, lean object, or list) and return it
const blankLegacyAgeIn = (data) => (Array.isArray(data) ? data.map(blankLegacyAge) : blankLegacyAge(data));

// Make a model's JSON output blank the legacy age and expose the helper on the model
const applyLegacyAge = (schema) => {
    schema.set("toJSON", { transform: (doc, ret) => blankLegacyAge(ret) });
    schema.set("toObject", { transform: (doc, ret) => blankLegacyAge(ret) });
};

module.exports = { blankLegacyAge, blankLegacyAgeIn, applyLegacyAge };
