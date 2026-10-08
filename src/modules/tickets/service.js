const ticketModel = require("./model");

// create ticket
const createTicket = async (req, res) => {
    const ticket = await ticketModel.create(req.body);
    if (!ticket) {
        return res.status(400).json({ message: "Failed to create ticket" });
    }
    res.status(201).json({ message: "Ticket created successfully", ticket });
}

// get all tickets
const getAllTickets = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    const tickets = await ticketModel.find().skip(skip).limit(limit);
    if (!tickets) {
        return res.status(404).json({ message: "No tickets found" });
    }
    res.status(200).json({ message: "Tickets fetched successfully", tickets });
}

// get ticket by id
const getTicketById = async (req, res) => {
    const ticket = await ticketModel.findById(req.params.id);
    res.status(200).json({ message: "Ticket fetched successfully", ticket });
}

// update ticket
const updateTicket = async (req, res) => {
    const ticket = await ticketModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ message: "Ticket updated successfully", ticket });
}

// delete ticket
const deleteTicket = async (req, res) => {
    const ticket = await ticketModel.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Ticket deleted successfully", ticket });
}

module.exports = { createTicket, getAllTickets, getTicketById, updateTicket, deleteTicket };