const guestModel = require("./model");
const { createDocument, getAllDocuments, getDocumentById, updateDocument, deleteDocument } = require("../common/servcies");

// @desc create guest
// @route POST /api/guests
// @access Private
const createGuest = (model) => {
    createDocument(model);
}

// @desc get all guests
// @route GET /api/guests
// @access Private
const getAllGuests = (model) => {
    getAllDocuments(model);
}

// @desc get guest by id
// @route GET /api/guests/:id
// @access Private
const getGuestById = (model) => {
    getDocumentById(model);
}

// @desc update guest
// @route PUT /api/guests/:id
// @access Private
const updateGuest = (model) => {
    updateDocument(model);
}

// @desc delete guest
// @route DELETE /api/guests/:id
// @access Private
const deleteGuest = (model) => {
    deleteDocument(model);
}

module.exports = { createGuest, getAllGuests, getGuestById, updateGuest, deleteGuest }; 