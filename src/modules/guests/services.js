const guestModel = require("./model");

// ==========================================
// GUEST MANAGEMENT CRUD SERVICES
// ==========================================

// @desc create guest
// @route POST /api/guests
// @access Private
const createGuest = async (req, res, next) => {
    try {
        const guest = await guestModel.create(req.body);
        if (!guest) {
            return res.status(400).json({ success: false, message: "فشل إنشاء الضيف" });
        }
        res.status(201).json({ success: true, message: "تم إنشاء الضيف بنجاح", data: guest });
    } catch (error) {
        next(error);
    }
};

// @desc get all guests
// @route GET /api/guests
// @access Private
const getAllGuests = async (req, res, next) => {
    try {
        const guests = await guestModel.find();
        res.status(200).json({ success: true, count: guests.length, data: guests });
    } catch (error) {
        next(error);
    }
};

// @desc get guest by id
// @route GET /api/guests/:id
// @access Private
const getGuestById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const guest = await guestModel.findById(id);
        if (!guest) {
            return res.status(404).json({ success: false, message: "الضيف غير موجود" });
        }
        res.status(200).json({ success: true, data: guest });
    } catch (error) {
        next(error);
    }
};

// @desc update guest
// @route PUT /api/guests/:id
// @access Private
const updateGuest = async (req, res, next) => {
    try {
        const { id } = req.params;
        const guest = await guestModel.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        if (!guest) {
            return res.status(404).json({ success: false, message: "الضيف غير موجود للتعديل" });
        }
        res.status(200).json({ success: true, message: "تم تحديث بيانات الضيف بنجاح", data: guest });
    } catch (error) {
        next(error);
    }
};

// @desc delete guest
// @route DELETE /api/guests/:id
// @access Private
const deleteGuest = async (req, res, next) => {
    try {
        const { id } = req.params;
        const guest = await guestModel.findByIdAndDelete(id);
        if (!guest) {
            return res.status(404).json({ success: false, message: "الضيف غير موجود للحذف" });
        }
        res.status(200).json({ success: true, message: "تم حذف الضيف بنجاح" });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createGuest,
    getAllGuests,
    getGuestById,
    updateGuest,
    deleteGuest
};