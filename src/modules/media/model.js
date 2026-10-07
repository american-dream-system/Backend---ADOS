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

// return image url 
mediaSchema.post("init", (doc) => {
    if (doc.images) {
        doc.images = doc.images.map((image) => `http://localhost:9500/media/${image}`);
    }
});

// modify find query 
mediaSchema.post(/^find/, (doc) => {
    if (doc.images) {
        doc.images = doc.images.map((image) => `http://localhost:9500/media/${image}`);
    }
});

module.exports = mongoose.model("Media", mediaSchema);