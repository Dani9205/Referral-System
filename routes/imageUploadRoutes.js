const express = require('express');
const router = express.Router();
const ImageUploadController = require('../controllers/ImageUploadController');

// POST: Upload an image
router.post('/upload-image', ImageUploadController.uploadImage);

module.exports = router;
