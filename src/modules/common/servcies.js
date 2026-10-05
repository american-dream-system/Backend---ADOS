// @desc create document
// @route POST /api/documents
// @access Private
const createDocument = (model) => {
    const document = model.create(req.body);
    res.status(201).json({ message: `${model.modelName} created successfully`, document });
}

// @desc get all documents
// @route GET /api/documents
// @access Private
const getAllDocuments = (model) => {
    const documents = model.find();
    res.status(200).json({ message: `${model.modelName} fetched successfully`, documents });
}

// @desc get document by id
// @route GET /api/documents/:id
// @access Private
const getDocumentById = (model) => {
    const document = model.findById(req.params.id);
    res.status(200).json({ message: `${model.modelName} fetched successfully`, document });
}

// @desc update document
// @route PUT /api/documents/:id
// @access Private
const updateDocument = (model) => {
    const document = model.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ message: `${model.modelName} updated successfully`, document });
}

// @desc delete document
// @route DELETE /api/documents/:id
// @access Private
const deleteDocument = (model) => {
    const document = model.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: `${model.modelName} deleted successfully`, document });
}

module.exports = { createDocument, getAllDocuments, getDocumentById, updateDocument, deleteDocument }; 