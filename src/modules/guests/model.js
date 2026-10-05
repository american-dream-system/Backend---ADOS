const mongoose = require("mongoose");
const { Schema } = mongoose;


const guestSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    age: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        enum: ["male", "female"],
        required: true
    },
    children: [
        {
            name: {
                type: String,
                required: true
            },
            age: {
                type: String,
                required: true
            },
            gender: {
                type: String,
                enum: ["male", "female"],
                required: true
            },
        }
    ],
}, { timestamps: true });

module.exports = mongoose.model("guest", guestSchema);