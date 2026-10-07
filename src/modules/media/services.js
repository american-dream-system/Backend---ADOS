const Media = require("./model");

// @desc uploadIMage 
// @routes POST /api/media
// @access Private
const upload = async (req, res) => {
    const { images, name, section, page } = req.body;
    const media = await Media.create({ images, name, section, page });
    res.status(201).json({ success: true, data: media });
};

// @desc getByPage
// @routes GET /api/media/page/:page
// @access Public
const getByPage = async (req, res) => {
    const { page } = req.params;
    const media = await Media.find({ page });
    res.status(200).json({ success: true, data: media });
};

// @desc getBySection
// @routes GET /api/media/section/:section
// @access Public
const getBySection = async (req, res) => {
    const { section } = req.params;
    const media = await Media.find({ section });
    res.status(200).json({ success: true, data: media });
};

// @desc deleteMedia
// @routes DELETE /api/media/:id
// @access Private
const deleteMedia = async (req, res) => {
    const { id } = req.params;
    const media = await Media.findByIdAndDelete(id);
    if (!media) {
        return res.status(404).json({ success: false, message: "Media not found" });
    }
    res.status(200).json({ success: true, data: media });
};

// @desc updateMediaForSection
// @routes PUT /api/media/:page/:section
// @access Private
const updateMediaForSection = async (req, res) => {
    const { section, page } = req.params;
    const { name, images } = req.body;
    const media = await Media.findOne({ section, page });
    if (!media) {
        return res.status(404).json({ success: false, message: "Media not found" });
    }
    if (!name || !images) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    const updatedMedia = await Media.updateOne({ section, page }, { name, images });
    res.status(200).json({ success: true, data: updatedMedia });
};

module.exports = {
    upload,
    getByPage,
    getBySection,
    deleteMedia,
    updateMediaForSection
};