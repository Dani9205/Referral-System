const User = require('../models/User');
const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription.js');
const Coupon = require('../models/Coupon');
const Points = require('../models/Points'); 
const RedeemHistory = require('../models/RedeemHistory');
const Discount = require('../models/Discount');
const AppLinks = require('../models/AppLinks');
const ReferralUser = require('../models/ReferralUser.js');
const ReferralDiscounts = require('../models/ReferralDiscounts'); 
const { Sequelize, Op } = require('sequelize');
const moment = require('moment'); // For better date control


const getReferralDetails = async (req, res) => {
  try {
    const {
      uid
    } = req.body; // Get UID from request parameters
    const currentDate = new Date();

    // Get the start of the week and month
    const startOfWeek = new Date();
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    // Fetch referred users
    const referredUsers = await User.findAll({
      where: {
        referredUid: uid
      },
      include: [{
        model: Subscription,
        as: 'Subscriptions', // Include subscriptions
      },],
    });

    // Initialize metrics
    const metrics = {
      freeUsers: {
        total: 0,
        thisMonth: 0,
        thisWeek: 0,
        revenue: 0
      },
      monthlyTrialUsers: {
        total: 0,
        thisMonth: 0,
        thisWeek: 0,
        revenue: 0
      },
      monthlySubscribedUsers: {
        total: 0,
        thisMonth: 0,
        thisWeek: 0,
        revenue: 0
      },
      monthlyCanceledUsers: {
        total: 0,
        thisMonth: 0,
        thisWeek: 0,
        revenue: 0
      },
      yearlyTrialUsers: {
        total: 0,
        thisMonth: 0,
        thisWeek: 0,
        revenue: 0
      },
      yearlySubscribedUsers: {
        total: 0,
        thisMonth: 0,
        thisWeek: 0,
        revenue: 0
      },
      yearlyCanceledUsers: {
        total: 0,
        thisMonth: 0,
        thisWeek: 0,
        revenue: 0
      },
      // Subtotals for monthly and yearly
      monthlyTotal: {
        total: 0,
        thisMonth: 0,
        thisWeek: 0,
        revenue: 0
      },
      yearlyTotal: {
        total: 0,
        thisMonth: 0,
        thisWeek: 0,
        revenue: 0
      },
    };

    // Process referred users
    for (const user of referredUsers) {
      const userCreatedDate = new Date(user.createdAt);

      // Count free users (no subscriptions)
      // if (!user.Subscriptions.length) {
      //   metrics.freeUsers.total++;
      //   if (userCreatedDate >= startOfMonth) metrics.freeUsers.thisMonth++;
      //   if (userCreatedDate >= startOfWeek) metrics.freeUsers.thisWeek++;
      //   continue; // Skip subscription checks for free users
      // }


       const subs = user.Subscriptions || [];
      // const hasActiveSubscription = subs.some(sub => {
      // return sub.status === 'active' && new Date(sub.endDate) >= currentDate;
      // });
      // if (!subs.length || !hasActiveSubscription) {
      // metrics.freeUsers.total++;
      // if (userCreatedDate >= startOfMonth) metrics.freeUsers.thisMonth++;
      // if (userCreatedDate >= startOfWeek) metrics.freeUsers.thisWeek++;
      // }
    const isFreeUser = !subs.some(sub => {
    const subEndDate = new Date(sub.endDate);
    return ["active", "trial", "canceled"].includes(sub.status) && subEndDate >= currentDate;
    });
    if (isFreeUser) {
    metrics.freeUsers.total++;
    if (userCreatedDate >= startOfMonth) metrics.freeUsers.thisMonth++;
    if (userCreatedDate >= startOfWeek) metrics.freeUsers.thisWeek++;
    }

      // Process subscriptions
      for (const subscription of user.Subscriptions) {
        const {
          status,
          planType
        } = subscription;
        const subscriptionCreatedDate = new Date(subscription.createdAt);

        // Monthly Subscriptions
        if (planType === 'monthly') {
          if (status === 'trial') {
            metrics.monthlyTrialUsers.total++;
            if (subscriptionCreatedDate >= startOfMonth) metrics.monthlyTrialUsers.thisMonth++;
            if (subscriptionCreatedDate >= startOfWeek) metrics.monthlyTrialUsers.thisWeek++;
          } else if (status === 'active') {
            metrics.monthlySubscribedUsers.total++;
            if (subscriptionCreatedDate >= startOfMonth) metrics.monthlySubscribedUsers.thisMonth++;
            if (subscriptionCreatedDate >= startOfWeek) metrics.monthlySubscribedUsers.thisWeek++;
          } else if (status === 'canceled') {
            metrics.monthlyCanceledUsers.total++;
            if (subscriptionCreatedDate >= startOfMonth) metrics.monthlyCanceledUsers.thisMonth++;
            if (subscriptionCreatedDate >= startOfWeek) metrics.monthlyCanceledUsers.thisWeek++;
          }

          // Add to monthly subtotal
          metrics.monthlyTotal.total++;
          if (subscriptionCreatedDate >= startOfMonth) metrics.monthlyTotal.thisMonth++;
          if (subscriptionCreatedDate >= startOfWeek) metrics.monthlyTotal.thisWeek++;
        }

        // Yearly Subscriptions
        if (planType === 'yearly') {
          if (status === 'trial') {
            metrics.yearlyTrialUsers.total++;
            if (subscriptionCreatedDate >= startOfMonth) metrics.yearlyTrialUsers.thisMonth++;
            if (subscriptionCreatedDate >= startOfWeek) metrics.yearlyTrialUsers.thisWeek++;
          } else if (status === 'active') {
            metrics.yearlySubscribedUsers.total++;
            if (subscriptionCreatedDate >= startOfMonth) metrics.yearlySubscribedUsers.thisMonth++;
            if (subscriptionCreatedDate >= startOfWeek) metrics.yearlySubscribedUsers.thisWeek++;
          } else if (status === 'canceled') {
            metrics.yearlyCanceledUsers.total++;
            if (subscriptionCreatedDate >= startOfMonth) metrics.yearlyCanceledUsers.thisMonth++;
            if (subscriptionCreatedDate >= startOfWeek) metrics.yearlyCanceledUsers.thisWeek++;
          }

          // Add to yearly subtotal
          metrics.yearlyTotal.total++;
          if (subscriptionCreatedDate >= startOfMonth) metrics.yearlyTotal.thisMonth++;
          if (subscriptionCreatedDate >= startOfWeek) metrics.yearlyTotal.thisWeek++;
        }

        // Fetch payments and calculate revenue
        const payments = await Payment.findAll({
          where: {
            subscriptionId: subscription.id,
            status: 'completed',
          },
        });

        for (const payment of payments) {
          if (planType === 'monthly') {
            if (status === 'trial') metrics.monthlyTrialUsers.revenue += payment.amount;
            if (status === 'active') metrics.monthlySubscribedUsers.revenue += payment.amount;
            if (status === 'canceled') metrics.monthlyCanceledUsers.revenue += payment.amount;
            metrics.monthlyTotal.revenue += payment.amount; // Add to monthly subtotal
          } else if (planType === 'yearly') {
            if (status === 'trial') metrics.yearlyTrialUsers.revenue += payment.amount;
            if (status === 'active') metrics.yearlySubscribedUsers.revenue += payment.amount;
            if (status === 'canceled') metrics.yearlyCanceledUsers.revenue += payment.amount;
            metrics.yearlyTotal.revenue += payment.amount; // Add to yearly subtotal
          }
        }
      }
    }

    // Return the response
    return res.status(200).json({
      success: true,
      message: 'Referral details fetched successfully.',
      data: metrics,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching referral details.',
    });
  }
};





// const VALID_STATUSES = ['trial', 'active', 'canceled']; // active is subscribed
// const VALID_TYPES = ['monthly', 'yearly'];
// const VALID_SORT_FIELDS = ['name', 'installDate', 'subscribedDate', 'clearanceDate', 'clearDate', 'cancelledDate'];

// const usersDetails = async (req, res) => {
//   try {
//     const { uid, type, status, sort, size = 10, page = 1 } = req.body;

//     // Validation (only if provided)
//     if (type && !VALID_TYPES.includes(type)) {
//       return res.status(400).json({
//         success: false,
//         message: `Invalid type. Allowed values: ${VALID_TYPES.join(', ')}`,
//       });
//     }

