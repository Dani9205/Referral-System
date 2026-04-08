const ReferralUser = require('../../models/ReferralUser');
const ReferralManager = require('../../models/ReferralManager');
const User = require('../../models/User');
const Subscription = require('../../models/Subscription');
const Payment = require('../../models/Payment');
const Points = require('../../models/Points');
const Coupon = require('../../models/Coupon');
const RedeemHistory = require('../../models/RedeemHistory');
const { Op } = require('sequelize');
const { Sequelize } = require('sequelize');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendEmail = require("../../utils/emailUtils");


//GET ALL REFERRAL USERS (MARKETING AGENTS) WITH TOTAL REFERRED USERS
const getAllReferralUsers = async (req, res) => {
  try {
    // Pagination (optional but recommended)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const referralUsers = await ReferralUser.findAll({
      attributes: [
        'id',
        'name',
        'country',
        'imageUrl',
        'balance',
        'createdAt',
        [
          Sequelize.fn('COUNT', Sequelize.col('Users.id')),
          'totalReferredUsers'
        ]
      ],
      include: [
        {
          model: User,
          as: 'Users',      // ✅ MUST match association alias
          attributes: [],   // or whatever fields you want
          where: {
            deletedAt: null
          },
          required: false
        }
      ],
      group: ['ReferralUser.id'],
      order: [[Sequelize.literal('totalReferredUsers'), 'DESC']],
      limit,
      offset,
      subQuery: false
    });

    const totalCount = await ReferralUser.count();

    res.status(200).json({
      success: true,
      message: 'Referral users fetched successfully.',
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      },
      data: referralUsers
    });

  } catch (error) {
    console.error('Get Referral Users Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};







// //GET ALL REFERRAL USERS (MARKETING AGENTS) WITH Filters
// const getAllReferralUsersWithFilters = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const offset = (page - 1) * limit;

//     const filter = req.query.filter;

//     let whereCondition = {};
//     let includeCondition = [
//       {
//         model: User,
//         as: 'Users',
//         attributes: [],
//         where: { deletedAt: null },
//         required: false
//       }
//     ];

//     let havingCondition = undefined;

//     // 🔥 Default order (by totalReferredUsers DESC)
//     let orderCondition = [[Sequelize.literal('totalReferredUsers'), 'DESC']];

//     // ============================
//     // 🔥 FILTERS
//     // ============================

//     // ✅ 1. ACTIVE USERS
//     if (filter === 'active') {
//       includeCondition = [
//         {
//           model: User,
//           as: 'Users',
//           attributes: [],
//           where: { deletedAt: null },
//           required: true,
//           include: [
//             {
//               model: Subscription,
//               as: 'Subscriptions',
//               attributes: [],
//               where: {
//                 status: 'active',
//                 deletedAt: null
//               },
//               required: true
//             }
//           ]
//         }
//       ];
//     }

//     // ✅ 2. TOTAL USERS
//     if (filter === 'total') {
//       havingCondition = Sequelize.literal('COUNT(`Users`.`id`) > 0');
//     }

//     // ✅ 3. MONTHLY USERS
//     if (filter === 'monthly') {
//       const startOfMonth = new Date();
//       startOfMonth.setDate(1);
//       startOfMonth.setHours(0, 0, 0, 0);

//       whereCondition.createdAt = {
//         [Op.gte]: startOfMonth
//       };
//     }

//     // ✅ 4. WEEKLY USERS
//     if (filter === 'weekly') {
//       const now = new Date();
//       const startOfWeek = new Date(now);
//       startOfWeek.setDate(now.getDate() - now.getDay());
//       startOfWeek.setHours(0, 0, 0, 0);

//       whereCondition.createdAt = {
//         [Op.gte]: startOfWeek
//       };
//     }

//     // ✅ 5. BALANCE FILTER (NEW)
//     if (filter === 'balance') {
//       orderCondition = [['balance', 'DESC']];
//     }

//     // ============================
//     // 🔎 MAIN DATA QUERY
//     // ============================

//     const referralUsers = await ReferralUser.findAll({
//       attributes: [
//         'id',
//         'name',
//         'country',
//         'imageUrl',
//         'balance',
//         'createdAt',
//         [
//           Sequelize.fn('COUNT', Sequelize.col('Users.id')),
//           'totalReferredUsers'
//         ]
//       ],
//       include: includeCondition,
//       where: whereCondition,
//       group: ['ReferralUser.id'],
//       having: havingCondition,
//       order: orderCondition,
//       limit,
//       offset,
//       subQuery: false
//     });

//     // ============================
//     // 📊 PAGINATION COUNT
//     // ============================

//     let totalCount;

//     if (!filter || filter === 'balance') {
//       // Default + balance both use normal count
//       totalCount = await ReferralUser.count({
//         where: whereCondition
//       });
//     } else {
//       const countData = await ReferralUser.findAll({
//         attributes: ['id'],
//         include: includeCondition,
//         where: whereCondition,
//         group: ['ReferralUser.id'],
//         having: havingCondition,
//         subQuery: false
//       });

//       totalCount = countData.length;
//     }

//     res.status(200).json({
//       success: true,
//       message: 'Referral users fetched successfully.',
//       pagination: {
//         total: totalCount,
//         page,
//         limit,
//         totalPages: Math.ceil(totalCount / limit)
//       },
//       data: referralUsers
//     });

//   } catch (error) {
//     console.error('Get Referral Users Error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// };

const getAllReferralUsersWithFilters = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const filter = req.query.filter;

    let whereCondition = {};
    let havingCondition = undefined;

    let includeCondition = [
      {
        model: User,
        as: "Users",
        attributes: [],
        where: { deletedAt: null },
        required: false, // allow all users for counting
        include: [
          {
            model: Subscription,
            as: "Subscriptions",
            attributes: [],
            where: { deletedAt: null },
            required: false,
          },
        ],
      },
    ];

    // Default sorting
    let orderCondition = [[Sequelize.literal("totalReferredUsers"), "DESC"]];

    // =========================
    // FILTER CONDITIONS
    // =========================

    if (filter === "active") {
      includeCondition = [
        {
          model: User,
          as: "Users",
          attributes: [],
          where: { deletedAt: null },
          required: false, // include all users to count correctly
          include: [
            {
              model: Subscription,
              as: "Subscriptions",
              attributes: [],
              where: { status: "active", deletedAt: null },
              required: false, // allow multiple subscriptions
            },
          ],
        },
      ];
    }

    if (filter === "total") {
      havingCondition = Sequelize.literal("COUNT(DISTINCT `Users`.`id`) > 0");
    }

    if (filter === "monthly") {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      whereCondition.createdAt = { [Op.gte]: startOfMonth };
    }

    if (filter === "weekly") {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      whereCondition.createdAt = { [Op.gte]: startOfWeek };
    }

    if (filter === "balance") {
      orderCondition = [["balance", "DESC"]];
    }

    // =========================
    // BASE ATTRIBUTES
    // =========================
    let attributes = [
      "id",
      "name",
      "country",
      "imageUrl",
      "balance",
      "createdAt",
      [
        Sequelize.fn("COUNT", Sequelize.fn("DISTINCT", Sequelize.col("Users.id"))),
        "totalReferredUsers",
      ],
    ];

    // =========================
    // SALES ATTRIBUTES
    // =========================
    const totalSalesAttr = [
      Sequelize.literal(`
        SUM(
          CASE
            WHEN \`Users->Subscriptions\`.\`planType\`='monthly' THEN 2
            WHEN \`Users->Subscriptions\`.\`planType\`='yearly' THEN 20
            ELSE 0
          END
        )
      `),
      "totalSales",
    ];

    const monthlySalesAttr = [
      Sequelize.literal(`
        SUM(
          CASE
            WHEN \`Users->Subscriptions\`.\`planType\`='monthly'
            AND MONTH(\`Users->Subscriptions\`.\`createdAt\`) = MONTH(CURDATE())
            AND YEAR(\`Users->Subscriptions\`.\`createdAt\`) = YEAR(CURDATE())
            THEN 2
            WHEN \`Users->Subscriptions\`.\`planType\`='yearly'
            AND MONTH(\`Users->Subscriptions\`.\`createdAt\`) = MONTH(CURDATE())
            AND YEAR(\`Users->Subscriptions\`.\`createdAt\`) = YEAR(CURDATE())
            THEN 20
            ELSE 0
          END
        )
      `),
      "monthlySales",
    ];

    const weeklySalesAttr = [
      Sequelize.literal(`
        SUM(
          CASE
            WHEN \`Users->Subscriptions\`.\`planType\`='monthly'
            AND YEARWEEK(\`Users->Subscriptions\`.\`createdAt\`,1) = YEARWEEK(CURDATE(),1)
            THEN 2
            WHEN \`Users->Subscriptions\`.\`planType\`='yearly'
            AND YEARWEEK(\`Users->Subscriptions\`.\`createdAt\`,1) = YEARWEEK(CURDATE(),1)
            THEN 20
            ELSE 0
          END
        )
      `),
      "weeklySales",
    ];

    // =========================
    // SALES FILTERS
    // =========================
    if (filter === "totalSales") {
      attributes.push(totalSalesAttr);
      orderCondition = [[Sequelize.literal("totalSales"), "DESC"]];
    }

    if (filter === "monthlySales") {
      attributes.push(monthlySalesAttr);
      orderCondition = [[Sequelize.literal("monthlySales"), "DESC"]];
      havingCondition = Sequelize.literal(`
        SUM(
          CASE
            WHEN \`Users->Subscriptions\`.\`planType\`='monthly'
            AND MONTH(\`Users->Subscriptions\`.\`createdAt\`) = MONTH(CURDATE())
            AND YEAR(\`Users->Subscriptions\`.\`createdAt\`) = YEAR(CURDATE())
            THEN 2
            WHEN \`Users->Subscriptions\`.\`planType\`='yearly'
            AND MONTH(\`Users->Subscriptions\`.\`createdAt\`) = MONTH(CURDATE())
            AND YEAR(\`Users->Subscriptions\`.\`createdAt\`) = YEAR(CURDATE())
            THEN 20
            ELSE 0
          END
        ) > 0
      `);
    }

    if (filter === "weeklySales") {
      attributes.push(weeklySalesAttr);
      orderCondition = [[Sequelize.literal("weeklySales"), "DESC"]];
      havingCondition = Sequelize.literal(`
        SUM(
          CASE
            WHEN \`Users->Subscriptions\`.\`planType\`='monthly'
            AND YEARWEEK(\`Users->Subscriptions\`.\`createdAt\`,1) = YEARWEEK(CURDATE(),1)
            THEN 2
            WHEN \`Users->Subscriptions\`.\`planType\`='yearly'
            AND YEARWEEK(\`Users->Subscriptions\`.\`createdAt\`,1) = YEARWEEK(CURDATE(),1)
            THEN 20
            ELSE 0
          END
        ) > 0
      `);
    }

    // =========================
    // MAIN QUERY
    // =========================
    const referralUsers = await ReferralUser.findAll({
      attributes,
      include: includeCondition,
      where: whereCondition,
      group: ["ReferralUser.id"],
      having: havingCondition,
      order: orderCondition,
      limit,
      offset,
      subQuery: false,
    });

    // =========================
    // PAGINATION COUNT
    // =========================
    let totalCount;

    if (!filter || filter === "balance" || filter === "totalSales") {
      totalCount = await ReferralUser.count({ where: whereCondition });
    } else {
      const countData = await ReferralUser.findAll({
        attributes: ["id"],
        include: includeCondition,
        where: whereCondition,
        group: ["ReferralUser.id"],
        having: havingCondition,
        subQuery: false,
      });
      totalCount = countData.length;
    }

    res.status(200).json({
      success: true,
      message: "Referral users fetched successfully.",
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
      data: referralUsers,
    });
  } catch (error) {
    console.error("Get Referral Users Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};











const getReferralUserStatistics = async (req, res) => {
  try {
    const referralUserId = Number(req.params.id);

    const referralUser = await ReferralUser.findByPk(referralUserId);

    if (!referralUser) {
      return res.status(404).json({
        success: false,
        message: "Referral user not found"
      });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    const users = await User.findAll({
      where: {
        referredUid: referralUserId,
        type: "user",
        deletedAt: null
      },
      attributes: ["id", "createdAt"],
      include: [
        {
          model: Subscription,
          as: "Subscriptions",
          required: false
        }
      ]
    });

    // 🔹 Categories
    const freeUsers = [];

    const monthlyPremium = [];
    const monthlySubscribed = [];
    const monthlyCancelled = [];
    const monthlyTrial = [];

    const yearlyPremium = [];
    const yearlySubscribed = [];
    const yearlyCancelled = [];
    const yearlyTrial = [];

    users.forEach(user => {

      let latestSub = null;

      // 🔹 FIND LATEST SUBSCRIPTION (for COUNTING only)
      if (user.Subscriptions?.length > 0) {
        latestSub = user.Subscriptions.sort(
          (a, b) => new Date(b.endDate) - new Date(a.endDate)
        )[0];
      }

      // =========================
      // 🔹 COUNTING LOGIC
      // =========================

      if (
        !latestSub ||
        latestSub.status === "expired" ||
        new Date(latestSub.endDate) < now
      ) {
        freeUsers.push(user);
      }
      else if (latestSub.planType === "monthly") {

        monthlyPremium.push(user);

        if (latestSub.status === "active")
          monthlySubscribed.push(user);

        if (latestSub.status === "canceled")
          monthlyCancelled.push(user);

        if (latestSub.status === "trial")
          monthlyTrial.push(user);

      }
      else if (latestSub.planType === "yearly") {

        yearlyPremium.push(user);

        if (latestSub.status === "active")
          yearlySubscribed.push(user);

        if (latestSub.status === "canceled")
          yearlyCancelled.push(user);

        if (latestSub.status === "trial")
          yearlyTrial.push(user);
      }

      // =========================
      // 🔹 REVENUE LOGIC
      // =========================

      if (user.Subscriptions?.length > 0) {

        user.Subscriptions.forEach(sub => {

          let revenue = 0;

          if (sub.planType === "monthly") revenue = 2;
          if (sub.planType === "yearly") revenue = 20;

          // Push revenue in correct category
          if (sub.planType === "monthly") {

            if (sub.status === "active") monthlySubscribed.push({ referralRevenue: revenue });
            else if (sub.status === "canceled") monthlyCancelled.push({ referralRevenue: revenue });
            else if (sub.status === "trial") monthlyTrial.push({ referralRevenue: revenue });
            else if (sub.status === "expired") monthlyPremium.push({ referralRevenue: revenue });

          }
          else if (sub.planType === "yearly") {

            if (sub.status === "active") yearlySubscribed.push({ referralRevenue: revenue });
            else if (sub.status === "canceled") yearlyCancelled.push({ referralRevenue: revenue });
            else if (sub.status === "trial") yearlyTrial.push({ referralRevenue: revenue });
            else if (sub.status === "expired") yearlyPremium.push({ referralRevenue: revenue });

          }

        });
      }

    });

    const buildStats = (arr) => ({
      total: arr.filter(u => u.id).length,
      thisMonth: arr.filter(u => u.id && u.createdAt >= startOfMonth).length,
      thisWeek: arr.filter(u => u.id && u.createdAt >= startOfWeek).length,
      revenue: arr.reduce((sum, u) => sum + (u.referralRevenue || 0), 0)
    });

    return res.status(200).json({
      success: true,
      message: "Referral user statistics fetched successfully",
      referralUser: {
        id: referralUser.id,
        name: referralUser.name,
        email: referralUser.email
      },
      statistics: {
        freeUsers: buildStats(freeUsers),

        monthlyPremium: buildStats(monthlyPremium),
        monthlyTrial: buildStats(monthlyTrial),
        monthlySubscribed: buildStats(monthlySubscribed),
        monthlyCancelled: buildStats(monthlyCancelled),

        yearlyPremium: buildStats(yearlyPremium),
        yearlyTrial: buildStats(yearlyTrial),
        yearlySubscribed: buildStats(yearlySubscribed),
        yearlyCancelled: buildStats(yearlyCancelled)
      }
    });

  } catch (error) {
    console.error("Referral User Statistics Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};








//get free users of referral user
const getReferralUserFreeUsers = async (req, res) => {
  try {
    const referralUserId = Number(req.params.id);
    const now = new Date();

    // ✅ Check referral user exists
    const referralUser = await ReferralUser.findByPk(referralUserId);
    if (!referralUser) {
      return res.status(404).json({
        success: false,
        message: "Referral user not found"
      });
    }

    // Pagination
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const users = await User.findAll({
      where: {
        referredUid: referralUserId,
        type: "user",
        deletedAt: null
      },
      attributes: ["id", "name", "image", "createdAt"],
      include: [
        {
          model: Subscription,
          as: "Subscriptions",
          required: false,
          attributes: ["id", "status", "endDate", "planType", "createdAt"],
          where: {
            status: { [Op.in]: ["trial", "active", "canceled"] }
          }
        }
      ],
      offset,
      limit
    });

    const freeUsers = users
      .filter(user => {
        if (!user.Subscriptions || user.Subscriptions.length === 0)
          return true;

        const latestSub = user.Subscriptions.sort(
          (a, b) =>
            new Date(b.endDate || b.createdAt) -
            new Date(a.endDate || a.createdAt)
        )[0];

        const endDate = latestSub?.endDate
          ? new Date(latestSub.endDate)
          : null;

        return !latestSub || (endDate && endDate < now);
      })
      .map(user => ({
        id: user.id,
        image: user.image,
        name: user.name,
        createdAt: user.createdAt,
        status: "Free"
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.status(200).json({
      success: true,
      message: "Free users fetched successfully.",
      referralUser: {
        id: referralUser.id,
        name: referralUser.name,
        email: referralUser.email
      },
      count: freeUsers.length,
      page,
      limit,
      freeUsers
    });

  } catch (error) {
    console.error("Get Free Users Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};








// Get Single Marketing Agent With Financial Summary
const getSingleReferralUser = async (req, res) => {
  try {
    const managerId = Number(req.params.id);

    if (!managerId) {
      return res.status(400).json({
        success: false,
        message: "Invalid manager ID"
      });
    }

    // 1️⃣ Fetch manager
    const manager = await ReferralUser.findByPk(managerId, {
      attributes: ['id', 'name', 'imageUrl', 'balance'] // country removed
    });

    if (!manager) {
      return res.status(404).json({
        success: false,
        message: "Referral manager not found"
      });
    }

    // 2️⃣ Calculate totals for this manager only
    const totalIncome = await Payment.sum('amount', {
      where: {
        uid: managerId,      // Only manager's own payments
        status: 'completed'
      }
    });

    const totalRedeem = await RedeemHistory.sum('amount', {
      where: {
        uid: managerId,      // Only manager's own redeems
        status: 'successful'
      }
    });

    const totalRequests = await RedeemHistory.count({
      where: {
        uid: managerId       // Only manager's own redeem requests
      }
    });

    return res.status(200).json({
      success: true,
      message: "Referral manager fetched successfully.",
      data: {
        id: manager.id,
        name: manager.name,
        imageUrl: manager.imageUrl,
        balance: Number(manager.balance) || 0,
        totalIncome: Number(totalIncome) || 0,
        totalRedeem: Number(totalRedeem) || 0,
        totalRequests: totalRequests || 0
      }
    });

  } catch (error) {
    console.error('Get Single Referral Manager Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};










//get Points history
const getReferralUserPointsWithUsers = async (req, res) => {
  try {
    const referralUserId = Number(req.params.id);

    if (!referralUserId) {
      return res.status(400).json({
        success: false,
        message: "Invalid referral user ID"
      });
    }

    // ✅ Pagination params
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // 1️⃣ Fetch users with subscriptions + pagination
    const { count, rows: users } = await User.findAndCountAll({
      where: {
        referredUid: referralUserId,
      },
      attributes: ['id', 'name', 'image', 'installedDate', 'createdAt'], // ✅ FIX
      include: [
        {
          model: Subscription,
          as: 'Subscriptions',
          attributes: ['id', 'planType', 'createdAt'],
          required: true
        }
      ],
      order: [['createdAt', 'ASC']],
      limit,
      offset,
      distinct: true
    });

    // 2️⃣ Format response + calculate referral points
    const data = users.map(user => {
      let referralPoints = 0;

      user.Subscriptions.forEach(sub => {
        if (sub.planType === 'monthly') referralPoints += 2;
        else if (sub.planType === 'yearly') referralPoints += 20;
      });

      return {
        id: user.id,
        name: user.name,
        image: user.image || null,
        installedDate: user.installedDate || null,
        subscribedDate: user.Subscriptions[0]?.createdAt || null,
        referralPoints
      };
    });

    // 3️⃣ Send response
    return res.status(200).json({
      success: true,
      message: "Referral users fetched successfully.",
      totalUsers: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data
    });

  } catch (error) {
    console.error("Get Referral User Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};









//get coupon history
const getReferralUserCouponHistory = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Validate userId
    if (!userId || isNaN(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid referral user ID"
      });
    }

    // Check if referral user exists
    const user = await ReferralUser.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Referral user not found"
      });
    }

    // Fetch coupons for this user with pagination and custom status order
    const { count, rows: coupons } = await Coupon.findAndCountAll({
      where: { uid: userId },
      attributes: ['id', 'coupon', 'status', 'createdAt', 'expiryDate'],
      order: [
        [Sequelize.literal(`CASE 
          WHEN status = 'redeemed' THEN 1
          WHEN status = 'expired' THEN 2
          ELSE 3
        END`), 'ASC'],
        ['createdAt', 'DESC'] // newest first within each status
      ],
      limit,
      offset
    });

    // Map coupons with formatted date and coupon code
    const data = coupons.map((c, index) => ({
      number: offset + index + 1, // optional numbering
      id: c.id,
      coupon: c.coupon,
      status: c.status,
      date: c.status === 'redeemed'
        ? `redeemed: ${c.createdAt.toISOString()}`
        : `expired: ${c.expiryDate.toISOString()}`
    }));

    return res.status(200).json({
      success: true,
      message: "Referral user coupon history fetched successfully.",
      totalCoupons: count,
      page,
      limit,
      data
    });

  } catch (error) {
    console.error("Get Referral User Coupon History Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};








//get redeem history
const getReferralUserRedeemHistory = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Validate userId
    if (!userId || isNaN(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid referral user ID"
      });
    }

    // Check if referral user exists
    const user = await ReferralUser.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Referral user not found"
      });
    }

    // Fetch redeem history for this user with pagination and custom status order
    const { count, rows: redeemHistory } = await RedeemHistory.findAndCountAll({
      where: { uid: userId },
      attributes: ['id', 'points', 'status', 'createdAt'],
      order: [
        [Sequelize.literal(`CASE 
          WHEN status = 'successful' THEN 1
          WHEN status = 'pending' THEN 2
          WHEN status = 'cancelled' THEN 3
          ELSE 4
        END`), 'ASC'],
        ['createdAt', 'DESC'] // keep newest first within each status
      ],
      limit,
      offset
    });

    // Map response with numbering
    const data = redeemHistory.map((r, index) => ({
      number: offset + index + 1,
      id: r.id,
      points: r.points,
      status: r.status,
      date: r.createdAt
    }));

    return res.status(200).json({
      success: true,
      message: "Referral user redeem history fetched successfully.",
      totalRecords: count,
      page,
      limit,
      data
    });

  } catch (error) {
    console.error("Get Referral User Redeem History Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};












//Login referral manager
const loginReferralManager = async (req, res) => {
  try {
    console.log(req.body);
    const userId = req.body.userId;
    const password = req.body.password;

    if (!userId || !password) {
      return res.status(400).json({
        success: false,
        message: "userId and password are required"
      });
    }

    const manager = await ReferralManager.findOne({
      where: { userId }
    });

    if (!manager) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const matchPassword = await bcrypt.compare(password, manager.password);

    if (!matchPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid password"
      });
    }

    const accessToken = jwt.sign(
      { id: manager.id, userId: manager.userId },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    manager.accessToken = accessToken;
    await manager.save();

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        id: manager.id,
        name: manager.name,
        userId: manager.userId,
        accessToken
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message
    });
  }
};












// //Generate OTP
// const generateForgotPasswordOTP = async (req, res) => {
//   try {
//     const { email } = req.body;

//     if (!email) {
//       return res.status(400).json({ success: false, message: "Email is required" });
//     }

//     const manager = await ReferralManager.findOne({ where: { email } });

//     if (!manager) {
//       return res.status(404).json({ success: false, message: "Email not found" });
//     }

//     const otp = Math.floor(1000 + Math.random() * 9000); // 4-digit OTP
//     const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

//     manager.otp = otp;
//     manager.otpExpiry = expiry;

//     await manager.save(); // important!

//     console.log("OTP saved:", manager.otp, manager.otpExpiry); // debug

//     return res.status(200).json({
//       success: true,
//       message: "OTP generated successfully",
//       data: { otp }
//     });

//   } catch (error) {
//     return res.status(500).json({ success: false, message: "Failed to generate OTP", error: error.message });
//   }
// };
const generateForgotPasswordOTP = async (req, res) => {
  try {

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    const manager = await ReferralManager.findOne({ where: { email } });

    if (!manager) {
      return res.status(404).json({
        success: false,
        message: "Email not found"
      });
    }

    // Generate OTP in controller
    const otp = Math.floor(1000 + Math.random() * 9000);

    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    manager.otp = otp;
    manager.otpExpiry = otpExpiry;

    await manager.save();

    // Send OTP email
    await sendEmail(
      email,
      "Password Reset OTP",
      `Your OTP for password reset is: ${otp}`
    );

    return res.status(200).json({
      success: true,
      message: "OTP sent to email successfully"
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "Failed to generate OTP",
      error: error.message
    });

  }
};












//Verify OTP
const verifyForgotPasswordOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required"
      });
    }

    const manager = await ReferralManager.findOne({ where: { email } });

    if (!manager) {
      return res.status(404).json({
        success: false,
        message: "Email not found"
      });
    }

    // check OTP
    if (parseInt(manager.otp) !== parseInt(otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      });
    }

    // check expiry
    if (!manager.otpExpiry || new Date() > manager.otpExpiry) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired"
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully"
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "OTP verification failed",
      error: error.message
    });
  }
};











//reset password
const resetPassword = async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, new password, and confirm password are required"
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match"
      });
    }

    const manager = await ReferralManager.findOne({ where: { email } });

    if (!manager) {
      return res.status(404).json({
        success: false,
        message: "Email not found"
      });
    }

    // hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // save new password
    manager.password = hashedPassword;

    // clear OTP fields
    manager.otp = null;
    manager.otpExpiry = null;

    await manager.save();

    return res.status(200).json({
      success: true,
      message: "Password has been reset successfully"
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to reset password",
      error: error.message
    });
  }
};

module.exports = {
  getAllReferralUsers,
  getAllReferralUsersWithFilters,
  getReferralUserStatistics,
  getReferralUserFreeUsers,
  getSingleReferralUser,
  getReferralUserPointsWithUsers,
  getReferralUserCouponHistory,
  getReferralUserRedeemHistory,
  loginReferralManager,
  generateForgotPasswordOTP,
  verifyForgotPasswordOTP,
  resetPassword
};
