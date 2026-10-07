const express = require("express");
const router = express.Router();
const { createGuest, getAllGuests, getGuestById, updateGuest, deleteGuest } = require("./services");


router.post("/", createGuest);

router.get("/", getAllGuests);

router.get("/:id", getGuestById);

router.put("/:id", updateGuest);

router.delete("/:id", deleteGuest);

module.exports = router;