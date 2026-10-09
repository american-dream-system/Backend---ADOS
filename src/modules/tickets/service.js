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
    try {
        const filter = {};

        // 1. Zone / Page filtering
        const zoneParam = req.query.zone || req.query.targetPage;
        if (zoneParam) {
            filter.page = zoneParam;
        } else if (req.query.page && isNaN(req.query.page)) {
            filter.page = req.query.page;
        }

        // 2. Timing filtering (e.g. midweek, weekend)
        if (req.query.timing) {
            filter.timing = req.query.timing;
        }

        // 3. Pagination
        const pageNum = (!isNaN(req.query.page) && parseInt(req.query.page) > 0) ? parseInt(req.query.page) : 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (pageNum - 1) * limit;

        const total = await ticketModel.countDocuments(filter);
        const tickets = await ticketModel.find(filter).skip(skip).limit(limit);

        res.status(200).json({
            message: "Tickets fetched successfully",
            results: tickets.length,
            total,
            page: pageNum,
            tickets
        });
    } catch (error) {
        res.status(500).json({ message: error.message || "Failed to fetch tickets" });
    }
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