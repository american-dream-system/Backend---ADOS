const express = require("express");
const router = express.Router();
const { upload, getByPage, getBySection, deleteMedia } = require("./services");
const { arrayOfImages, imageProcessing } = require("../../middlewares/uploadImages");

/*
    @swagger
    components:
        schemas:
            Media:
                type: object
                properties:
                    name: { type: string, description: "The name of the media" }
                    description: { type: string, description: "The description of the media" }
                    owner: { type: string, description: "The owner of the media" }
                    mediaUrl: { type: string, description: "The URL of the media" }
                    category: { type: string, description: "The category of the media" }
                    status: { type: string, enum: ['pending', 'approved', 'rejected'], description: "The status of the media" }
*/
router.post("/", arrayOfImages("images"), imageProcessing, upload);

/*
    @swagger
    components:
        schemas:
            Media:
                type: object
                properties:
                    name: { type: string, description: "The name of the media" }
                    description: { type: string, description: "The description of the media" }
                    owner: { type: string, description: "The owner of the media" }
                    mediaUrl: { type: string, description: "The URL of the media" }
                    category: { type: string, description: "The category of the media" }
                    status: { type: string, enum: ['pending', 'approved', 'rejected'], description: "The status of the media" }
*/
router.get("/page/:page", getByPage);

/*
    @swagger
    components:
        schemas:
            Media:
                type: object
                properties:
                    name: { type: string, description: "The name of the media" }
                    description: { type: string, description: "The description of the media" }
                    owner: { type: string, description: "The owner of the media" }
                    mediaUrl: { type: string, description: "The URL of the media" }
                    category: { type: string, description: "The category of the media" }
                    status: { type: string, enum: ['pending', 'approved', 'rejected'], description: "The status of the media" }
*/
router.get("/section/:section", getBySection);

/*
    @swagger
    components:
        schemas:
            Media:
                type: object
                properties:
                    name: { type: string, description: "The name of the media" }
                    description: { type: string, description: "The description of the media" }
                    owner: { type: string, description: "The owner of the media" }
                    mediaUrl: { type: string, description: "The URL of the media" }
                    category: { type: string, description: "The category of the media" }
                    status: { type: string, enum: ['pending', 'approved', 'rejected'], description: "The status of the media" }
*/
router.delete("/:id", deleteMedia);

module.exports = router;
