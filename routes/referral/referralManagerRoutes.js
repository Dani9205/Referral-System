const express = require('express');
const multer = require("multer");
const upload = multer();
const {
  getAllReferralUsers,
  getAllReferralUsersWithFilters,
  getReferralUserStatistics,
  getReferralUserFreeUsers,
  getSingleReferralUser,
  getReferralUserPointsWithUsers,
  getReferralUserCouponHistory,
  getReferralUserRedeemHistory,
  loginReferralManager,
  generateForgotPasswordOTP,
  verifyForgotPasswordOTP,
  resetPassword
} = require('../../controllers/referral/referralManagerController');
const router = express.Router();

router.get('/admin/referral-users', getAllReferralUsers); //get all referral users
router.get('/admin/referral-users/filters', getAllReferralUsersWithFilters); //get all referral users with Filters
router.get('/admin/referral-users/:id/statistics', getReferralUserStatistics);  //get stats of marketing agent
router.get('/admin/referral-users/:id/free-users', getReferralUserFreeUsers); //get free users of referral User
router.get("/referral-users/:id", getSingleReferralUser);  //get single referral user with Financial Stats    
router.get('/referral-users/:id/points', getReferralUserPointsWithUsers); //Referral user points history
router.get('/referral-users/:id/coupons', getReferralUserCouponHistory); //coupon history of referral user
router.get('/referral-users/:id/redeems', getReferralUserRedeemHistory); //redeem history of referral user
router.post("/referral-manager/login", upload.none(), loginReferralManager); //login referral manager
router.post("/referral-manager/forgot-password", upload.none(), generateForgotPasswordOTP); //generate OTP
router.post("/referral-manager/verify-otp", upload.none(), verifyForgotPasswordOTP); //verify OTP
router.post("/referral-manager/reset-password", upload.none(), resetPassword);  //reset password

module.exports = router;
