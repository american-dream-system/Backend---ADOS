const Media = require("./model");

// @desc uploadImage 
// @routes POST /api/media
// @access Private
const upload = async (req, res) => {
    try {
        const { 
            page, 
            section, 
            name, 
            title, 
            titleAr, 
            subtitle, 
            subtitleAr, 
            description, 
            descriptionAr, 
            images, 
            items, 
            extraData, 
            isActive 
        } = req.body;

        if (!page || !section) {
            return res.status(400).json({ success: false, message: "Page and section are required" });
        }

        const media = await Media.create({ 
            page, 
            section, 
            name: name || `${page}-${section}`, 
            title: title || "", 
            titleAr: titleAr || "", 
            subtitle: subtitle || "", 
            subtitleAr: subtitleAr || "", 
            description: description || "", 
            descriptionAr: descriptionAr || "", 
            images: images || [], 
            items: items || [], 
            extraData: extraData || {}, 
            isActive: isActive !== undefined ? isActive : true 
        });

        res.status(201).json({ success: true, data: media });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc getAllMedia
// @routes GET /api/media
// @access Public
const getAllMedia = async (req, res) => {
    try {
        const filter = {};
        if (req.query.page) filter.page = req.query.page;
        if (req.query.section) filter.section = req.query.section;
        if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === "true";

        const media = await Media.find(filter).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: media.length, data: media });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc getMediaById
// @routes GET /api/media/:id
// @access Public
const getMediaById = async (req, res) => {
    try {
        const { id } = req.params;
        const media = await Media.findById(id);
        if (!media) {
            return res.status(404).json({ success: false, message: "Media not found" });
        }
        res.status(200).json({ success: true, data: media });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc getByPage
// @routes GET /api/media/page/:page
// @access Public
const getByPage = async (req, res) => {
    try {
        const { page } = req.params;
        const media = await Media.find({ page }).sort({ createdAt: 1 });

        // Map into a section dictionary for instantaneous lookup by section name
        const sections = {};
        media.forEach(doc => {
            if (doc.section) {
                sections[doc.section] = doc;
            }
        });

        res.status(200).json({ 
            success: true, 
            page,
            count: media.length, 
            sections,
            data: media 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc getBySection
// @routes GET /api/media/section/:section
// @access Public
const getBySection = async (req, res) => {
    try {
        const { section } = req.params;
        const media = await Media.find({ section });
        res.status(200).json({ success: true, count: media.length, data: media });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc getMediaByPageAndSection
// @routes GET /api/media/:page/:section OR GET /api/media/detail/:page/:section
// @access Public
const getMediaByPageAndSection = async (req, res) => {
    try {
        const { page, section } = req.params;
        const media = await Media.findOne({ page, section });
        if (!media) {
            return res.status(404).json({ 
                success: false, 
                message: `Media section '${section}' for page '${page}' not found` 
            });
        }
        res.status(200).json({ success: true, data: media });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc deleteMedia
// @routes DELETE /api/media/:id
// @access Private
const deleteMedia = async (req, res) => {
    try {
        const { id } = req.params;
        const media = await Media.findByIdAndDelete(id);
        if (!media) {
            return res.status(404).json({ success: false, message: "Media not found" });
        }
        res.status(200).json({ success: true, message: "Media deleted successfully", data: media });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc updateMediaForSection (with auto-create UPSERT support)
// @routes PUT /api/media/:page/:section
// @access Private
const updateMediaForSection = async (req, res) => {
    try {
        const { page, section } = req.params;
        const updateFields = {};

        const allowedFields = [
            "name", 
            "title", 
            "titleAr", 
            "subtitle", 
            "subtitleAr", 
            "description", 
            "descriptionAr", 
            "images", 
            "items", 
            "extraData", 
            "isActive"
        ];

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                updateFields[field] = req.body[field];
            }
        });

        // Ensure page & section remain consistent
        updateFields.page = page;
        updateFields.section = section;
        if (!updateFields.name) {
            updateFields.name = `${page}-${section}`;
        }

        const updatedMedia = await Media.findOneAndUpdate(
            { page, section },
            { $set: updateFields },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.status(200).json({ 
            success: true, 
            message: `Section '${section}' for page '${page}' updated successfully`,
            data: updatedMedia 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc uploadDirectFile (Direct image upload returning file URL)
// @routes POST /api/media/upload-file OR POST /api/media/upload
// @access Private
const uploadDirectFile = async (req, res) => {
    try {
        if (!req.file && (!req.files || req.files.length === 0)) {
            return res.status(400).json({ success: false, message: "No image file provided" });
        }

        const primaryFilename = req.body.image || (req.body.images && req.body.images[0] ? req.body.images[0] : null);
        const fileUrl = req.body.imageUrl || (primaryFilename ? `/media/${primaryFilename}` : null);
        const imagesList = req.body.images || (primaryFilename ? [primaryFilename] : []);
        const urlsList = imagesList.map(img => img.startsWith("http") ? img : `/media/${img}`);

        res.status(200).json({ 
            success: true, 
            message: "Image uploaded successfully", 
            url: fileUrl,
            fileName: primaryFilename,
            images: imagesList,
            urls: urlsList
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    upload,
    getAllMedia,
    getMediaById,
    getByPage,
    getBySection,
    getMediaByPageAndSection,
    deleteMedia,
    updateMediaForSection,
    uploadDirectFile
};