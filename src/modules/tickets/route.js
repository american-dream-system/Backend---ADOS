const express = require("express");
const router = express.Router();
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

router.post("/", createTicketValidator, createTicket);
router.get("/", getAllTickets);
router.get("/:id", getTicketValidator, getTicketById);
router.patch("/:id", updateTicketValidator, updateTicket);
router.put("/:id", updateTicketValidator, updateTicket);
router.delete("/:id", deleteTicketValidator, deleteTicket);

module.exports = router;
