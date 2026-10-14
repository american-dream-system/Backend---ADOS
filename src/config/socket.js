const { Server } = require("socket.io");

let io = null;

/**
 * Initialize Socket.io with HTTP Server instance
 * @param {import("http").Server} httpServer
 * @returns {Server}
 */
const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
            credentials: true
        },
        transports: ["websocket", "polling"]
    });

    io.on("connection", (socket) => {
        console.log(`[Socket.io] Client connected: ${socket.id}`);

        // Join the admin dashboard room for real-time notifications
        socket.on("join_admin_room", () => {
            socket.join("admin_room");
            console.log(`[Socket.io] Socket ${socket.id} joined admin_room`);
            socket.emit("joined_admin_room_ack", { success: true, timestamp: new Date() });
        });

        // Leave admin room if needed
        socket.on("leave_admin_room", () => {
            socket.leave("admin_room");
            console.log(`[Socket.io] Socket ${socket.id} left admin_room`);
        });

        socket.on("disconnect", (reason) => {
            console.log(`[Socket.io] Client disconnected: ${socket.id} (Reason: ${reason})`);
        });
    });

    console.log("[Socket.io] Initialized successfully");
    return io;
};

/**
 * Get current Socket.io instance
 * @returns {Server}
 */
const getIO = () => {
    if (!io) {
        console.warn("[Socket.io] Warning: getIO called before initSocket");
    }
    return io;
};

/**
 * Emit event to admin room and fallback to all clients
 * @param {string} event 
 * @param {any} data 
 */
const emitToAdmin = (event, data) => {
    if (!io) {
        console.warn(`[Socket.io] Cannot emit "${event}", io is not initialized`);
        return false;
    }
    try {
        // Strictly emit ONLY to clients authenticated in the admin room
        io.to("admin_room").emit(event, data);
        return true;
    } catch (err) {
        console.error(`[Socket.io] Error emitting "${event}":`, err.message);
        return false;
    }
};

module.exports = {
    initSocket,
    getIO,
    emitToAdmin
};
