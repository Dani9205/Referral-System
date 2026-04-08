const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class ReferralChat extends Model { }

ReferralChat.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        senderId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        senderType: {
            type: DataTypes.ENUM('user', 'manager'),
            allowNull: false,
        },

        receiverId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        message: {
            type: DataTypes.TEXT,
            allowNull: false,
        },

        messageType: {
            type: DataTypes.ENUM('text', 'image'),
            allowNull: false,
            defaultValue: 'text',
        },

        readStatus: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0, // 0 = unread, 1 = read
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
        modelName: 'ReferralChat',
        tableName: 'referral_chats',
        timestamps: true,
        indexes: [
            { fields: ['senderId'] },
            { fields: ['receiverId'] },
            { fields: ['createdAt'] },
            { fields: ['senderId', 'receiverId'] },
        ],
    }
);

module.exports = ReferralChat;











// const { Model, DataTypes } = require('sequelize');
// const sequelize = require('../config/db'); // DB connection

// class ReferralChat extends Model {}

// ReferralChat.init(
//     {
//         id: {
//             type: DataTypes.INTEGER,
//             primaryKey: true,
//             autoIncrement: true,
//         },
//         senderId: {
//             type: DataTypes.INTEGER,
//             allowNull: false,
//         },
//         senderType: {
//             type: DataTypes.INTEGER,
//             allowNull: false,
//         },
//         receiverId: {
//             type: DataTypes.INTEGER,
//             allowNull: false,
//         },
//         message: {
//             type: DataTypes.TEXT,
//             allowNull: false,
//         },
//         messageType: {
//             type: DataTypes.TEXT,
//             allowNull: false,
//         },
//         managerId: {
//             type: DataTypes.STRING,
//             allowNull: false,
//         },
//         readStatus: {
//             type: DataTypes.INTEGER,
//             defaultValue: 0, // 0 = unread, 1 = read
//         },
//         createdAt: {
//             type: DataTypes.DATE,
//             defaultValue: DataTypes.NOW,
//         },
//         updatedAt: {
//             type: DataTypes.DATE,
//         },
//     },
//     {
//         sequelize,
//         modelName: 'ReferralChat',
//         tableName: 'referral_chats',
//         timestamps: true,
//     }
// );

// module.exports = ReferralChat;
