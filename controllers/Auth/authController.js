const multer = require("multer");
const path = require("path");
const fs = require("fs");

require('dotenv').config(); // <-- Ensure at the top of file
const jwt = require('jsonwebtoken');
const jwksClient = require("jwks-rsa");
const sequelize = require("../../config/db");
const ReferralUser = require('../../models/ReferralUser');
const User = require('../../models/User');
const axios = require('axios');
const { OAuth2Client } = require("google-auth-library");
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const { generateOtp } = require('../../utils/otpUtils');
const { 
    TWILIO_ACCOUNT_SID, 
    TWILIO_AUTH_TOKEN, 
    TWILIO_FROM_NUMBER,   
    JWT_SECRET,
    JWT_REFRESH_SECRET 
} = process.env;

const twilio = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// Generate tokens safely
const generateAccessToken = (user) => {
    if (!JWT_SECRET) throw new Error('JWT_SECRET is not set.');
    return jwt.sign({ id: user.id, phoneNo: user.phoneNo }, JWT_SECRET, { expiresIn: '1h' });
};

const generateRefreshToken = (user) => {
    if (!JWT_REFRESH_SECRET) throw new Error('JWT_REFRESH_SECRET is not set.');
    return jwt.sign({ id: user.id, phoneNo: user.phoneNo }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

// Apple JWKS client
const appleClient = jwksClient({
  jwksUri: "https://appleid.apple.com/auth/keys",
});

async function getAppleKey(kid) {
  return new Promise((resolve, reject) => {
    appleClient.getSigningKey(kid, (err, key) => {
      if (err) return reject(err);
      resolve(key.getPublicKey());
    });
  });
}






// Send OTP controller
exports.sendOtp = async (req, res) => {
    const { phoneCode, phoneNo } = req.body;

    if (!phoneCode || !phoneNo) {
        return res.status(400).json({
            success: false,
            message: 'Phone code and phone number are required.'
        });
    }

    try {
        const { otp, otpExpiry } = generateOtp();

        // Uncomment in production
        // await twilio.messages.create({
        //     body: `Your OTP is ${otp}. It will expire in 10 minutes.`,
        //     from: TWILIO_FROM_NUMBER,
        //     to: `${phoneCode}${phoneNo}`,
        // });

        const user = await ReferralUser.findOne({ where: { phoneCode, phoneNo } });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.',
                data: { 
                    isRegistered: false,
                    phoneCode,
                    phoneNo
                }
            });
        }

        user.otp = otp;
        user.otpExpiry = otpExpiry;

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        user.refreshToken = refreshToken;
        user.refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        await user.save();

        res.setHeader('access-token', accessToken);
        res.setHeader('refresh-token', refreshToken);

        // Expose the headers (use the same lowercase names here)
        res.setHeader('Access-Control-Expose-Headers', 'access-token, refresh-token');

        res.status(200).json({
            success: true,
            message: 'OTP sent successfully.',
            data: {
                isRegistered: true,
                user
            },
        });

    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send OTP.',
            error: error.message || 'Internal Server Error',
        });
    } 
};







// Signup via phone number
exports.signup = async (req, res) => {
    const { name, imageUrl, phoneCode, phoneNo, country } = req.body;

    if (!name || !imageUrl || !phoneCode || !phoneNo || !country) {
        return res.status(400).json({
            success: false,
            message: 'All fields (name, imageUrl, phoneCode, phoneNo, country) are required.',
        });
    }

    try {
        const existingUser = await ReferralUser.findOne({ where: { phoneCode, phoneNo } });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User already exists with this phone number.',
            });
        }

        const newUser = await ReferralUser.create({
            name,
            imageUrl,
            phoneCode,
            phoneNo,
            country
        });

        res.status(201).json({
            success: true,
            message: 'Signup successful!',
            data: newUser,
        });
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json({
            success: false,
            message: 'Signup failed.',
            error: error.message || 'Internal Server Error',
        });
    }
};







 

