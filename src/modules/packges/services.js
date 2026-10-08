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

// @desc Get all packages (with optional pagination)
// @route GET /api/packages
// @access Public
const getAllPackages = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit);
        let query = packageModel.find();

        if (page && limit) {
            const skip = (page - 1) * limit;
            query = query.skip(skip).limit(limit);
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
    getPackageById,
    updatePackage,
    deletePackage,
    resizePackageImage
};
