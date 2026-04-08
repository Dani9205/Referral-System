const multer = require('multer');
const path = require('path');

// Configure Multer for file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../public/uploads')); // Destination folder
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname}`; // Unique file name
        cb(null, uniqueName);
    },
});

const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only images (jpeg, jpg, png, gif) are allowed'));
        }
    },
});

// Upload Image Functionality
exports.uploadImage = (req, res) => {
    const uploadSingle = upload.single('image');

    uploadSingle(req, res, (err) => {
        if (err) {
            console.error('Error uploading image:', err.message);
            return res.status(400).json({ success: false, message: err.message });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image uploaded' });
        }

        const imageUrl = `/uploads/${req.file.filename}`; // Relative URL for the frontend
        return res.status(200).json({
            success: true,
            message: 'Image uploaded successfully',
            data: {
                imageUrl,
            }
        });
    });
};
