// @desc create guest
// @route POST /api/guests
// @access Private
const createGuest = (req, res) => {

    res.json({ message: "Guest created successfully" });
}

// @desc get all guests
// @route GET /api/guests
// @access Private
const getAllGuests = (req, res) => {
    res.json({ message: "Guests fetched successfully" });
}

// @desc get guest by id
// @route GET /api/guests/:id
// @access Private
const getGuestById = (req, res) => {
    res.json({ message: "Guest fetched successfully" });
}

// @desc update guest
// @route PUT /api/guests/:id
// @access Private
const updateGuest = (req, res) => {
    res.json({ message: "Guest updated successfully" });
}

// @desc delete guest
// @route DELETE /api/guests/:id
// @access Private
const deleteGuest = (req, res) => {
    res.json({ message: "Guest deleted successfully" });
}