const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db'); // Adjust the path to your db configuration

class Coupon extends Model {}

Coupon.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        uid: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('expired', 'redeemed'), // Enum for coupon status
            allowNull: false, // Status cannot be null
            defaultValue: 'redeemed', // Default status
        },
        type: {
            type: DataTypes.ENUM('monthly', 'yearly'), // Enum for coupon status
            allowNull: false, // Status cannot be null
            defaultValue: 'monthly', // Default status
        },
        coupon: {
            type: DataTypes.STRING, // Coupon code
            allowNull: false, // Coupon code cannot be null
            unique: true, // Ensure uniqueness of coupon codes
        },
        points: {
            type: DataTypes.INTEGER, // Points associated with the coupon
            allowNull: false, // Points cannot be null
        },
        expiryDate: {
            type: DataTypes.DATE, // Points associated with the coupon
            allowNull: false, // Points cannot be null
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW, // Automatically set the creation date
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW, // Automatically update timestamp
        },
    },
    {
        sequelize,
        modelName: 'Coupon',
        tableName: 'coupons', // Table name
        timestamps: true, // Automatically manage createdAt and updatedAt
    }
);

module.exports = Coupon;
