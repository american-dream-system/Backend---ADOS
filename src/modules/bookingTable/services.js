const BookingTable = require("./model");
const Guest = require("../guests/model");

// Helper to generate unique booking code (TB-XXXXXX)
const generateBookingCode = async () => {
    let unique = false;
    let code = "";
    while (!unique) {
        const rand = Math.floor(100000 + Math.random() * 900000);
        code = `TB-${rand}`;
        const existing = await BookingTable.findOne({ bookingCode: code });
        if (!existing) {
            unique = true;
        }
    }
    return code;
};

// @desc Create a new table reservation
// @route POST /api/booking-table
// @access Public / Private
const createBookingTable = async (req, res, next) => {
    try {
        const {
            guest: guestId,
            guestName,
            guestPhone,
            phone,
            name,
            area,
            date,
            time,
            numberOfPerson,
            notes = "",
            status = "pending"
        } = req.body;

        // Validation for table details
        if (!area) {
            return res.status(400).json({
                success: false,
                message: "Please choose an area (Family 1, Family 2, Family 3, Roof, Indoor, Relaxation Area)"
            });
        }

        if (!date) {
            return res.status(400).json({
                success: false,
                message: "Dining date is required"
            });
        }

        if (!time) {
            return res.status(400).json({
                success: false,
                message: "Dining time slot is required (e.g. 1:00 PM, 3:30 PM, 6:00 PM, 7:30 PM, 9:00 PM, 10:30 PM)"
            });
        }

        if (!numberOfPerson || numberOfPerson < 1) {
            return res.status(400).json({
                success: false,
                message: "Number of persons / seats is required and must be at least 1"
            });
        }

        // Resolve Guest record
        let resolvedGuest = null;
        const targetPhone = guestPhone || phone;
        const targetName = guestName || name || "Valued Guest";

        if (guestId) {
            resolvedGuest = await Guest.findById(guestId);
            if (!resolvedGuest) {
                return res.status(404).json({
                    success: false,
                    message: `Guest with ID '${guestId}' not found`
                });
            }
        } else if (targetPhone) {
            // Check if guest exists with phone
            resolvedGuest = await Guest.findOne({ phone: targetPhone });
            if (!resolvedGuest) {
                // Auto-create guest record for frictionless booking
                resolvedGuest = await Guest.create({
                    name: targetName,
                    phone: targetPhone,
                    age: "Adult",
                    gender: "male",
                    children: []
                });
            }
        } else {
            return res.status(400).json({
                success: false,
                message: "Please provide guest ID or guest phone number"
            });
        }

        // Generate unique booking code
        const bookingCode = await generateBookingCode();

        // Create booking
        const newBooking = await BookingTable.create({
            bookingCode,
            guest: resolvedGuest._id,
            guestName: resolvedGuest.name || targetName,
            guestPhone: resolvedGuest.phone || targetPhone,
            area,
            date: new Date(date),
            time,
            numberOfPerson: parseInt(numberOfPerson),
            notes,
            status
        });

        const populated = await BookingTable.findById(newBooking._id).populate("guest");

        res.status(201).json({
            success: true,
            message: "Table booked successfully",
            data: populated,
            booking: populated
        });
    } catch (error) {
        next(error);
    }
};

// @desc Get all table bookings (with pagination & filters)
// @route GET /api/booking-table
// @access Staff / Admin
const getAllBookingTables = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit);

        const filter = {};
        if (req.query.area) filter.area = req.query.area;
        if (req.query.status) filter.status = req.query.status;
        if (req.query.time) filter.time = req.query.time;
        if (req.query.guest) filter.guest = req.query.guest;
        if (req.query.bookingCode) filter.bookingCode = req.query.bookingCode;

        // Date range filter
        if (req.query.date) {
            const queryDate = new Date(req.query.date);
            const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
            const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));
            filter.date = { $gte: startOfDay, $lte: endOfDay };
        }

        let query = BookingTable.find(filter).populate("guest").sort({ date: 1, time: 1 });

        if (page && limit) {
            const skip = (page - 1) * limit;
            query = query.skip(skip).limit(limit);
        }

        const bookings = await query;
        const totalCount = await BookingTable.countDocuments(filter);

        res.status(200).json({
            success: true,
            count: bookings.length,
            total: totalCount,
            data: bookings,
            bookings
        });
    } catch (error) {
        next(error);
    }
};

