const express = require('express');
const multer = require('multer');
const router = express.Router();
// const authMiddleware = require('../middleware/authMiddleware');

const {
    getFreeUsers,
    getActiveSubscriptionUsers,
    getTrialSubscriptionUsers,
    addCoupon,
    redeemPoints,
    fetchCouponsByUid,
    fetchRedeemHistoryByUid,
    reward,
    usersDetails,
    getReferralDetails,
    getFreeUsersByFilteration,
    getActiveSubscriptionUsersByFilteration,
    getMarketingAgents,
    marketingAgentsDetails,
    getRedeemHistoryWithUser,
    updateRedeemHistoryStatus,
    getPremiumUsers,
    getMarketers,
    paymentRequests,
    singleUserDetails,
    redeemHistory,
    allDiscounts,
    getCounts,
    appsLinks,
    referralDiscounts,
    getAllFreeUsers,
    logoutUser
} = require('../controllers/referralController');

const upload = multer();

// Protected routes
router.get('/users/free', upload.none(), getFreeUsers);// user referral
router.post('/users/free/all', upload.none(), getAllFreeUsers); // manager referral
router.get('/users/paid', getActiveSubscriptionUsers);
router.get('/users/trial', getTrialSubscriptionUsers); 
router.get('/coupons/all', fetchCouponsByUid);
router.post('/coupon/add', upload.none(), addCoupon);
router.post('/points/redeem', upload.none(), redeemPoints);
router.get('/points/get', upload.none(), fetchRedeemHistoryByUid);
router.post('/reward', upload.none(), reward);
router.post('/details/get', upload.none(), getReferralDetails);
router.post('/users/details', usersDetails);
router.get('/redeem/history', redeemHistory);
router.get('/discount/all', allDiscounts);
router.post('/get/counts', getCounts); // Dashboard screen counts
router.get('/apps/links', appsLinks); // Dashboard screen counts
router.get('/discounts', referralDiscounts); // Dashboard screen counts

// New routes with filtration
router.post('/users/premium/all', upload.none(), getPremiumUsers); // user referral
router.post('/users/marketers/all', upload.none(), getMarketers);
router.post('/users/payment/requests', upload.none(), paymentRequests);
router.post('/user/single/details', upload.none(), singleUserDetails);
router.post('/users/free/filter', upload.none(), getFreeUsersByFilteration);
router.post('/users/premium/filter', upload.none(), getActiveSubscriptionUsersByFilteration);
router.get('/users/marketer', getMarketingAgents);
router.post('/users/marketer/details', upload.none(), marketingAgentsDetails);
router.get('/payment/requests', upload.none(), getRedeemHistoryWithUser);
router.post('/redeem/history/update', upload.none(), updateRedeemHistoryStatus);


// Logout route
router.post('/logout', upload.none(), logoutUser);

module.exports = router;
