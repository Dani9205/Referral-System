const jwt = require('jsonwebtoken');
const ReferralUser = require('../models/ReferralUser');
require('dotenv').config();

module.exports = async (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'No token provided. Authorization denied.'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await ReferralUser.findByPk(decoded.id);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found. Authorization denied.'
            });
        }

        // Attach user data to request object
        req.user = user;

        next();
    } catch (error) {
        console.error('Auth Middleware Error:', error);
        res.status(401).json({
            success: false,
            message: 'Token is invalid or expired.'
        });
    }
};
