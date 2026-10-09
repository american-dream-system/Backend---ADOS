const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const packageModel = require("./model");

// @desc Middleware to resize and save uploaded package image
const resizePackageImage = async (req, res, next) => {
    try {
        if (req.file) {
            const uploadDir = path.join("upload", "packages");
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const fileName = `package-${Date.now()}.jpeg`;
            await sharp(req.file.buffer)
                .resize(1024, 1024, {
                    fit: "inside",
                    withoutEnlargement: true,
                })
                .toFormat("jpeg")
                .jpeg({ quality: 90 })
                .toFile(path.join(uploadDir, fileName));

            req.body.image = fileName;
        }
        next();
    } catch (error) {
        next(error);
    }
};

// @desc Create a new package
// @route POST /api/packages
// @access Private
const createPackage = async (req, res, next) => {
    try {
        const newPackage = await packageModel.create(req.body);
        if (!newPackage) {
            return res.status(400).json({ success: false, message: "Failed to create package" });
        }
        res.status(201).json({
            success: true,
            message: "Package created successfully",
            data: newPackage,
            package: newPackage
        });
    } catch (error) {
        next(error);
    }
};

// @desc Get all packages (with optional zone/category filtering & pagination)
// @route GET /api/packages
// @access Public
const getAllPackages = async (req, res, next) => {
    try {
        const filter = {};

        // Zone / Target Page filtering
        const zoneParam = req.query.zone || req.query.targetPage;
        if (zoneParam) {
            filter.$or = [
                { page: zoneParam },
                { page: new RegExp(zoneParam, 'i') },
                { title: new RegExp(zoneParam, 'i') },
                { titleAr: new RegExp(zoneParam, 'i') }
            ];
        } else if (req.query.page && isNaN(req.query.page)) {
            filter.$or = [
                { page: req.query.page },
                { page: new RegExp(req.query.page, 'i') }
            ];
        }

        // Timing / Category filtering
        if (req.query.category) {
            filter.category = req.query.category;
        }

        // Type filtering (e.g. pass vs birthday)
        if (req.query.type === 'birthday') {
            filter.$or = [
                { page: 'birthday' },
                { category: 'birthday' },
                { title: { $regex: 'ميلاد|Birthday|احتفال|Party', $options: 'i' } }
            ];
        } else if (req.query.type === 'pass') {
            filter.page = { $ne: 'birthday' };
        }

        let query = packageModel.find(filter);

        // Numeric pagination
        const isNumericPage = req.query.page && !isNaN(req.query.page);
        if (isNumericPage && req.query.limit) {
            const pageNum = parseInt(req.query.page);
            const limitNum = parseInt(req.query.limit);
            const skip = (pageNum - 1) * limitNum;
            query = query.skip(skip).limit(limitNum);
        }

        const packages = await query;
        res.status(200).json({
            success: true,
            count: packages.length,
            data: packages,
            packages
        });
    } catch (error) {
        next(error);
    }
};

// @desc Get birthday packages
// @route GET /api/packages/birthdays
// @access Public
const getBirthdayPackages = async (req, res, next) => {
    try {
        const birthdays = await packageModel.find({
            $or: [
                { page: "birthday" },
                { category: "birthday" },
                { title: { $regex: "ميلاد|Birthday|احتفال|Party", $options: "i" } },
                { titleAr: { $regex: "ميلاد|Birthday|احتفال|Party", $options: "i" } }
            ]
        });
        res.status(200).json({
            success: true,
            count: birthdays.length,
            birthdays,
            data: birthdays
        });
    } catch (error) {
        next(error);
    }
};

// @desc Get package by ID
// @route GET /api/packages/:id
// @access Public
const getPackageById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const pkg = await packageModel.findById(id);
        if (!pkg) {
            return res.status(404).json({ success: false, message: "Package not found" });
        }
        res.status(200).json({
            success: true,
            message: "Package fetched successfully",
            data: pkg,
            package: pkg
        });
    } catch (error) {
        next(error);
    }
};

// @desc Update package
// @route PUT /api/packages/:id
// @access Private
const updatePackage = async (req, res, next) => {
    try {
        const { id } = req.params;
        const pkg = await packageModel.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true
        });
        if (!pkg) {
            return res.status(404).json({ success: false, message: "Package not found" });
        }
        res.status(200).json({
            success: true,
            message: "Package updated successfully",
            data: pkg,
            package: pkg
        });
    } catch (error) {
        next(error);
    }
};

// @desc Delete package
// @route DELETE /api/packages/:id
// @access Private
const deletePackage = async (req, res, next) => {
    try {
        const { id } = req.params;
        const pkg = await packageModel.findByIdAndDelete(id);
        if (!pkg) {
            return res.status(404).json({ success: false, message: "Package not found" });
        }
        res.status(200).json({
            success: true,
            message: "Package deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createPackage,
    getAllPackages,
    getBirthdayPackages,
    getPackageById,
    updatePackage,
    deletePackage,
    resizePackageImage
};
