const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db'); // Adjust the path as needed

class ReferralDiscounts extends Model {}

ReferralDiscounts.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    referralPointsForMonthlySubscription: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    referralPointsForYearlySubscription: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    referralDiscountsForMonthlySubscription: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    referralDiscountsForYearlySubscription: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    pointsToDollars: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    monthlyTrialPeriod: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    YearlyTimePeriod: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    pointsRedeemMinLimit: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    monthlySubscription: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    yearlySubscription: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
    modelName: 'ReferralDiscounts',
    tableName: 'referral_discounts',
    timestamps: true, // enables createdAt & updatedAt
  }
);

module.exports = ReferralDiscounts;
