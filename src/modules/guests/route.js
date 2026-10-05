const express = require("express");
const router = express.Router();
const service = require("./services");

// Routes
/*
    @swagger
    components:
        schemas:
            Guest:
                type: object
                properties:
                    name: { type: string, description: "The name of the guest" }
                    description: { type: string, description: "The description of the guest" }
                    owner: { type: string, description: "The owner of the guest" }
                    guestUrl: { type: string, description: "The URL of the guest" }
                    category: { type: string, description: "The category of the guest" }
                    status: { type: string, enum: ['pending', 'approved', 'rejected'], description: "The status of the guest" }
*/
router.post("/", service.createGuest);

/*
    @swagger
    components:
        schemas:
            Guest:
                type: object
                properties:
                    name: { type: string, description: "The name of the guest" }
                    description: { type: string, description: "The description of the guest" }
                    owner: { type: string, description: "The owner of the guest" }
                    guestUrl: { type: string, description: "The URL of the guest" }
                    category: { type: string, description: "The category of the guest" }
                    status: { type: string, enum: ['pending', 'approved', 'rejected'], description: "The status of the guest" }
*/
router.get("/", service.getAllGuests);

/*
    @swagger
    components:
        schemas:
            Guest:
                type: object
                properties:
                    name: { type: string, description: "The name of the guest" }
                    description: { type: string, description: "The description of the guest" }
                    owner: { type: string, description: "The owner of the guest" }
                    guestUrl: { type: string, description: "The URL of the guest" }
                    category: { type: string, description: "The category of the guest" }
                    status: { type: string, enum: ['pending', 'approved', 'rejected'], description: "The status of the guest" }
*/
router.get("/:id", service.getGuestById);

/*
    @swagger
    components:
        schemas:
            Guest:
                type: object
                properties:
                    name: { type: string, description: "The name of the guest" }
                    description: { type: string, description: "The description of the guest" }
                    owner: { type: string, description: "The owner of the guest" }
                    guestUrl: { type: string, description: "The URL of the guest" }
                    category: { type: string, description: "The category of the guest" }
                    status: { type: string, enum: ['pending', 'approved', 'rejected'], description: "The status of the guest" }
*/
router.put("/:id", service.updateGuest);

/*
    @swagger
    components:
        schemas:
            Guest:
                type: object
                properties:
                    name: { type: string, description: "The name of the guest" }
                    description: { type: string, description: "The description of the guest" }
                    owner: { type: string, description: "The owner of the guest" }
                    guestUrl: { type: string, description: "The URL of the guest" }
                    category: { type: string, description: "The category of the guest" }
                    status: { type: string, enum: ['pending', 'approved', 'rejected'], description: "The status of the guest" }
*/
router.delete("/:id", service.deleteGuest);

module.exports = router;