const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db'); // Your database configuration file

class Payment extends Model {}

Payment.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  uid: {
    type: DataTypes.INTEGER,
    allowNull: false, // Assuming every Payment must have a user ID
  },
  amount: {
    type: DataTypes.DOUBLE,
    allowNull: false, // Amount is required
  },
  currency: {
    type: DataTypes.STRING,
    allowNull: false, // Currency is required
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed'),
    allowNull: false,
    defaultValue: 'pending', // Default status
  },
  subscriptionId: {
    type: DataTypes.INTEGER,
    allowNull: true, // Subscription ID can be null if not linked to a subscription
  },
  transactionId: {
    type: DataTypes.INTEGER,
    allowNull: true, // Subscription ID can be null if not linked to a subscription
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
}, {
  sequelize,
  modelName: 'Payment',
  tableName: 'payments',
  timestamps: true, // Automatically handle createdAt and updatedAt
});

module.exports = Payment;
