// models/User.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db'); // DB config
const Subscription = require('./Subscription.js'); // Import the Subscription model

class User extends Model { }

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    referredUid: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    googleUid: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    googleToken: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    authToken: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    authTokenHash: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    authTokenIssuedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    authTokenExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // 🔓 plain
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    age: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    ageUnit: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    gender: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    // 🔓 plain (was already plain)
    fcmToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    timeZone: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    // 🔓 plain
    image: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    type: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'user',
      validate: { isIn: [['user', 'marketer']] },
    },

    installedDate: {
      type: DataTypes.STRING(255),
      allowNull: true,
    }, 

    userType: {
      type: DataTypes.ENUM('free', 'paid'),
      allowNull: false,
      defaultValue: 'free',
    },

    points: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
    },

    shareSettings: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'withNone',
      validate: {
        isIn: [['withNone', 'withSelectedProfile', 'withAllConnectedMembers']],
      },
    },

    balance: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '0',
    },

    // 🔓 plain
    linkCode: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
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
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    paranoid: true,
    // ⛔️ encryption hooks removed
  }
);


// // Define the relationship here
User.hasMany(Subscription, { foreignKey: 'uid', as: 'Subscriptions' });

module.exports = User;
