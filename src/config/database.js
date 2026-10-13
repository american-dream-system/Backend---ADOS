const mongoose = require("mongoose");
const seedAdmin = require("../utils/seedAdmin");

const dbConnecting = () =>
    mongoose
        .connect(process.env.DB_URL)
        .then(() => {
            console.log("db connected Successfully✅");
            seedAdmin().catch((err) => console.error("Admin seed error on startup:", err));
        })
        .catch((err) => {
            console.error(`error on connection with db💥: ${err}`);
            process.exit(1); // close server
        });

module.exports = dbConnecting;
