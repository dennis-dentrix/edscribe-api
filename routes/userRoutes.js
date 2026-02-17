const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/auth");
const { getAllUsers } = require("../controllers/usersController");
router.get("/", protect, authorize("admin"), getAllUsers);

module.exports = router;
