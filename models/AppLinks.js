const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db'); // Adjust the path to your db configuration

class AppLinks extends Model {}

AppLinks.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        link: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        deviceType: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isIn: [['android', 'ios']] // Restricts values to either 'android' or 'ios'
            }
        },
        discountCode: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        modelName: 'AppLinks',
        tableName: 'applinks',
        timestamps: true,
    }
);

module.exports = AppLinks;