//     if (status && !VALID_STATUSES.includes(status)) {
//       return res.status(400).json({
//         success: false,
//         message: `Invalid status. Allowed values: ${VALID_STATUSES.join(', ')}`,
//       });
//     }

//     if (sort && !VALID_SORT_FIELDS.includes(sort)) {
//       return res.status(400).json({
//         success: false,
//         message: `Invalid sort field. Allowed values: ${VALID_SORT_FIELDS.join(', ')}`,
//       });
//     }

//     const offset = (page - 1) * size;
//     const limit = parseInt(size);

//     // Default sort
//     let sortField = 'name';
//     let sortByModel = User;
//     let sortOrder = 'ASC'; // default sort order

//     if (sort) {
//       switch (sort) {
//         case 'name':
//         case 'installDate':
//           sortField = sort === 'installDate' ? 'installedDate' : 'name';
//           sortByModel = User;
//           break;
//         case 'subscribedDate':
//           sortField = 'startDate';
//           sortByModel = Subscription;
//           break;
//         case 'clearanceDate':
//         case 'clearDate':
//           sortField = 'clearedDate';
//           sortByModel = Subscription;
//           break;
//         case 'cancelledDate':
//           sortField = 'canceledDate';
//           sortByModel = Subscription;
//           break;
//       }
//     }

//     const userFilter = { referredUid: uid };
//     const subscriptionFilter = {};
//     if (type) subscriptionFilter.planType = type;
//     if (status) subscriptionFilter.status = status;

//     const referredUsers = await User.findAndCountAll({
//       where: userFilter,
//       include: [
//         {
//           model: Subscription,
//           as: 'Subscriptions',
//           where: Object.keys(subscriptionFilter).length ? subscriptionFilter : undefined,
//           required: false,
//         }
//       ],
//       order: sortByModel === User
//         ? [[sortField, sortOrder]]
//         : [[{ model: Subscription, as: 'Subscriptions' }, sortField, sortOrder]],
//       limit,
//       offset
//     });

//     // Count logic (week/month/year)
//     const now = new Date();
//     const startOfWeek = new Date(now);
//     startOfWeek.setDate(now.getDate() - now.getDay());
//     const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
//     const startOfYear = new Date(now.getFullYear(), 0, 1);

//     let totalrevenue = 0;

//     const metrics = {
//       total: referredUsers.count,
//       thisWeek: 0,
//       thisMonth: 0,
//       thisYear: 0,
//       totalrevenue: 0, // New metric
//       data: referredUsers.rows,
//     };

//     referredUsers.rows.forEach(user => {
//       const date = new Date(user.installedDate);
//       if (date >= startOfWeek) metrics.thisWeek++;
//       if (date >= startOfMonth) metrics.thisMonth++;
//       if (date >= startOfYear) metrics.thisYear++;

//       // Convert string balance to float and add to total
//       const balance = parseFloat(user.balance || '0');
//       if (!isNaN(balance)) {
//         totalrevenue += balance;
//       }
//     });

//     metrics.totalrevenue = totalrevenue;

//     return res.status(200).json({
//       success: true,
//       message: 'Referral users fetched successfully',
//       metrics,
//       pagination: {
//         total: referredUsers.count,
//         page: parseInt(page),
//         size: parseInt(size),
//         totalPages: Math.ceil(referredUsers.count / size),
//       },
//     });

//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       success: false,
//       message: 'Something went wrong while fetching referral users',
//     });
//   }
// };

//get user details , monthly,yearly, trial , active, cancelled
const VALID_STATUSES = ['trial', 'active', 'canceled']; // active is subscribed
const VALID_TYPES = ['monthly', 'yearly'];
const VALID_SORT_FIELDS = ['name', 'installDate', 'subscribedDate', 'clearanceDate', 'clearDate', 'cancelledDate'];

const usersDetails = async (req, res) => {
  try {
    const { uid, type, status, sort, size = 10, page = 1 } = req.body;

    // Validation
    if (type && !VALID_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid type. Allowed values: ${VALID_TYPES.join(', ')}`,
      });
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${VALID_STATUSES.join(', ')}`,
      });
    }

    if (sort && !VALID_SORT_FIELDS.includes(sort)) {
      return res.status(400).json({
        success: false,
        message: `Invalid sort field. Allowed values: ${VALID_SORT_FIELDS.join(', ')}`,
      });
    }

    const offset = (page - 1) * size;
    const limit = parseInt(size);

    // Default sorting
    let sortField = 'name';
    let sortByModel = User;
    let sortOrder = 'ASC';

    if (sort) {
      switch (sort) {
        case 'name':
        case 'installDate':
          sortField = sort === 'installDate' ? 'installedDate' : 'name';
          sortByModel = User;
          break;
        case 'subscribedDate':
          sortField = 'startDate';
          sortByModel = Subscription;
          break;
        case 'clearanceDate':
        case 'clearDate':
          sortField = 'clearedDate';
          sortByModel = Subscription;
          break;
        case 'cancelledDate':
          sortField = 'canceledDate';
          sortByModel = Subscription;
          break;
      }
    }

    const userFilter = { referredUid: uid };
    const subscriptionFilter = {};
    if (type) subscriptionFilter.planType = type;
    if (status) subscriptionFilter.status = status;

    // Fetch users with subscriptions, fix count mismatch with distinct: true
    const referredUsers = await User.findAndCountAll({
      where: userFilter,
      // include: [
      //   {
      //     model: Subscription,
      //     as: 'Subscriptions',
      //     where: Object.keys(subscriptionFilter).length ? subscriptionFilter : undefined,
      //     required: false,
      //   },
      // ],
      include: [
  {
    model: Subscription,
    as: 'Subscriptions',
    where: {
      ...(type && { planType: type }),
      ...(status && { status: status }),
    },
    required: true, // ✅ ALWAYS true (INNER JOIN)
  },
],
      distinct: true, // ✅ fixes total count mismatch
      order:
        sortByModel === User
          ? [[sortField, sortOrder]]
          : [[{ model: Subscription, as: 'Subscriptions' }, sortField, sortOrder]],
      limit,
      offset,
    });

    // Count metrics (week/month/year)
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    let totalrevenue = 0;

    const metrics = {
      total: referredUsers.count,
      thisWeek: 0,
      thisMonth: 0,
      thisYear: 0,
      totalrevenue: 0,
      data: referredUsers.rows,
    };

    referredUsers.rows.forEach((user) => {
      const date = new Date(user.installedDate);
      if (date >= startOfWeek) metrics.thisWeek++;
      if (date >= startOfMonth) metrics.thisMonth++;
      if (date >= startOfYear) metrics.thisYear++;

      const balance = parseFloat(user.balance || '0');
      if (!isNaN(balance)) {
        totalrevenue += balance;
      }
    });

    metrics.totalrevenue = totalrevenue;

    return res.status(200).json({
      success: true,
      message: 'Referral users fetched successfully',
      metrics,
      pagination: {
        total: referredUsers.count,
        page: parseInt(page),
        size: parseInt(size),
        totalPages: Math.ceil(referredUsers.count / size),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while fetching referral users',
    });
  }
};



// const usersDetails = async (req, res) => {
//     try {
//         const {
//             uid
//         } = req.body; // Get UID from request parameters
//         const currentDate = new Date();

//         // Get the start of the week and month
//         const startOfWeek = new Date();
//         startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
//         const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

//         // Fetch referred users
//         const referredUsers = await User.findAll({
//             where: {
//                 referredUid: uid
//             },
//             include: [{
//                 model: Subscription,
//                 as: 'Subscriptions', // Include subscriptions
//             }, ],
//         });

//         // Initialize metrics
//         const metrics = {
//             freeUsers: {
//                 total: 0,
//                 thisMonth: 0,
//                 thisWeek: 0,
//                 revenue: 0,
//                 data: []
//             },
//             monthlyTrialUsers: {
//                 total: 0,
//                 thisMonth: 0,
//                 thisWeek: 0,
//                 revenue: 0,
//                 data: []
//             },
//             monthlySubscribedUsers: {
//                 total: 0,
//                 thisMonth: 0,
//                 thisWeek: 0,
//                 revenue: 0,
//                 data: []
//             },
//             monthlyCanceledUsers: {
//                 total: 0,
//                 thisMonth: 0,
//                 thisWeek: 0,
//                 revenue: 0,
//                 data: []
//             },
//             yearlyTrialUsers: {
//                 total: 0,
//                 thisMonth: 0,
//                 thisWeek: 0,
//                 revenue: 0,
//                 data: []
//             },
//             yearlySubscribedUsers: {
//                 total: 0,
//                 thisMonth: 0,
//                 thisWeek: 0,
//                 revenue: 0,
//                 data: []
//             },
//             yearlyCanceledUsers: {
//                 total: 0,
//                 thisMonth: 0,
//                 thisWeek: 0,
//                 revenue: 0,
//                 data: []
//             },
//         };