//signin via google/apple (signup + login)
exports.socialAuthReferralManager = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { signupType, socialToken } = req.body;

    if (!signupType || !socialToken) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "signupType and socialToken are required"
      });
    }

    if (!["google", "apple"].includes(signupType)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Invalid signupType"
      });
    }

    let socialUid;
    let verifiedEmail;
    let name = "";
    let imageUrl = "";

    // =========================
    // 🔵 GOOGLE
    // =========================
    if (signupType === "google") {
      const ticket = await googleClient.verifyIdToken({
        idToken: socialToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      socialUid = payload.sub;
      verifiedEmail = payload.email;
      name = payload.name || "N/A";
      imageUrl = payload.picture || "";

      if (!socialUid || !verifiedEmail) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "Invalid Google token"
        });
      }
    }

    // =========================
    // 🍏 APPLE
    // =========================
    if (signupType === "apple") {
      const decodedHeader = jwt.decode(socialToken, { complete: true });

      if (!decodedHeader?.header?.kid) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "Invalid Apple token header"
        });
      }

      const publicKey = await getApplePublicKey(decodedHeader.header.kid);

      const payload = jwt.verify(socialToken, publicKey, {
        algorithms: ["RS256"],
        issuer: "https://appleid.apple.com",
        audience: process.env.APPLE_CLIENT_ID,
      });

      socialUid = payload.sub;
      verifiedEmail = payload.email;
      name = payload.name || "N/A";
      imageUrl = "";
    }

    // =========================
    // 🔎 STEP 1: Check by socialUid
    // =========================
    let user = await ReferralUser.findOne({
      where: { socialUid, idType: signupType },
      transaction: t
    });

    // =========================
    // 🔎 STEP 2: If not found → Check by email
    // =========================
    if (!user) {
      user = await ReferralUser.findOne({
        where: { email: verifiedEmail },
        transaction: t
      });

      // If email exists → link social account
      if (user) {
        user.socialUid = socialUid;
        user.idType = signupType;
        user.imageUrl = imageUrl || user.imageUrl;

        await user.save({ transaction: t });
      }
    }

    // =========================
    // 👤 STEP 3: If still not found → Create new
    // =========================
    if (!user) {
      user = await ReferralUser.create({
        name,
        email: verifiedEmail,
        imageUrl,
        socialUid,
        idType: signupType,
        status: "active",
        balance: 0.0
      }, { transaction: t });
    }

    // =========================
    // 🔐 Generate JWT
    // =========================
    const accessToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    user.refreshToken = refreshToken;
    user.refreshTokenExpiry =
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await user.save({ transaction: t });

    await t.commit();

    return res.status(200).json({
      success: true,
      message: "Authentication successful",
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        imageUrl: user.imageUrl,
        idType: user.idType
      }
    });

  } catch (error) {
    await t.rollback();

    console.error("Social Auth Error:", error);

    return res.status(500).json({
      success: false,
      message: "Social Authentication Failed",
      error: error.message
    });
  }
};












