const mongoose = require("mongoose");

// The accounts customers transfer to (InstaPay and Vodafone Cash), one document edited from the admin
// "Payment Accounts" page. Every field is optional and there are no built-in values and no environment fallback:
// an empty string means "not set", and the site hides a method whose account is not set.
const paymentAccountsSchema = new mongoose.Schema(
    {
        key: { type: String, default: "payment-accounts", unique: true },
        instapayAddress: { type: String, default: "" },
        instapayName: { type: String, default: "" },
        vodafoneNumber: { type: String, default: "" },
        vodafoneName: { type: String, default: "" },
    },
    { timestamps: true }
);

module.exports = mongoose.model("PaymentAccounts", paymentAccountsSchema);
