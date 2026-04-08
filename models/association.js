// const User = require('./User');
// const ReferralUser = require('./ReferralUser');
// const Subscription = require('./Subscription');
// const Points = require('./Points'); // redeem_history model


// User.hasMany(Points, {
//     foreignKey: 'uid',
//     as: 'RedeemHistory',
// });

// // 🔹 Referral Manager belongs to User
// ReferralUser.belongsTo(User, {
//   foreignKey: 'userId',
//   targetKey: 'id',
//   as: 'agentUser'
// });

// // 🔹 User self reference (referrals)
// User.hasMany(User, {
//   foreignKey: 'referredUid',
//   sourceKey: 'id',
//   as: 'referredUsers'
// });


// User.hasMany(Subscription, { 
//   foreignKey: 'uid',   
//   as: 'Subscription'
// });

// Subscription.belongsTo(User, { 
//   foreignKey: 'uid'    
// });


// module.exports = {
//   User,
//   ReferralUser,
//   Points,
//   Subscription
// };


const User = require('./User');
const ReferralUser = require('./ReferralUser');
const Subscription = require('./Subscription');
const Points = require('./Points'); 
const RedeemHistory = require('./RedeemHistory'); 

// User → Points
// Already defined in Points.js, can skip here

// ReferralUser → Users (users referred by this manager)
ReferralUser.hasMany(User, {
  foreignKey: 'referredUid',
  as: 'Users',
});

// User self-reference (referral chains)
User.hasMany(User, {
  foreignKey: 'referredUid',
  sourceKey: 'id',
  as: 'referredUsers',
});

// Subscription associations already defined in User.js and Subscription.js


// ------------------- NEW ASSOCIATIONS -------------------
// RedeemHistory → ReferralUser
RedeemHistory.belongsTo(ReferralUser, {
  foreignKey: 'uid',   // redeem_history.uid
  targetKey: 'id',     // referral_users.id
  as: 'redeemUser',    // UNIQUE alias for this association
});

// ReferralUser → RedeemHistory
ReferralUser.hasMany(RedeemHistory, {
  foreignKey: 'uid',
  sourceKey: 'id',
  as: 'redeemRequests', // can stay as is
});
// ---------------------------------------------------------

module.exports = {
  User,
  ReferralUser,
  Points,
  RedeemHistory,
  Subscription
};