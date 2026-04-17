const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db'); // Adjust the path to your db configuration

class RedeemHistory extends Model {}

RedeemHistory.init(
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
       managerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
        model: 'referral_managers',
        key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
},
        points: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'points', // Explicit mapping to resolve any issues
        },
        approvedDate: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        paymentMethod: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        paymentDate: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM('successful', 'pending', 'cancelled'),
            allowNull: false,
            defaultValue: 'pending',
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'RedeemHistory',
        tableName: 'redeem_history',
        timestamps: true,
    }
);

module.exports = RedeemHistory;
