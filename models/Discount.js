const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Your database configuration file

const Discount = sequelize.define('Discount', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  device: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'android, ios',
  },
  appLink: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  code: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW, // Use Sequelize's NOW for the default value
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
}, {
  tableName: 'discount', // Explicitly set the table name
  timestamps: true, // Enable createdAt and updatedAt timestamps
});

module.exports = Discount;
