const express = require("express");
const router = express.Router();
const { handleDeepLink } = require("../controllers/UniversalController");

// Route for deep linking
router.get("/app/:type/:id", handleDeepLink);

module.exports = router;