//signup with google
//Sabir
exports.signupWithGoogleReferralManager = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const {
      username,
      imageUrl,
      socialToken,
      socialUid,
      email,
      signupType,
    } = req.body;

    const ANDROID_APP_REFERRAL_BASE_URL =
      process.env.ANDROID_APP_REFERRAL_BASE_URL;
    const IOS_APP_REFERRAL_BASE_URL =
      process.env.IOS_APP_REFERRAL_BASE_URL;

    // =========================
    // VALIDATION
    // =========================
    if (!username || !socialToken || !socialUid || !email || !signupType) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    if (signupType !== "google") {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Invalid signupType",
      });
    }

    if (!ANDROID_APP_REFERRAL_BASE_URL || !IOS_APP_REFERRAL_BASE_URL) {
      await t.rollback();
      return res.status(500).json({
        success: false,
        message: "Referral base URLs are missing in environment variables",
      });
    }

    // normalize email
    const normalizedEmail = String(email).trim().toLowerCase();

    // =========================
    // CHECK IF USER EXISTS
    // =========================
    const existingUser = await ReferralUser.findOne({
      where: { email: normalizedEmail },
      transaction: t,
    });

    if (existingUser) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "User already exists. Please login instead.",
      });
    }

    // =========================
    // CREATE NEW USER
    // =========================
    const user = await ReferralUser.create(
      {
        name: username.trim(),
        email: normalizedEmail,
        country: "N/A",
        imageUrl: imageUrl || "",
        phoneCode: "N/A",
        phoneNo: "N/A",
        socialUid,
        socialToken,
        idType: signupType,
        status: "active",
        balance: 0.0,
      },
      { transaction: t }
    );

    // =========================
    // GENERATE REFERRAL LINKS
    // =========================

    // Android: Play Store + encoded referrer
    const androidReferrer = encodeURIComponent(`userId=${user.id}`);
    const androidAppReferralLink =
      `${ANDROID_APP_REFERRAL_BASE_URL}&referrer=${androidReferrer}`;

    // iOS: App Store page with query param
    const iosAppReferralLink =
      `${IOS_APP_REFERRAL_BASE_URL}?ref=${user.id}`;

    user.androidAppReferralLink = androidAppReferralLink;
    user.iosAppReferralLink = iosAppReferralLink;

    // =========================
    // GENERATE TOKENS
    // =========================
    const accessToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    user.accessToken = accessToken;
    user.refreshToken = refreshToken;
    user.refreshTokenExpiry = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    await user.save({ transaction: t });

    await t.commit();

    return res.status(201).json({
      success: true,
      message: "Google signup successful",
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        imageUrl: user.imageUrl,
        idType: user.idType,
        androidAppReferralLink: user.androidAppReferralLink,
        iosAppReferralLink: user.iosAppReferralLink,
      },
    });
  } catch (error) {
    await t.rollback();

    console.error("Google Signup Error:", error);

    return res.status(500).json({
      success: false,
      message: "Google Signup Failed",
      error: error.message,
    });
  }
};










// // login with google
// exports.loginWithGoogleReferralManager = async (req, res) => {
//   try {
//     const { socialUid, email } = req.body;

//     // =========================
//     // 🔎 VALIDATION
//     // =========================
//     if (!socialUid || !email) {
//       return res.status(400).json({
//         success: false,
//         message: "Both socialUid and email are required"
//       });
//     }

//     // =========================
//     // ❌ CHECK IF USER EXISTS
//     // =========================
//     const user = await ReferralUser.findOne({
//       where: { socialUid, email }
//     });

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found. Please signup first."
//       });
//     }

//     // =========================
//     // 🔐 GENERATE JWT
//     // =========================
//     const accessToken = jwt.sign(
//       { id: user.id, email: user.email },
//       process.env.JWT_SECRET,
//       { expiresIn: "1d" }
//     );

//     const refreshToken = jwt.sign(
//       { id: user.id },
//       process.env.JWT_REFRESH_SECRET,
//       { expiresIn: "7d" }
//     );

//     // =========================
//     // 💾 SAVE TOKENS IN DB
//     // =========================
//     user.accessToken = accessToken; // ✅ save accessToken
//     user.refreshToken = refreshToken;
//     user.refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // stores full datetime

//     await user.save();

//     // =========================
//     // ✅ RESPONSE
//     // =========================
//     return res.status(200).json({
//       success: true,
//       message: "Google login successful",
//       accessToken,
//       refreshToken,
//       user: {
//         id: user.id,
//         name: user.name,
//         email: user.email,
//         imageUrl: user.imageUrl,
//         idType: user.idType
//       }
//     });

