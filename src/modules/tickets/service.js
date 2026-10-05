const ticketModel = require("./model");

// create ticket
const createTicket = async (req, res) => {
    const ticket = await ticketModel.create(req.body);
    res.json({ message: "Ticket created successfully", ticket });
}

// get all tickets
const getAllTickets = async (req, res) => {
    const tickets = await ticketModel.find();
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