// @desc Get table booking by ID
// @route GET /api/booking-table/:id
// @access Public / Staff
const getBookingTableById = async (req, res, next) => {
    try {
        const booking = await BookingTable.findById(req.params.id).populate("guest");
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Table reservation not found"
            });
        }

        res.status(200).json({
            success: true,
            data: booking,
            booking
        });
    } catch (error) {
        next(error);
    }
};

// @desc Get table booking by unique reservation code
// @route GET /api/booking-table/code/:code
// @access Public / Staff
const getBookingTableByCode = async (req, res, next) => {
    try {
        const booking = await BookingTable.findOne({ bookingCode: req.params.code }).populate("guest");
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Table reservation not found for this code"
            });
        }

        res.status(200).json({
            success: true,
            data: booking,
        });
    } catch (error) {
        next(error);
    }
};

// @desc Get all table bookings for a specific guest
// @route GET /api/booking-table/guest/:guestId
// @access Public / Staff
const getBookingsByGuest = async (req, res, next) => {
    try {
        const bookings = await BookingTable.find({ guest: req.params.guestId })
            .populate("guest")
            .sort({ date: -1 });

        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings,
        });
    } catch (error) {
        next(error);
    }
};

// @desc Update table booking details
// @route PUT /api/booking-table/:id
// @access Public / Staff
const updateBookingTable = async (req, res, next) => {
    try {
        const { area, date, time, numberOfPerson, notes } = req.body;

        const updates = {};
        if (area) updates.area = area;
        if (date) updates.date = new Date(date);
        if (time) updates.time = time;
        if (numberOfPerson) updates.numberOfPerson = parseInt(numberOfPerson);
        if (notes !== undefined) updates.notes = notes;

        const updated = await BookingTable.findByIdAndUpdate(req.params.id, updates, {
            new: true,
            runValidators: true
        }).populate("guest");

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: "Table reservation not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Table reservation updated successfully",
            data: updated,
        });
    } catch (error) {
        next(error);
    }
};

// @desc Update booking status (pending, confirmed, cancelled)
// @route PATCH /api/booking-table/:id/status
// @access Staff / Admin
const updateBookingStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!["pending", "confirmed", "cancelled"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be 'pending', 'confirmed', or 'cancelled'"
            });
        }

        const updated = await BookingTable.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        ).populate("guest");

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: "Table reservation not found"
            });
        }

        res.status(200).json({
            success: true,
            message: `Table reservation status updated to '${status}'`,
            data: updated,
        });
    } catch (error) {
        next(error);
    }
};

// @desc Cancel / Delete table booking
// @route DELETE /api/booking-table/:id
// @access Public / Staff
const deleteBookingTable = async (req, res, next) => {
    try {
        const deleted = await BookingTable.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Table reservation not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Table reservation deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

// @desc Check booked tables availability for a date/time/area
// @route GET /api/booking-table/availability
// @access Public / Staff
const checkAvailability = async (req, res, next) => {
    try {
        const { date, time, area } = req.query;
        if (!date) {
            return res.status(400).json({
                success: false,
                message: "Date query parameter is required (e.g. 2026-10-24)"
            });
        }

        const queryDate = new Date(date);
        const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));

        const filter = {
            date: { $gte: startOfDay, $lte: endOfDay },
            status: { $ne: "cancelled" }
        };

        if (time) filter.time = time;
        if (area) filter.area = area;

        const bookedTables = await BookingTable.find(filter);
        const totalGuestsBooked = bookedTables.reduce((sum, b) => sum + b.numberOfPerson, 0);

        res.status(200).json({
            success: true,
            date,
            time: time || "All Slots",
            area: area || "All Areas",
            bookedCount: bookedTables.length,
            totalGuestsBooked,
            data: bookedTables
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createBookingTable,
    getAllBookingTables,
    getBookingTableById,
    getBookingTableByCode,
    getBookingsByGuest,
    updateBookingTable,
    updateBookingStatus,
    deleteBookingTable,
    checkAvailability
};