//         // Process referred users
//         for (const user of referredUsers) {
//             const userCreatedDate = new Date(user.createdAt);

//             // Count free users (no subscriptions)
//             if (!user.Subscriptions.length) {
//                 metrics.freeUsers.total++;
//                 if (userCreatedDate >= startOfMonth) metrics.freeUsers.thisMonth++;
//                 if (userCreatedDate >= startOfWeek) metrics.freeUsers.thisWeek++;
//                 metrics.freeUsers.data.push(user);
//                 continue; // Skip subscription checks for free users
//             }

//             // Process subscriptions
//             for (const subscription of user.Subscriptions) {
//                 const {
//                     status,
//                     planType
//                 } = subscription;
//                 const subscriptionCreatedDate = new Date(subscription.createdAt);

//                 // Monthly Subscriptions
//                 if (planType === 'monthly') {
//                     if (status === 'trial') {
//                         metrics.monthlyTrialUsers.total++;
//                         if (subscriptionCreatedDate >= startOfMonth) metrics.monthlyTrialUsers.thisMonth++;
//                         if (subscriptionCreatedDate >= startOfWeek) metrics.monthlyTrialUsers.thisWeek++;
//                         metrics.monthlyTrialUsers.data.push({
//                             user,
//                             subscription
//                         });
//                     } else if (status === 'active') {
//                         metrics.monthlySubscribedUsers.total++;
//                         if (subscriptionCreatedDate >= startOfMonth) metrics.monthlySubscribedUsers.thisMonth++;
//                         if (subscriptionCreatedDate >= startOfWeek) metrics.monthlySubscribedUsers.thisWeek++;
//                         metrics.monthlySubscribedUsers.data.push({
//                             user,
//                             subscription
//                         });
//                     } else if (status === 'canceled') {
//                         metrics.monthlyCanceledUsers.total++;
//                         if (subscriptionCreatedDate >= startOfMonth) metrics.monthlyCanceledUsers.thisMonth++;
//                         if (subscriptionCreatedDate >= startOfWeek) metrics.monthlyCanceledUsers.thisWeek++;
//                         metrics.monthlyCanceledUsers.data.push({
//                             user,
//                             subscription
//                         });
//                     }
//                 }

//                 // Yearly Subscriptions
//                 if (planType === 'yearly') {
//                     if (status === 'trial') {
//                         metrics.yearlyTrialUsers.total++;
//                         if (subscriptionCreatedDate >= startOfMonth) metrics.yearlyTrialUsers.thisMonth++;
//                         if (subscriptionCreatedDate >= startOfWeek) metrics.yearlyTrialUsers.thisWeek++;
//                         metrics.yearlyTrialUsers.data.push({
//                             user,
//                             subscription
//                         });
//                     } else if (status === 'active') {
//                         metrics.yearlySubscribedUsers.total++;
//                         if (subscriptionCreatedDate >= startOfMonth) metrics.yearlySubscribedUsers.thisMonth++;
//                         if (subscriptionCreatedDate >= startOfWeek) metrics.yearlySubscribedUsers.thisWeek++;
//                         metrics.yearlySubscribedUsers.data.push({
//                             user,
//                             subscription
//                         });
//                     } else if (status === 'canceled') {
//                         metrics.yearlyCanceledUsers.total++;
//                         if (subscriptionCreatedDate >= startOfMonth) metrics.yearlyCanceledUsers.thisMonth++;
//                         if (subscriptionCreatedDate >= startOfWeek) metrics.yearlyCanceledUsers.thisWeek++;
//                         metrics.yearlyCanceledUsers.data.push({
//                             user,
//                             subscription
//                         });
//                     }
//                 }

//                 // Fetch payments and calculate revenue
//                 const payments = await Payment.findAll({
//                     where: {
//                         subscriptionId: subscription.id,
//                         status: 'completed',
//                     },
//                 });

//                 for (const payment of payments) {
//                     if (planType === 'monthly') {
//                         if (status === 'trial') metrics.monthlyTrialUsers.revenue += payment.amount;
//                         if (status === 'active') metrics.monthlySubscribedUsers.revenue += payment.amount;
//                         if (status === 'canceled') metrics.monthlyCanceledUsers.revenue += payment.amount;
//                     } else if (planType === 'yearly') {
//                         if (status === 'trial') metrics.yearlyTrialUsers.revenue += payment.amount;
//                         if (status === 'active') metrics.yearlySubscribedUsers.revenue += payment.amount;
//                         if (status === 'canceled') metrics.yearlyCanceledUsers.revenue += payment.amount;
//                     }
//                 }
//             }
//         }

