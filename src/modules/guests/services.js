const guestModel = require("./model");

// @desc create guest
// @route POST /api/guests
// @access Private
const createGuest = async (req, res) => {
    const guest = await guestModel.create(req.body);
    if (!guest) {
        return res.status(400).json({ success: false, message: "Failed to create guest" });
    }
    res.status(201).json({ success: true, data: guest });
}

// @desc get all guests
// @route GET /api/guests
// @access Private
const getAllGuests = async (req, res) => {
    const guests = await guestModel.find();
    res.status(200).json({ success: true, data: guests });
}

// @desc get guest by id
// @route GET /api/guests/:id
// @access Private
const getGuestById = async (req, res) => {
    const { id } = req.params;
    const guest = await guestModel.findById(id);
    if (!guest) {
        return res.status(404).json({ success: false, message: "Guest not found" });
    }
    res.status(200).json({ success: true, data: guest });
}

// @desc update guest
// @route PUT /api/guests/:id
// @access Private
const updateGuest = async (req, res) => {
    const { id } = req.params;
    const guest = await guestModel.findByIdAndUpdate(id, req.body, { new: true });
    if (!guest) {
        return res.status(404).json({ success: false, message: "Guest not found" });
    }
    res.status(200).json({ success: true, data: guest });
}

// @desc delete guest
// @route DELETE /api/guests/:id
// @access Private
const deleteGuest = async (req, res) => {
    const { id } = req.params;
    const guest = await guestModel.findByIdAndDelete(id);
    if (!guest) {
        return res.status(404).json({ success: false, message: "Guest not found" });
    }
    res.status(200).json({ success: true, message: "Guest deleted successfully" });
}

module.exports = { createGuest, getAllGuests, getGuestById, updateGuest, deleteGuest }; 