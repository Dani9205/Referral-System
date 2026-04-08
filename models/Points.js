const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db'); // Adjust the path to your db configuration
const User = require('./User.js'); // Import the User model

class Points extends Model {}

Points.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        uid: {
            type: DataTypes.STRING, // Active points
            allowNull: false, // Cannot be null
        },
        active: {
            type: DataTypes.INTEGER, // Active points
            allowNull: false, // Cannot be null
            defaultValue: 0, // Default value for active points
        },
        total: {
            type: DataTypes.INTEGER, // Total earned points
            allowNull: false, // Cannot be null
            defaultValue: 0, // Default value for total points
        },
        coupons: {
            type: DataTypes.INTEGER, // Points used for coupons
            allowNull: false, // Cannot be null
            defaultValue: 0, // Default value
        },
        redeemed: {
            type: DataTypes.INTEGER, // Points redeemed
            allowNull: false, // Cannot be null
            defaultValue: 0, // Default value
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
        modelName: 'Points',
        tableName: 'points', // Table name
        timestamps: true, // Automatically manage createdAt and updatedAt
    }
);

// Define the relationship
Points.belongsTo(User, { foreignKey: 'uid', as: 'User' });


module.exports = Points;
