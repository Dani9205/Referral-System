const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer();

const {
  getActivePaymentRequests,
  getPendingPaymentRequests,
  getRedeemedPaymentRequests,
  updateRedeemStatus,
  handlePaymentRequest
} = require("../controllers/paymentRequestController");

// Active payment requests
router.get("/active-payment-requests", getActivePaymentRequests);

// Pending payment requests
router.get('/pending-payment-requests', getPendingPaymentRequests);

// Redeemed / successful payment requests
router.get('/redeemed-payment-requests', getRedeemedPaymentRequests);

//change status  (accept/cancel)
router.post("/redeem/update-status", upload.none(), updateRedeemStatus);

//change status (successful)
router.post("/payment-action", upload.none(), handlePaymentRequest);


module.exports = router;