//         // Return the response
//         return res.status(200).json({
//             success: true,
//             message: 'Referral details fetched successfully.',
//             data: metrics,
//         });
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({
//             success: false,
//             message: 'Error fetching referral details.',
//         });
//     }
// };

const getFreeUsers = async (req, res) => {
  const uid = req.query.uid;
  const sortBy = req.query.sort || 'createdAt';
  const order = req.query.order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  const page = parseInt(req.query.page) || 1;
  const size = parseInt(req.query.size) || 10;
  const currentDate = new Date();

  try {
    const users = await User.findAll({
      where: { referredUid: uid },
      include: [{
        model: Subscription,
        as: 'Subscriptions',
        required: false,
      }],
    });

    const freeUsersList = [];
    const thisMonthStart = moment().startOf('month').toDate();
    const thisWeekStart = moment().startOf('week').toDate();

    // ✅ Free-user stats (what you want)
    let totalFreeUsers = 0;
    let thisMonthFreeUsers = 0;
    let thisWeekFreeUsers = 0;

    for (const user of users) {
      const createdAt = new Date(user.createdAt);
      const subs = user.Subscriptions || [];

      let isFree = false;

      // if (!subs.length) {
      //   isFree = true;
      // } else {
      //   const allExpired = subs.every(sub => {
      //     const isExpired = new Date(sub.endDate) < currentDate;

      //     if (isExpired && sub.status !== 'expired') {
      //       sub.status = 'expired';
      //       sub.save(); // (optional: await sub.save())
      //     }

      //     return isExpired;
      //   });

      //   if (allExpired) isFree = true;
      // }
      const hasActiveSub = subs.some(sub => {
  const subEndDate = new Date(sub.endDate);
  return ['active', 'trial', 'canceled'].includes(sub.status) && subEndDate >= currentDate;
});

if (!hasActiveSub) {
  isFree = true;
}

      if (isFree) {
        freeUsersList.push(user);

        // ✅ Count only free users
        totalFreeUsers++;
        if (createdAt >= thisMonthStart) thisMonthFreeUsers++;
        if (createdAt >= thisWeekStart) thisWeekFreeUsers++;
      }
    }

    // 🔁 Sort Logic
    freeUsersList.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy.toLowerCase().includes('date')) {
        aVal = aVal ? new Date(aVal) : null;
        bVal = bVal ? new Date(bVal) : null;
      }

      if (!aVal && !bVal) return 0;
      if (!aVal) return order === 'ASC' ? 1 : -1;
      if (!bVal) return order === 'ASC' ? -1 : 1;

      if (typeof aVal === 'string') {
        return order === 'ASC'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return order === 'ASC' ? aVal - bVal : bVal - aVal;
    });

    // 🔁 Pagination
    const offset = (page - 1) * size;
    const paginatedFreeUsers = freeUsersList.slice(offset, offset + size);

    return res.status(200).json({
      success: true,
      message: "Free users fetched successfully.",
      pagination: {
        totalRecords: freeUsersList.length,
        currentPage: page,
        perPage: size,
        totalPages: Math.ceil(freeUsersList.length / size),
      },
      data: {
        freeUsers: paginatedFreeUsers,
        stats: {
          totalUsers: totalFreeUsers,       // ✅ now total FREE users
          thisMonthUsers: thisMonthFreeUsers,
          thisWeekUsers: thisWeekFreeUsers,
          revenue: 0,
        }
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching free users',
    });
  }
};










//get all free users original
// const getAllFreeUsers = async (req, res) => {
//   try {
//     const currentDate = new Date();
//     const { filterBy } = req.body; // Extract filterBy from request body

//     // Define default where and order clauses
//     let whereClause = { type: 'user' }; // Default filter for all queries
//     let orderClause = []; // For sorting users based on filters

//     // Define date ranges for filtering
//     const lastMonth = new Date();
//     lastMonth.setMonth(lastMonth.getMonth() - 1);

//     const lastWeek = new Date();
//     lastWeek.setDate(lastWeek.getDate() - 7);

//     // Handle different filter types
//     switch (filterBy) {
//       case 'dateTime':
//         orderClause.push(['createdAt', 'ASC']);
//         break;

//       case 'monthlyUsers':
//         whereClause.createdAt = { [Op.gte]: lastMonth };
//         break;

//       case 'weeklyUsers':
//         whereClause.createdAt = { [Op.gte]: lastWeek };
//         break;

//       case 'totalSales':
//         orderClause.push(['referredUid', 'DESC']);
//         break;

//       case 'monthlySales':
//         whereClause.createdAt = { [Op.gte]: lastMonth };
//         orderClause.push(['referredUid', 'DESC']);
//         break;

//       case 'weeklySales':
//         whereClause.createdAt = { [Op.gte]: lastWeek };
//         orderClause.push(['referredUid', 'DESC']);
//         break;

//       case 'activeUsers':
//         return getActiveUsers(req, res);

//       default:
//         orderClause.push(['balance', 'DESC']);
//         break;
//     }

//     // Fetch users and their subscriptions based on filters
//     const users = await User.findAll({
//       where: whereClause,
//       include: [
//         {
//           model: Subscription,
//           as: 'Subscriptions',
//           required: false,
//         },
//       ],
//       order: orderClause,
//     });

//     // Total fetched users count (NEW)
//     const totalFetchedUsers = users.length;

//     // Filter users who qualify as free users
//     const freeUsersList = users.filter(user => {
//       return (
//         !user.Subscriptions.length ||
//         user.Subscriptions.every(sub => sub.endDate < currentDate)
//       );
//     });

//     // Count of free users
//     const freeUsersCount = freeUsersList.length;

//     return res.status(200).json({
//       success: true,
//       message: "Free users fetched successfully.",
//       totalFetchedUsers, // NEW
//       data: {
//         freeUsers: freeUsersList,
//         usersCount: freeUsersCount,
//       },
//     });
//   } catch (error) {
//     console.error('Error fetching free users:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Error fetching free users',
//     });
//   }
// };


// //get all free users updated
const getAllFreeUsers = async (req, res) => {
  try {
    const { filterBy } = req.body;
    const currentDate = new Date();

    let whereClause = { type: 'user' };
    let orderClause = [];

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    switch (filterBy) {
      case 'dateTime':
        orderClause.push(['createdAt', 'ASC']);
        break;

      case 'monthlyUsers':
        whereClause.createdAt = { [Op.gte]: lastMonth };
        break;

      case 'weeklyUsers':
        whereClause.createdAt = { [Op.gte]: lastWeek };
        break;

      default:
        orderClause.push(['createdAt', 'DESC']);
        break;
    }

    // Include subscription columns
    const users = await User.findAll({
      where: whereClause,
      include: [
        {
          model: Subscription,
          as: 'Subscriptions',
          attributes: ['id', 'status', 'endDate', 'createdAt'],
          required: false
        }
      ],
      order: orderClause
    });

    // Map users to calculate final status based on last subscription **that ended**
    const freeUsers = users
      .map(user => {
        const subscriptions = user.Subscriptions || [];

        if (subscriptions.length === 0) {
          // User never had a subscription → free
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
            status: 'Free'
          };
        }

        // Sort by createdAt descending to get last subscription
        const lastSub = subscriptions.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        )[0];

        // Only include if last subscription has actually ended
        if (lastSub.endDate >= currentDate) {
          // Last subscription is still active → skip user
          return null;
        }

        // Last subscription ended → mark expired
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          status: lastSub.status === 'trial' ? 'expired' : 'expired'
        };
      })
      .filter(u => u !== null); // remove users with active subscriptions

    return res.status(200).json({
      success: true,
      message: 'Free Users Fetched Successfully',
      count: freeUsers.length,
      data: freeUsers
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};












const getActiveSubscriptionUsers = async (req, res) => {
  try {
    const currentDate = new Date();

    const activeUsers = await User.findAll({
      include: [{
        model: Subscription,
        as: 'Subscriptions', // Use the alias defined in the association
        required: true, // Only include users with subscriptions
        where: {
          status: {
            [Op.ne]: 'trial', // Exclude subscriptions with status 'trial'
          },
          endDate: {
            [Op.gt]: currentDate, // Only include subscriptions with endDate > current date
          },
        },
      },],
    });

    return res.status(200).json({
      success: true,
      message: "Subscribed users get successfully.",
      data: activeUsers,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching active subscription users',
    });
  }
};






//get all trial users original
// const getTrialSubscriptionUsers = async (req, res) => {
//   try {
//     const currentDate = new Date();

//     const trialUsers = await User.findAll({
//       include: [{
//         model: Subscription,
//         as: 'Subscriptions', // Use the alias defined in the association
//         required: true, // Only include users with subscriptions
//         where: {
//           status: 'trial', // Include only trial subscriptions
//           endDate: {
//             [Op.gt]: currentDate, // Only include subscriptions with endDate > current date
//           },
//         },
//       },],
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Trial subscription user get successfully.",
//       data: trialUsers,
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       success: false,
//       message: 'Error fetching trial subscription users',
//     });
//   }
// };     

// get all trial users updated
const getTrialSubscriptionUsers = async (req, res) => {
  try {
    const currentDate = new Date();
    const { filterBy } = req.body;

    let whereClause = { type: 'user' };
    let orderClause = [];

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    // 🔹 FILTER LOGIC (same as Free / Premium APIs)
    switch (filterBy) {
      case 'dateTime':
        orderClause.push(['createdAt', 'ASC']);
        break;
      case 'monthlyUsers':
        whereClause.createdAt = { [Op.gte]: lastMonth };
        break;
      case 'weeklyUsers':
        whereClause.createdAt = { [Op.gte]: lastWeek };
        break;
      default:
        orderClause.push(['createdAt', 'DESC']);
        break;
    }

    // 🔹 Fetch users with trial subscriptions
    const trialUsers = await User.findAll({
      where: whereClause,
      include: [
        {
          model: Subscription,
          as: 'Subscriptions',
          attributes: ['status', 'startDate', 'endDate', 'createdAt'], // include createdAt
          required: true,
          where: {
            status: 'trial',
            endDate: { [Op.gte]: currentDate }, // only active trial
          },
        },
      ],
      distinct: true,
      col: 'User.id',
      order: orderClause,
    });

    // 🔹 Map users to include status based on last added trial
    const formattedUsers = trialUsers.map(user => {
      const subscriptions = user.Subscriptions || [];

      // Get last added trial subscription
      const lastTrial = subscriptions.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      )[0];

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        status: lastTrial ? 'trial' : 'unknown',
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Trial users fetched successfully.',
      count: formattedUsers.length,
      data: formattedUsers,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};












// Utility to generate a random 8-character alphanumeric coupon
const generateCouponCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Add a new coupon
const addCoupon = async (req, res) => {
  try {
    const { points, userId, type } = req.body;

    // Validate the input
    if (!points || !userId || !type) {
      return res.status(400).json({
        success: false,
        message: 'Points, type, and userId are required',
      });
    }

    // Fetch the user's points record
    const userPoints = await Points.findOne({ where: { uid: userId } });
    if (!userPoints) {
      return res.status(404).json({
        success: false,
        message: 'User points record not found',
      });
    }

    // Check if the user has enough active points
    if (userPoints.active < points) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient active points to create the coupon',
      });
    }

    // Calculate the expiry date based on type
    const currentDate = new Date();
    let expiryDate = new Date(currentDate);
    if (type === 'monthly') {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    } else if (type === 'yearly') {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid coupon type. Must be "monthly" or "yearly".',
      });
    }

    // Generate a unique coupon code
    let coupon;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      coupon = generateCouponCode();
      const existing = await Coupon.findOne({ where: { coupon } });
      if (!existing) break; // Unique
      attempts++;
    }

    if (attempts === maxAttempts) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate a unique coupon code',
      });
    }

    // Deduct points and update user's points record
    userPoints.active -= points;
    userPoints.coupons += points;
    await userPoints.save();

    // Add the coupon to the database
    const status = 'redeemed';
    const newCoupon = await Coupon.create({
      coupon,
      points,
      status,
      type,
      expiryDate,
      uid: userId,
    });

    return res.status(201).json({
      success: true,
      message: 'Coupon generated and added successfully',
      data: {
        coupon: newCoupon,
        updatedPoints: userPoints,
      },
    });
  } catch (error) {
    console.error('Error adding coupon:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to add coupon',
    });
  }
};

