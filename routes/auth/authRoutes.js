const express = require('express');
const router = express.Router();
const multer = require('multer');
const authController = require('../../controllers/Auth/authController'); 
const verifyToken = require('../../middleware/authMiddleware');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

// POST: Send OTP //login with phone number
router.post('/send-otp', upload.none(), authController.sendOtp);

// POST: Sign up via phone number
router.post('/signup', upload.none(), authController.signup);

// Signin via Google/Apple
router.post("/social-auth", upload.none(), authController.socialAuthReferralManager);

//Google Signup
router.post("/signup/google", upload.none(), authController.signupWithGoogleReferralManager);

// Google Login
router.post("/login/google", upload.none(), authController.loginWithGoogleReferralManager);

//Refresh access token
router.post("/refresh-token", upload.none(), authController.refreshToken);

//Logout
router.post("/logout", upload.none(), authController.logout);

// Upload profile picture
router.post("/upload-profile-picture", verifyToken, authController.uploadProfilePicture);
module.exports = router;
