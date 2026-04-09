// const { DataTypes } = require('sequelize');
// const sequelize = require('../config/db'); // Your database configuration file
// const User = require('./User'); // Import the User model

// const Subscription = sequelize.define('Subscription', {
//   id: {
//     type: DataTypes.INTEGER,
//     primaryKey: true,
//     autoIncrement: true,
//   },
//   uid: {
//     type: DataTypes.INTEGER,
//     allowNull: false,
//   },
//   startDate: {
//     type: DataTypes.DATE,
//     allowNull: false,
//   },
//   endDate: {
//     type: DataTypes.DATE,
//     allowNull: false,
//   },
//   clearedDate: {
//     type: DataTypes.DATE,
//     allowNull: true,
//   },
//   canceledDate: {
//     type: DataTypes.DATE,
//     allowNull: true,
//   },
//   status: {
//     type: DataTypes.ENUM('active', 'canceled', 'expired', 'trial'),
//     allowNull: false,
//   },
//   planType: {
//     type: DataTypes.ENUM('monthly', 'yearly'),
//     allowNull: false,
//   },
//   createdAt: {
//     type: DataTypes.DATE,
//     allowNull: false,
//     defaultValue: DataTypes.NOW,
//   },
//   updatedAt: {
//     type: DataTypes.DATE,
//     allowNull: false,
//     defaultValue: DataTypes.NOW,
//   },
//   deletedAt: {
//     type: DataTypes.DATE,
//     allowNull: true,
//   },
// }, {
//   tableName: 'subscriptions',
//   timestamps: true,
//   paranoid: true,
// });

// // Define the relationship here
// // Subscription.belongsTo(User, { foreignKey: 'uid', as: 'User' });

// module.exports = Subscription;

const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const Subscription = sequelize.define('Subscription', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },

    uid: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },

    startDate: {
        type: DataTypes.DATE,
        allowNull: false,
    },

    endDate: {
        type: DataTypes.DATE,
        allowNull: false,
    },

    clearedDate: {
        type: DataTypes.DATE,
        allowNull: true,
    },

    canceledDate: {
        type: DataTypes.DATE,
        allowNull: true,
    },

    status: {
        type: DataTypes.ENUM('active', 'canceled', 'expired'),
        allowNull: false,
    },

    planType: {
        type: DataTypes.ENUM('monthly', 'yearly'),
        allowNull: false,
    },

    // ✅ NEW COLUMNS ADDED
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },

    currency: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: 'USD',
    },

    transactionId: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    productId: {
        type: DataTypes.STRING,
        allowNull: false,
    },

    purchaseToken: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true,
    },

    autoRenewEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: true,
    },

    lastVerifiedAt: {
        type: DataTypes.DATE,
        allowNull: true,
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

    deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },

}, {
    tableName: 'subscriptions',
    timestamps: true,
    paranoid: true,
});

// Relationship
// Subscription.belongsTo(User, { foreignKey: 'uid', as: 'User' });

module.exports = Subscription;