// Fetch coupons by UID with sorting, ordering, and pagination
const fetchCouponsByUid = async (req, res) => {
  try {
    const uid = req.query.uid;
    const allowedSortFields = ['coupon', 'status', 'createdAt', 'type'];
    const sortBy = allowedSortFields.includes(req.query.sort) ? req.query.sort : 'createdAt';
    const order = req.query.order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || 10;

    // Validate input
    if (!uid) {
      return res.status(400).json({
        success: false,
        message: 'UID is required.',
      });
    }

    const offset = (page - 1) * size;

    const { count, rows: coupons } = await Coupon.findAndCountAll({
      where: { uid },
      order: [[sortBy, order]],
      limit: size,
      offset,
    });

    return res.status(200).json({
      success: true,
      message: coupons.length ? 'Coupons fetched successfully.' : 'No coupons found for this UID.',
      data: coupons,
      pagination: {
        total: count,
        page,
        size,
        pages: Math.ceil(count / size),
      }
    });
  } catch (error) {
    console.error('Error fetching coupons:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch coupons.',
    });
  }
};



// Redeem points for a user
const redeemPoints = async (req, res) => {
  try {
    const {
      uid,
      points
    } = req.body;

    // Input validation
    if (!uid || !points || points <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid UID and points are required.',
      });
    }

    // Fetch user's points record
    const userPoints = await Points.findOne({
      where: {
        uid
      }
    });

    if (!userPoints) {
      return res.status(404).json({
        success: false,
        message: 'User points record not found.',
      });
    }

    // Check if user has enough active points to redeem
    if (userPoints.active < points) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient active points to redeem.',
      });
    }

    // Deduct points from active
    userPoints.active -= points;

    // Add the redeemed points to total and redeemed
    userPoints.redeemed = (userPoints.redeemed || 0) + points;
    userPoints.total = userPoints.total + points; // Update total points

    // Mark status as 'successful'
    userPoints.status = 'successful';

    // Save changes to Points table 
    await userPoints.save();

    // Add entry to RedeemHistory table
    await RedeemHistory.create({
      uid: uid,
      points: points,
    });

    // Success response
    return res.status(200).json({
      success: true,
      message: 'Points redeemed successfully.',
      data: {
        updatedPoints: userPoints,
      },
    });
  } catch (error) {
    console.error('Error redeeming points:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      message: 'Failed to redeem points.',
    });
  }
};

const fetchRedeemHistoryByUid = async (req, res) => {
  const uid = req.query.uid;
  const sortBy = req.query.sortBy || 'createdAt';
  const order = req.query.order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  const page = parseInt(req.query.page) || 1;
  const size = parseInt(req.query.size) || 10;

  try {
    const allUsers = await User.findAll({
      where: { referredUid: uid },
      include: [{
        model: Subscription,
        as: 'Subscriptions',
        required: false,
        // ✅ Fetch full subscription data
      }],
    });

    // Sorting logic
    allUsers.sort((a, b) => {
      let aVal, bVal;

      if (sortBy === 'subscribedDate') {
        aVal = a.Subscriptions[0]?.startDate ? new Date(a.Subscriptions[0].startDate) : null;
        bVal = b.Subscriptions[0]?.startDate ? new Date(b.Subscriptions[0].startDate) : null;
      } else {
        aVal = a[sortBy];
        bVal = b[sortBy];

        // Fix for installedDate or date fields stored as string
        if (sortBy.toLowerCase().includes('date')) {
          aVal = aVal ? new Date(aVal) : null;
          bVal = bVal ? new Date(bVal) : null;
        }
      }

      if (!aVal && !bVal) return 0;
      if (!aVal) return order === 'ASC' ? 1 : -1;
      if (!bVal) return order === 'ASC' ? -1 : 1;

      if (typeof aVal === 'string') {
        return order === 'ASC'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return order === 'ASC' ? aVal - bVal : bVal - aVal;
    });

    // Pagination
    const offset = (page - 1) * size;
    const paginatedUsers = allUsers.slice(offset, offset + size);

    return res.status(200).json({
      success: true,
      message: "User points fetched successfully.",
      pagination: {
        totalRecords: allUsers.length,
        currentPage: page,
        perPage: size,
        totalPages: Math.ceil(allUsers.length / size),
      },
      data: paginatedUsers,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching user points',
    });
  }
};


// Fetch redeem history with sorting, ordering, and pagination
const redeemHistory = async (req, res) => {
  try {
    const uid = req.query.uid;
    const validSortFields = ['createdAt', 'approvedDate', 'points', 'status'];
    const sortBy = validSortFields.includes(req.query.sort) ? req.query.sort : 'createdAt';
    const order = req.query.order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || 10;

    // Validate input
    if (!uid) {
      return res.status(400).json({
        success: false,
        message: 'UID is required.',
      });
    }

    // Calculate offset for pagination
    const offset = (page - 1) * size;

    // Fetch redeem history with sorting, ordering, and pagination
    const { count, rows: users } = await RedeemHistory.findAndCountAll({
      where: { uid },
      order: [[sortBy, order]],
      limit: size,
      offset: offset,
    });

    // Handle no records found
    if (!users.length) {
      return res.status(200).json({
        success: true,
        message: 'No redeem history found for the given UID.',
        data: [],
        pagination: {
          total: 0,
          page,
          size,
          pages: 0,
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User redeem history retrieved successfully.',
      data: users,
      pagination: {
        total: count,
        page,
        size,
        pages: Math.ceil(count / size),
      }
    });
  } catch (error) {
    console.error('Error fetching redeem history:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      message: 'Error fetching user redeem history.',
    });
  }
};




const reward = async (req, res) => {
  try {
    const { uid } = req.body;

    if (!uid) {
      return res.status(400).json({
        success: false,
        message: 'UID is required.',
      });
    }

    const reward = await Points.findOne({ where: { uid } });

    const user = await ReferralUser.findByPk(uid); // ✅ Corrected here

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found for this UID.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Reward and user details fetched successfully.',
      data: {
        reward,
        user,
      },
    });

  } catch (error) {
    console.error('Error fetching reward history:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch reward history.',
    });
  }
};






// Fetch all discount
const allDiscounts = async (req, res) => {
  try {
    const discounts = await Discount.findAll(); // Fetch all records from the discount table
    res.status(200).json({
      success: true,
      message: "Discounts fetched successfully.",
      data: discounts,
    });
  } catch (error) {
    console.error('Error fetching discounts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch discounts',
    });
  }
};

// Logout User
const logoutUser = async (req, res) => {
  try {
    const uid = req.uid;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Logout successful.'
    });
  } catch (error) {
    console.error('Logout Error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed.',
      error: error.message
    });
  }
};




//old
// const getCounts = async (req, res) => {
//   try {
//     const uid = parseInt(req.body.uid);

//     if (!uid) {
//       return res.status(401).json({
//         success: false,
//         message: 'Unauthorized: UID not found.',
//       });
//     }

//     // Free users (no active subscriptions)
//     const freeUsers = await User.findAll({
//       where: { referredUid: uid },
//       include: [
//         {
//           model: require('../models/Subscription'), // make sure this is properly imported
//           as: 'Subscriptions',
//           required: false,
//           where: { status: 'active' }
//         }
//       ]
//     });

//     const freeUsersCount = freeUsers.filter(user => user.Subscriptions.length === 0).length;

//     const monthlyUsersCount = await User.count({
//       where: { referredUid: uid },
//       include: [
//         {
//           model: require('../models/Subscription'),
//           as: 'Subscriptions',
//           required: true,
//           where: {
//             planType: 'monthly',
//             status: 'active'
//           }
//         }
//       ]
//     });

//     const yearlyUsersCount = await User.count({
//       where: { referredUid: uid },
//       include: [
//         {
//           model: require('../models/Subscription'),
//           as: 'Subscriptions',
//           required: true,
//           where: {
//             planType: 'yearly',
//             status: 'active'
//           }
//         }
//       ]
//     });

