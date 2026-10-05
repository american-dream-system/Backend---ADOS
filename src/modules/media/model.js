const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema(
    {
        images: [String],
        name: String,
        section: String,
        page: String,
    },
    { timestamps: true }
);

module.exports = mongoose.model("Media", mediaSchema);