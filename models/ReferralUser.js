const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // db connection path 

const ReferralUser = sequelize.define(
  "ReferralUser",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    country: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: "N/A",
    },
    androidAppReferralLink: {
      type: DataTypes.TEXT,
      allowNull: true,
      unique: true,
    },
    iosAppReferralLink: {
      type: DataTypes.TEXT,
      allowNull: true,
      unique: true,
    },
    imageUrl: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: "",
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING(2555),
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(123),
      allowNull: true,
      defaultValue: "active",
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    phoneCode: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: "+00",
    },
    phoneNo: {
      type: DataTypes.STRING(200),
      allowNull: false,
      defaultValue: "0000000000",
    },
    otp: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    otpExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    accessToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    refreshToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    refreshTokenExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    balance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: 0.0,
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
    socialUid: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    idType: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    socialToken: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
  },
  {
    tableName: "referral_users",
    indexes: [
      {
        unique: true,
        fields: ["socialUid", "idType"], // duplicate UID+provider block
      },
      {
        fields: ["email"],
      },
    ],
  }
);

module.exports = ReferralUser;