//     const points = await require('../models/Points').findOne({
//       where: { uid }
//     });

//     return res.status(200).json({
//       success: true,
//       message: 'User counts fetched successfully',
//       counts: {
//         points,
//         freeUsers: freeUsersCount,
//         monthlyPremium: monthlyUsersCount,
//         yearlyPremium: yearlyUsersCount
//       }
//     });

//   } catch (error) {
//     console.error('Count Error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to fetch user counts.',
//       error: error.message
//     });
//   }
// };


//get counts     //new code
const getCounts = async (req, res) => {
  try {
    const uid = parseInt(req.body.uid);

    if (!uid) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: UID not found.',
      });
    }

    // // -----------------------------------------------------------------------------//
    // // All referred users
    // // -------------------
    // const allReferredUsers = await User.findAll({
    //   where: { referredUid: uid },
    //   include: [
    //     {
    //       model: Subscription,
    //       as: 'Subscriptions',
    //       required: false,
    //       where: {
    //         status: 'active',
    //         planType: { [Op.not]: 'trial' } // ignore trial subscriptions
    //       }
    //     }
    //   ]
    // });

    // // -------------------
    // // Free users (no active subscription except trial)
    // // -------------------
    // const freeUsersCount = allReferredUsers.filter(user => 
    //   !user.Subscriptions || user.Subscriptions.length === 0
    // ).length;

    const allReferredUsers = await User.findAll({
  where: { referredUid: uid },
  include: [
    {
      model: Subscription,
      as: 'Subscriptions',
      required: false,
    }
  ]
});

const currentDate = new Date();

// ✅ FREE users (same as getFreeUsers API)
const freeUsersCount = allReferredUsers.filter(user => {
  const subs = user.Subscriptions || [];

  const hasActiveSub = subs.some(sub => {
    const subEndDate = new Date(sub.endDate);
    return ['active', 'trial', 'canceled'].includes(sub.status) 
           && subEndDate >= currentDate;
  });

  return !hasActiveSub;
}).length;
//--------------------------------------------------------------------------------------//
    // -------------------
    // Monthly premium users
    // -------------------
    // const monthlyUsersCount = allReferredUsers.filter(user =>
    //   user.Subscriptions && user.Subscriptions.some(sub => sub.planType === 'monthly' && sub.status === 'active')
    // ).length;

    const monthlyUsersCount = allReferredUsers.filter(user =>
  user.Subscriptions && user.Subscriptions.some(sub => {
    const subEndDate = new Date(sub.endDate);
    return sub.planType === 'monthly' &&
           sub.status === 'active' &&
           subEndDate >= currentDate;
  })
).length;

    // -----------------------------------------------------------------------------------//
    // Yearly premium users
    // -------------------
    // const yearlyUsersCount = allReferredUsers.filter(user =>
    //   user.Subscriptions && user.Subscriptions.some(sub => sub.planType === 'yearly' && sub.status === 'active')
    // ).length;
    const yearlyUsersCount = allReferredUsers.filter(user =>
  user.Subscriptions && user.Subscriptions.some(sub => {
    const subEndDate = new Date(sub.endDate);
    return sub.planType === 'yearly' &&
           sub.status === 'active' &&
           subEndDate >= currentDate;
  })
).length;

    // -----------------------------------------------------------------------------------//
    // Points (latest row)
    // -------------------
    const pointsRow = await Points.findOne({
      where: { uid },
      order: [['createdAt', 'DESC']]
    });

    const points = pointsRow ? pointsRow.toJSON() : {
      id: null,
      uid: uid.toString(),
      active: 0,
      total: 0,
      coupons: 0,
      redeemed: 0,
      createdAt: null,
      updatedAt: null
    };

    // -------------------
    // Response
    // -------------------
    return res.status(200).json({
      success: true,
      message: 'User counts fetched successfully',
      counts: {
        points,
        freeUsers: freeUsersCount,
        monthlyPremium: monthlyUsersCount,
        yearlyPremium: yearlyUsersCount
      }
    });

  } catch (error) {
    console.error('Count Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user counts.',
      error: error.message
    });
  }
};












// const appsLinks = async (req, res) => {
//   try {
//     // Correct way to fetch all AppLinks records
//     const links = await AppLinks.findAll();

//     return res.status(200).json({
//       success: true,
//       message: 'App links fetched successfully',
//       data: links
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: 'Error fetching app links',
//       error: error.message
//     });
//   }
// };

const appsLinks = async (req, res) => {
  try {
    const { id } = req.query;

    // Validate id
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'User id is required'
      });
    }

    // Fetch user by id
    const user = await ReferralUser.findOne({
      where: { id },
      attributes: [
        'id',
        'name',
        'androidAppReferralLink',
        'iosAppReferralLink',
        'createdAt',
        'updatedAt'
      ]
    });

    // If user not found
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Referral links fetched successfully',
      data: user
    });

  } catch (error) {
    console.error('Error fetching referral links:', error);

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};






const referralDiscounts = async (req, res) => {
  try {
    const discount = await ReferralDiscounts.findOne();

    return res.status(200).json({
      success: true,
      message: 'Referral discount settings fetched successfully',
      data: discount
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching referral discount settings',
      error: error.message
    });
  }
};









// New adding missing functions

// Active users helper
const getActiveUsers = async (req, res) => {
  try {
    const currentDate = new Date();

    // Fetch users with active subscriptions
    const users = await User.findAll({
      where: { type: 'user' }, // Filter only user type
      include: [
        {
          model: Subscription,
          as: 'Subscriptions',
          where: {
            endDate: { [Op.gte]: currentDate }, // Active subscriptions (not expired)
          },
          required: true, // Only include users with active subscriptions
        },
      ],
    });

    // Count active users
    const activeUsersCount = users.length;

    return res.status(200).json({
      success: true,
      message: "Active users fetched successfully.",
      data: {
        activeUsers: users,
        usersCount: activeUsersCount,
      },
    });
  } catch (error) {
    console.error('Error fetching active users:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching active users',
    });
  }
};





// get all premium users original
// const getPremiumUsers = async (req, res) => {
//   try {
//     const currentDate = new Date();
//     const { filterBy } = req.body; // Extract filterBy from request body

//     // Define default where and order clauses
//     let whereClause = { type: 'user' }; // Default filter for all queries
//     let orderClause = []; // For sorting users based on filters

//     // Define date ranges for filtering
//     const lastMonth = new Date();
//     lastMonth.setMonth(lastMonth.getMonth() - 1);

//     const lastWeek = new Date();
//     lastWeek.setDate(lastWeek.getDate() - 7);

//     // Handle different filter types
//     switch (filterBy) {
//       case 'dateTime':
//         orderClause.push(['createdAt', 'ASC']); // Sort users by createdAt
//         break;

//       case 'monthlyUsers':
//         whereClause.createdAt = { [Op.gte]: lastMonth }; // Users created last month
//         break;

//       case 'weeklyUsers':
//         whereClause.createdAt = { [Op.gte]: lastWeek }; // Users created last week
//         break;

//       case 'totalSales':
//         orderClause.push(['referredUid', 'DESC']); // Sort by referrals
//         break;

//       case 'monthlySales':
//         whereClause.createdAt = { [Op.gte]: lastMonth }; // Sales in the last month
//         orderClause.push(['referredUid', 'DESC']); // Sort by referrals
//         break;

//       case 'weeklySales':
//         whereClause.createdAt = { [Op.gte]: lastWeek }; // Sales in the last week
//         orderClause.push(['referredUid', 'DESC']); // Sort by referrals
//         break;

//       default:
//         orderClause.push(['balance', 'DESC']); // Default sorting by balance
//         break;
//     }

//     // Fetch only users with at least one active subscription
//     const users = await User.findAll({
//       where: whereClause,
//       include: [
//         {
//           model: Subscription,
//           as: 'Subscriptions', // Use the alias defined in the association
//           required: true, // Only include users with subscriptions
//           where: {
//             endDate: { [Op.gte]: currentDate }, // At least one active subscription
//           },
//         },
//       ],
//       order: orderClause, // Apply sorting based on filters
//     });

//     // Count of premium users
//     const premiumUsersCount = users.length;

//     return res.status(200).json({
//       success: true,
//       message: "Premium users fetched successfully.",
//       data: {
//         premiumUsers: users,
//         usersCount: premiumUsersCount,
//       },
//     });
//   } catch (error) {
//     console.error('Error fetching premium users:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Error fetching premium users',
//     });
//   }
// };