//   } catch (error) {
//     console.error("Google Login Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Google Login Failed",
//       error: error.message
//     });
//   }
// };
exports.loginWithGoogleReferralManager = async (req, res) => {
  try {
    const { socialUid, email, imageUrl } = req.body;

    // =========================
    // 🔎 VALIDATION
    // =========================
    if (!socialUid || !email) {
      return res.status(400).json({
        success: false,
        message: "Both socialUid and email are required",
      });
    }

    // =========================
    // ❌ CHECK IF USER EXISTS
    // =========================
    const user = await ReferralUser.findOne({
      where: { socialUid, email },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please signup first.",
      });
    }

    // =========================
    // 🖼 UPDATE IMAGE URL IF MISSING OR CHANGED
    // =========================
    if (imageUrl && user.imageUrl !== imageUrl) {
      user.imageUrl = imageUrl; // save the Google profile picture
    }

    // =========================
    // 🔐 GENERATE JWT
    // =========================
    const accessToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // =========================
    // 💾 SAVE TOKENS (and updated imageUrl)
    // =========================
    user.accessToken = accessToken;
    user.refreshToken = refreshToken;
    user.refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await user.save();

    // =========================
    // ✅ RESPONSE
    // =========================
    return res.status(200).json({
      success: true,
      message: "Google login successful",
      accessToken,
      refreshToken,
      user: user
    });
  } catch (error) {
    console.error("Google Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Google Login Failed",
      error: error.message,
    });
  }
};









//signin referral user with apple (signup + login)
const { Op } = require("sequelize");

exports.signinWithAppleReferralManager = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const {
      username,
      imageUrl,
      socialToken,
      socialUid,
      email,
      signupType,
    } = req.body;

    const ANDROID_APP_REFERRAL_BASE_URL =
      process.env.ANDROID_APP_REFERRAL_BASE_URL;
    const IOS_APP_REFERRAL_BASE_URL =
      process.env.IOS_APP_REFERRAL_BASE_URL;

    // =========================
    // ✅ VALIDATION
    // =========================
    if (!socialToken || !socialUid || !signupType) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "socialUid, socialToken and signupType are required",
      });
    }

    if (signupType !== "apple") {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Invalid signupType",
      });
    }

    const normalizedEmail = email
      ? String(email).trim().toLowerCase()
      : null;

    // =========================
    // 🔍 1. CHECK BY UID (PRIMARY)
    // =========================
    let user = await ReferralUser.findOne({
      where: { socialUid, idType: "apple" },
      transaction: t,
    });

    let isNewUser = false;

    // =========================
    // 🔐 LOGIN FLOW
    // =========================
    if (user) {
      // ❌ NEVER update socialUid

      // ✅ update email if provided & changed
      if (normalizedEmail && user.email !== normalizedEmail) {
        user.email = normalizedEmail;
      }

      // update image
      if (imageUrl && user.imageUrl !== imageUrl) {
        user.imageUrl = imageUrl;
      }

      // update token (optional but recommended)
      if (socialToken && user.socialToken !== socialToken) {
        user.socialToken = socialToken;
      }
    }

    // =========================
    // 🆕 SIGNUP FLOW
    // =========================
    else {
      // 🔴 EMAIL CONFLICT CHECK (only if email provided)
      if (normalizedEmail) {
        const existingEmailUser = await ReferralUser.findOne({
          where: { email: normalizedEmail },
          transaction: t,
        });

        if (existingEmailUser) {
          await t.rollback();
          return res.status(400).json({
            success: false,
            message:
              "Account already exists with this email using another account",
          });
        }
      }

      // ✅ CREATE USER
      user = await ReferralUser.create(
        {
          name: username ? username.trim() : "Apple User",
          email: normalizedEmail,
          country: "N/A",
          imageUrl: imageUrl || "",
          phoneCode: "N/A",
          phoneNo: "N/A",
          socialUid,
          socialToken,
          idType: "apple",
          status: "active",
          balance: 0.0,
        },
        { transaction: t }
      );

      isNewUser = true;

      // =========================
      // 🔗 REFERRAL LINKS
      // =========================
      const androidReferrer = encodeURIComponent(`userId=${user.id}`);
      user.androidAppReferralLink =
        `${ANDROID_APP_REFERRAL_BASE_URL}&referrer=${androidReferrer}`;

      user.iosAppReferralLink =
        `${IOS_APP_REFERRAL_BASE_URL}?ref=${user.id}`;
    }

    // =========================
    // 🔐 GENERATE JWT TOKENS
    // =========================
    const accessToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    user.accessToken = accessToken;
    user.refreshToken = refreshToken;
    user.refreshTokenExpiry = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    await user.save({ transaction: t });

    await t.commit();

    // =========================
    // ✅ RESPONSE
    // =========================
    return res.status(200).json({
      success: true,
      message: isNewUser
        ? "Apple signup successful"
        : "Apple login successful",
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        imageUrl: user.imageUrl,
        idType: user.idType,
        androidAppReferralLink: user.androidAppReferralLink,
        iosAppReferralLink: user.iosAppReferralLink,
      },
    });

  } catch (error) {
    await t.rollback();

    console.error("Apple Auth Error:", error);

    return res.status(500).json({
      success: false,
      message: "Apple Auth Failed",
      error: error.message,
    });
  }
};







