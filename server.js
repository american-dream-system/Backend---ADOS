const express = require("express");
const http = require("http");
const dotenv = require("dotenv");
dotenv.config();
try {
    require("./src/utils/token").assertJwtSecrets();
} catch (err) {
    console.error(`❌ Refusing to start: ${err.message}`);
    process.exit(1);
}
const PORT = process.env.PORT || 5000;
const { initSocket } = require("./src/config/socket");
const dbConnecting = require("./src/config/database");
const swaggerSpec = require("./src/config/swagger");
const mediaRoutes = require("./src/modules/media/routes");
const ticketsRoutes = require("./src/modules/tickets/route");
const guestsRoutes = require("./src/modules/guests/route");
const authRoutes = require("./src/modules/auth/routes");
const packageRoutes = require("./src/modules/packges/routes");
const buyingRoutes = require("./src/modules/buying/routes");
const bookingTableRoutes = require("./src/modules/bookingTable/routes");
const menuRoutes = require("./src/modules/menu/routes");
const chatbotRoutes = require("./src/modules/chatbot/routes");
const tripsRoutes = require("./src/modules/trips/routes");
const eventsRoutes = require("./src/modules/events/routes");
const loyaltyRoutes = require("./src/modules/loyalty/routes");
const notificationsRoutes = require("./src/modules/notifications/routes");
const playzoneHomeRoutes = require("./src/modules/playzoneHome/routes");
const morgan = require("morgan");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const ApiError = require("./src/utils/ApiError");
const GlobalError = require("./src/middlewares/error");
const ngrok = require("@ngrok/ngrok");
const cors = require("cors");
const compression = require("compression");
const { publicCache, flushOnWrite } = require("./src/middlewares/responseCache");

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Middlewares
app.use(compression()); // gzip/deflate for JSON and text responses
app.use(morgan("dev")); //logging
// Uploaded media names contain a timestamp + random id, so a file never changes: cache hard.
app.use("/media", express.static(path.join(__dirname, "upload/media"), { maxAge: "30d", immutable: true, etag: true }));
// A reference to a file that is not on disk gets a neutral placeholder instead of a broken image.
// Not cached, so the real file shows up as soon as it exists.
const MISSING_IMAGE_SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">' +
    '<rect width="800" height="600" fill="#e5e7eb"/>' +
    '<path d="M250 400l100-120 80 90 60-70 60 100z" fill="#9ca3af"/><circle cx="330" cy="230" r="34" fill="#9ca3af"/>' +
    '</svg>';
app.use("/media", (req, res, next) => {
    if (!/\.(jpe?g|png|webp|gif|avif|svg)$/i.test(req.path)) return next();
    res.set({ "Content-Type": "image/svg+xml", "Cache-Control": "no-store", "X-Media-Missing": "1" });
    return res.status(200).send(MISSING_IMAGE_SVG);
});
// Only these upload sub-folders are public. upload/payments (receipts) and anything else
// (backups, ...) is never served statically; receipts go through GET /api/buying/payment-proof/:file.
["packages", "menu"].forEach((dir) => app.use(`/${dir}`, express.static(path.join(__dirname, "upload", dir))));
app.use(["/payments", "/upload/payments"], (req, res) => res.status(404).json({ success: false, message: "Not found" }));
app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
); //swagger docs

// cors
app.use(cors({
    origin: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true
}));

// Short cache for public GETs; any write flushes it so admin edits show immediately
app.use(flushOnWrite);
app.use(
    [
        "/api/media", "/api/packages", "/api/packges", "/api/tickets",
        "/api/menu", "/api/products", "/api/playzone-home", "/api/loyalty", "/api/points",
        "/api/trips/offers", "/api/trips/packages", "/api/events/spaces", "/api/events/packages",
        "/api/buying/payment-accounts", "/api/orders/payment-accounts",
    ],
    publicCache()
);

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/guests", guestsRoutes);
app.use("/api/tickets", ticketsRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/packges", packageRoutes);
app.use("/api/buying", buyingRoutes);
app.use("/api/orders", buyingRoutes);
app.use("/api/booking-table", bookingTableRoutes);
app.use("/api/bookingTable", bookingTableRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/products", menuRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/chat", chatbotRoutes);
app.use("/api/trips", tripsRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/loyalty", loyaltyRoutes);
app.use("/api/points", loyaltyRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/playzone-home", playzoneHomeRoutes);

// Not found route
app.use((req, res, next) => {
    const message = new Error(`cant find this : ${req.originalUrl}`);
    next(new ApiError(message, 404));
});

// Global Error Handling in Express
app.use(GlobalError);

// Connect to DB
dbConnecting();

// Start server with Socket.io
const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
    console.log(`Server is running with WebSockets on port ${PORT}`);
});

// Global Error Handling Outside Express
process.on("unhandledRejection", (err) => {
    console.log(`RejectionHandled Error: ${err.name} | ${err.message}`);
    server.close(() => {
        console.log("shutting down.....");
        process.exit(1);
    });
});


// Get your endpoint online in dev mode
if (process.env.NODE_ENV === "development") {
    ngrok
        .connect({ addr: process.env.PORT, authtoken_from_env: true })
        .then((listener) =>
            console.log(`Ingress established at: ${listener.url()}`),
        )
        .catch((err) => {
            console.log(`Ngrok notice: ${err.message}`);
        });
}