// get all premium users updated
const getPremiumUsers = async (req, res) => {
  try {
    const currentDate = new Date();
    const { filterBy } = req.body;

    let whereClause = { type: 'user' };
    let orderClause = [];

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    // 🔹 FILTER LOGIC
    switch (filterBy) {
      case 'dateTime':
        orderClause.push(['createdAt', 'ASC']);
        break;

      case 'monthlyUsers':
        whereClause.createdAt = { [Op.gte]: lastMonth };
        break;

      case 'weeklyUsers':
        whereClause.createdAt = { [Op.gte]: lastWeek };
        break;

      case 'totalSales':
        orderClause.push(['referredUid', 'DESC']);
        break;

      case 'monthlySales':
        whereClause.createdAt = { [Op.gte]: lastMonth };
        orderClause.push(['referredUid', 'DESC']);
        break;

      case 'weeklySales':
        whereClause.createdAt = { [Op.gte]: lastWeek };
        orderClause.push(['referredUid', 'DESC']);
        break;

      case 'downloads':
        orderClause.push(['installedDate', 'DESC']);
        break;

      default:
        orderClause.push(['createdAt', 'DESC']);
        break;
    }

    // 🔹 Fetch users with subscriptions
    const users = await User.findAll({
      where: whereClause,
      include: [
        {
          model: Subscription,
          as: 'Subscriptions',
          attributes: ['status', 'endDate', 'createdAt'], // include createdAt to sort
          required: true, // must have subscription
          where: {
            status: {
              [Op.in]: ['active', 'canceled']
            },
            endDate: {
              [Op.gte]: currentDate // only valid subscriptions
            }
          }
        }
      ],
      distinct: true,
      col: 'User.id',
      order: orderClause
    });

    // 🔹 Map users to add status field based on last added subscription
    const premiumUsers = users.map(user => {
      const subscriptions = user.Subscriptions || [];

      // Get last added subscription (most recent createdAt)
      const lastSub = subscriptions.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      )[0];

      let status = 'unknown';
      if (lastSub) {
        if (lastSub.status === 'active' && lastSub.endDate >= currentDate) {
          status = 'active';
        } else if (lastSub.status === 'canceled' && lastSub.endDate >= currentDate) {
          status = 'canceled';
        }
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        status
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Premium users fetched successfully.',
      count: premiumUsers.length,
      data: premiumUsers
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// //only all monthly premium users fetch
// const getPremiumUsers = async (req, res) => {
//   try {
//     const currentDate = new Date();

//     const users = await User.findAll({
//       where: { type: 'user' },
//       attributes: [
//         'id',
//         'name',
//         'email',
//         'image',
//         'installedDate'
//       ],
//       include: [
//         {
//           model: Subscription,
//           as: 'Subscriptions',
//           attributes: [
//             'status',
//             'planType',
//             'endDate',
//             'createdAt',      // subscribed date
//             'clearedDate'     // clearance date
//           ],
//           required: true,
//           separate: true,
//           limit: 1,
//           order: [['createdAt', 'DESC']],
//           where: {
//             status: 'active',
//             planType: 'monthly',
//             endDate: {
//               [Op.ne]: null,
//               [Op.gte]: currentDate
//             }
//           }
//         }
//       ],
//       order: [['createdAt', 'DESC']]
//     });

//     const filteredUsers = users.filter(
//       user => user.Subscriptions && user.Subscriptions.length > 0
//     );

//     const premiumUsers = filteredUsers.map(user => {
//       const subscription = user.Subscriptions[0];

//       return {
//         id:user.id,
//         image: user.image,
//         name: user.name,
//         email: user.email,
//         installedDate: user.installedDate,
//         subscribedDate: subscription.createdAt,
//         clearanceDate: subscription.clearedDate,
//         planType: subscription.planType,
//         status: subscription.status
//       };
//     });

//     return res.status(200).json({
//       success: true,
//       message: 'Monthly active users fetched successfully.',
//       count: premiumUsers.length,
//       data: premiumUsers
//     });

//   } catch (error) {
//     console.error('Error fetching premium users:', error);
//     return res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };







const getMarketers = async (req, res) => {
  try {
    const { filterBy } = req.body; // Extract filterBy from request body

    // Define default where and order clauses
    let whereClause = { type: 'marketer' }; // Filter for marketers
    let orderClause = []; // For sorting users based on filters

    // Define date ranges for filtering
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    // Handle different filter types
    switch (filterBy) {
      case 'dateTime':
        orderClause.push(['createdAt', 'ASC']); // Sort marketers by createdAt
        break;

      case 'monthlyMarketers':
        whereClause.createdAt = { [Op.gte]: lastMonth }; // Marketers created last month
        break;

      case 'weeklyMarketers':
        whereClause.createdAt = { [Op.gte]: lastWeek }; // Marketers created last week
        break;

      case 'totalSales':
        orderClause.push(['referredUid', 'DESC']); // Sort by referrals
        break;

      case 'monthlySales':
        whereClause.createdAt = { [Op.gte]: lastMonth }; // Sales in the last month
        orderClause.push(['referredUid', 'DESC']); // Sort by referrals
        break;

      case 'weeklySales':
        whereClause.createdAt = { [Op.gte]: lastWeek }; // Sales in the last week
        orderClause.push(['referredUid', 'DESC']); // Sort by referrals
        break;

      default:
        orderClause.push(['balance', 'DESC']); // Default sorting by balance
        break;
    }

    // Fetch marketers based on filters
    const marketers = await User.findAll({
      where: whereClause,
      order: orderClause, // Apply sorting based on filters
    });

    // Count of marketers
    const marketersCount = marketers.length;

    return res.status(200).json({
      success: true,
      message: "Marketers fetched successfully.",
      data: {
        marketers,
        usersCount: marketersCount,
      },
    });
  } catch (error) {
    console.error('Error fetching marketers:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching marketers',
    });
  }
};





const singleUserDetails = async (req, res) => {
  try {
    const { uid } = req.body;

    if (!uid) {
      return res.status(400).json({
        success: false,
        message: "User ID (uid) is required.",
      });
    }

    // Fetch referred users, coupon details, user details, and redeem history
    const [referredUsers, coupons, redeemHistory, user] = await Promise.all([
      // Fetch referred users where User.referredUid = uid
      User.findAll({
        where: { referredUid: uid },
        include: [
          {
            model: Subscription,
            as: 'Subscriptions', // Alias defined in the association
            required: false, // Include referred users even if they have no subscriptions
            order: [['createdAt', 'ASC']], // Get the earliest subscription
            limit: 1, // Only the first subscription
          },
        ],
      }),

      // Fetch coupon details where Coupon.uid = uid
      Coupon.findAll({
        where: { uid },
      }),

      // Fetch redeem history where RedeemHistory.uid = uid
      RedeemHistory.findAll({
        where: { uid },
      }),

      // Fetch the user details where User.id = uid
      User.findOne({
        where: { id: uid },
      }),
    ]);

    const userAmount = Number(user.balance);

    // Calculate the total count of RedeemHistory
    const redeemCount = redeemHistory.length;
    // Filter RedeemHistory to include only successful entries
    const successfulRedeems = redeemHistory.filter(item => item.status === 'successful');

    // Calculate the total redeem amount for successful entries
    const successfulRedeemAmount = successfulRedeems.reduce((sum, item) => sum + item.amount, 0);

    // Calculate the total amount for all entries (successful and unsuccessful)
    const totalIncome = successfulRedeemAmount + userAmount;


    return res.status(200).json({
      success: true,
      message: "User details fetched successfully.",
      data: {
        user,
        referredUsers,
        coupons,
        redeemHistory,
        total: {
          totalRequests: redeemCount,
          successfulRedeemAmount,
          totalIncome,
        },
      },
    });

  } catch (error) {
    console.error("Error fetching user details:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching user details.",
    });
  }
};





const paymentRequests = async (req, res) => {
  try {
    const redeemHistory = await Points.findAll({
      include: [
        {
          model: User,
          as: 'User', // this already exists in Points model
          attributes: ['id', 'name', 'email'],
          required: true,
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      data: {
        redeemHistory,
        totalRequests: redeemHistory.length,
      },
    });
  } catch (error) {
    console.error('Error fetching redeem history:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching redeem history',
    });
  }
};










const getFreeUsersByFilteration = async (req, res) => {
  const filterBy = req.body.filterBy

  try {
    const currentDate = new Date();

    // Define date ranges for filtering
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    let whereClause = { type: 'user' }; // Default filter for all queries
    let orderClause = []; // For sorting users based on filters

    // Handle different filter types
    switch (filterBy) {
      case 'dateTime':
        orderClause.push(['createdAt', 'ASC']); // Sort users by createdAt
        break;

      case 'monthlyUsers':
        whereClause.createdAt = { [Op.gte]: lastMonth }; // Users created last month
        break;

      case 'weeklyUsers':
        whereClause.createdAt = { [Op.gte]: lastWeek }; // Users created last week
        break;

      case 'totalSales':
        orderClause.push(['referralUid', 'DESC']); // Sort by referrals
        break;

      case 'monthlySales':
        whereClause.createdAt = { [Op.gte]: lastMonth }; // Sales in the last month
        orderClause.push(['referralUid', 'DESC']); // Sort by referrals
        break;

      case 'weeklySales':
        whereClause.createdAt = { [Op.gte]: lastWeek }; // Sales in the last week
        orderClause.push(['referralUid', 'DESC']); // Sort by referrals
        break;

      default:
        break; // For 'totalUsers', no additional filter required
    }

    // Fetch users and their subscriptions based on filters
    const users = await User.findAll({
      where: whereClause,
      include: [
        {
          model: Subscription,
          as: 'Subscriptions',
          required: false, // Include users even if they don't have subscriptions
        },
      ],
      order: orderClause,
    });

    // Filter users who qualify as free users
    const freeUsersList = users.filter(user => {
      return (
        !user.Subscriptions.length || // No subscriptions
        user.Subscriptions.every(sub => sub.endDate < currentDate) // All subscriptions expired
      );
    });

    return res.status(200).json({
      success: true,
      message: "Free users fetched successfully.",
      data: freeUsersList,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching free users',
    });
  }
};








const getMarketingAgents = async (req, res) => {
  try {
    const currentDate = new Date();

    // Fetch users with type 'marketer' and active subscriptions
    const marketers = await User.findAll({
      where: {
        type: 'marketer', // Filter for marketing agents
      },
      include: [
        {
          model: Subscription,
          as: 'Subscriptions', // Alias for the Subscription model
        },
      ],
    });

    // Sort marketers by balance in descending order
    const sortedMarketersList = marketers.sort((a, b) => b.balance - a.balance);

    return res.status(200).json({
      success: true,
      message: "Marketing agents fetched successfully.",
      data: sortedMarketersList, // Return sorted list
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching marketing agents',
    });
  }
};

const marketingAgentsDetails = async (req, res) => {
  const { uid } = req.body; // Extract UID from the request body

  try {
    if (!uid) {
      return res.status(400).json({
        success: false,
        message: "UID is required to fetch user details.",
      });
    }

    // Fetch user with the specified UID
    const user = await User.findOne({
      where: {
        id: uid, // Filter by UID
      },
      include: [
        {
          model: Subscription,
          as: 'Subscriptions', // Include subscriptions
          required: false,
        },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "user not found.",
      });
    }

    // Fetch coupons for the user
    const coupons = await Coupon.findAll({
      where: {
        uid, // user's UID
      },
    });

    // Fetch redeem history for the user
    const redeemHistory = await RedeemHistory.findAll({
      where: {
        uid, // user's UID
      },
    });

    // Calculate total redeem amount and successful redeem amount
    const totalRedeemAmount = redeemHistory.reduce((sum, record) => sum + record.amount, 0);
    const successfulRedeemAmount = redeemHistory
      .filter(record => record.status === 'successful')
      .reduce((sum, record) => sum + record.amount, 0);

    // Get total redeem requests
    const totalRedeemRequests = redeemHistory.length;

    // Fetch users referred by the user
    const referredUsers = await User.findAll({
      where: {
        referredUid: uid, // Check referredUid in the User model
      },
    });

    return res.status(200).json({
      success: true,
      message: "user details fetched successfully.",
      data: {
        user,
        coupons,
        redeemHistory: {
          totalAmount: totalRedeemAmount,
          successfulAmount: successfulRedeemAmount,
          totalRequests: totalRedeemRequests,
          history: redeemHistory,
        },
        referredUsers,
      },
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching user details',
    });
  }
};

const getActiveSubscriptionUsersByFilteration = async (req, res) => {
  const filterBy = req.body?.filterBy || 'totalUsers'; // Default filter if none is provided

  try {
    const currentDate = new Date();

    // Define date ranges for filtering
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    let whereClause = { type: 'user' }; // Default where clause for users
    let orderClause = []; // Default order clause

    // Adjust filtering and sorting based on `filterBy`
    switch (filterBy) {
      case 'dateTime':
        orderClause.push(['createdAt', 'ASC']); // Sort users by creation date
        break;

      case 'monthlyUsers':
        whereClause.createdAt = { [Op.gte]: lastMonth }; // Users created last month
        break;

      case 'weeklyUsers':
        whereClause.createdAt = { [Op.gte]: lastWeek }; // Users created last week
        break;

      case 'totalSales':
        orderClause.push(['referralUid', 'DESC']); // Sort users by referrals
        break;

      case 'monthlySales':
        whereClause.createdAt = { [Op.gte]: lastMonth }; // Sales in the last month
        orderClause.push(['referralUid', 'DESC']); // Sort users by referrals
        break;

      case 'weeklySales':
        whereClause.createdAt = { [Op.gte]: lastWeek }; // Sales in the last week
        orderClause.push(['referralUid', 'DESC']); // Sort users by referrals
        break;

      default:
        break; // No additional filter for 'totalUsers'
    }

    // Fetch users with active subscriptions
    const users = await User.findAll({
      where: whereClause,
      include: [
        {
          model: Subscription,
          as: 'Subscriptions',
          where: {
            status: 'active', // Active subscriptions
            endDate: {
              [Op.gt]: currentDate, // Subscriptions ending in the future
            },
          },
          required: true, // Only users with active subscriptions
        },
      ],
      order: orderClause,
    });

    return res.status(200).json({
      success: true,
      message: "Premium users fetched successfully.",
      data: users, // Return sorted/filtered list
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching Premium users',
    });
  }
};








const getRedeemHistoryWithUser = async (req, res) => {
  try {
    const redeemHistories = await RedeemHistory.findAll({
      include: [
        {
          model: User,
          as: 'User', // Alias for the relationship
        },
      ],
    });

    if (!redeemHistories.length) {
      return res.status(404).json({
        success: false,
        message: 'No redeem histories found',
      });
    }

    res.status(200).json({
      success: true,
      data: redeemHistories,
    });
  } catch (error) {
    console.error('Error fetching redeem histories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch redeem histories',
    });
  }
};

const updateRedeemHistoryStatus = async (req, res) => {
  const { id } = req.body; // Redeem history ID from URL parameter
  const { status } = req.body; // New status from request body

  try {
    // Validate the status value
    const validStatuses = ['successful', 'inProgress', 'pending', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value. Allowed values are: successful, inProgress, pending, cancelled.',
      });
    }

    // Find the redeem history record
    const redeemHistory = await RedeemHistory.findOne({ where: { id } });

    if (!redeemHistory) {
      return res.status(404).json({
        success: false,
        message: 'Redeem history not found',
      });
    }

    // Update the status
    redeemHistory.status = status;
    await redeemHistory.save();

    res.status(200).json({
      success: true,
      message: 'Redeem history status updated successfully',
      data: redeemHistory,
    });
  } catch (error) {
    console.error('Error updating redeem history status:', error.message, error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to update redeem history status',
      error: error.message, // Include detailed error message
    });
  }
};




module.exports = {
  getFreeUsers,
  getActiveSubscriptionUsers,
  getTrialSubscriptionUsers,
  addCoupon,
  redeemPoints,
  fetchCouponsByUid,
  fetchRedeemHistoryByUid,
  getReferralDetails,
  usersDetails,
  reward,
  getFreeUsersByFilteration,
  getActiveSubscriptionUsersByFilteration,
  getMarketingAgents,
  marketingAgentsDetails,
  getRedeemHistoryWithUser,
  getPremiumUsers,
  getMarketers,
  singleUserDetails,
  paymentRequests,
  getCounts,
  updateRedeemHistoryStatus,
  redeemHistory,
  allDiscounts,
  appsLinks,
  referralDiscounts,
  getAllFreeUsers,
  logoutUser
};