//refresh access Token
exports.refreshToken = async (req, res) => {
  try {
    // Accept refreshToken from form-data
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    // Find user with this refresh token
    const user = await ReferralUser.findOne({ where: { refreshToken } });
    if (!user) {
      return res.status(403).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    // Check expiry
    if (!user.refreshTokenExpiry || user.refreshTokenExpiry < new Date()) {
      return res.status(403).json({
        success: false,
        message: "Refresh token expired. Please login again",
      });
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" } // 1 day
    );

    // Optional: Generate new refresh token (sliding)
    const newRefreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" } // 7 days
    );

    // Update DB
    user.refreshToken = newRefreshToken;
    user.refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    console.error("Refresh Token Error:", err);
    return res.status(500).json({
      success: false,
      message: "Token refresh failed",
      error: err.message,
    });
  }
};










//logout
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ success: false, message: "Refresh token is required" });
    }

    // Find user by refreshToken
    const user = await ReferralUser.findOne({ where: { refreshToken } });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found or already logged out" });
    }

    // Clear tokens
    user.accessToken = null;
    user.refreshToken = null;
    user.refreshTokenExpiry = null;
    await user.save();

    return res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout Error:", err);
    return res.status(500).json({ success: false, message: "Logout failed", error: err.message });
  }
};










//upload image (profile picture)
// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"), // uploads folder
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only images (jpeg, jpg, png, gif) are allowed"));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter,
}).single("profilePic");

// Controller function
exports.uploadProfilePicture = async (req, res) => {
  upload(req, res, async (err) => {
    try {
      if (err) {
        console.error("Upload Error:", err.message);
        return res.status(400).json({ success: false, message: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: "Profile picture is required" });
      }

      const userId = req.user.id; // From JWT middleware
      const user = await ReferralUser.findByPk(userId);

      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      // Delete old image if exists and is local
      if (user.imageUrl && user.imageUrl.includes("/uploads/")) {
        const oldPath = path.join(__dirname, "../../", user.imageUrl.replace(`${req.protocol}://${req.get("host")}/`, ""));
        fs.unlink(oldPath, (err) => {
          if (err) console.log("Old image not deleted:", err.message);
        });
      }

      // Generate full URL for frontend
      const fullUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
      user.imageUrl = fullUrl;
      await user.save();

      return res.status(200).json({
        success: true,
        message: "Profile picture updated successfully",
        imageUrl: fullUrl,
      });

    } catch (error) {
      console.error("Upload Controller Error:", error);
      return res.status(500).json({ success: false, message: "Upload failed", error: error.message });
    }
  });
};

