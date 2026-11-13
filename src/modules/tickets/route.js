const express = require("express");
const router = express.Router();
const { adminOnly } = require("../../middlewares/authMiddleware");
const {
    createTicket,
    getAllTickets,
    getTicketById,
    updateTicket,
    deleteTicket
} = require("./service");
const {
    createTicketValidator,
    getTicketValidator,
    updateTicketValidator,
    deleteTicketValidator
} = require("./validator");

router.post("/", adminOnly, createTicketValidator, createTicket);
router.get("/", getAllTickets);
router.get("/:id", getTicketValidator, getTicketById);
router.patch("/:id", adminOnly, updateTicketValidator, updateTicket);
router.put("/:id", adminOnly, updateTicketValidator, updateTicket);
router.delete("/:id", adminOnly, deleteTicketValidator, deleteTicket);

module.exports = router;
