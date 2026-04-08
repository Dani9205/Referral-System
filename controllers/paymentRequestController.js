const { RedeemHistory, ReferralUser } = require('../models/association');
const db = require("../config/db");

// // Get Active Payment Requests (status = inProgress)
// const getActivePaymentRequests = async (req, res) => {
//   try {
//     // Pagination
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const offset = (page - 1) * limit;

//     // Fetch data from RedeemHistory with user info
//     const requests = await RedeemHistory.findAndCountAll({
//       where: { status: "inProgress" },
//       attributes: ["points", "createdAt"],

//       include: [
//         {
//           model: ReferralUser,
//           as: 'redeemUser', // MUST MATCH alias in associations.js
//           attributes: ['name', 'imageUrl'],
//         }
//       ],

//       limit,
//       offset,
//       order: [['createdAt', 'DESC']],
//     });

//     // Format response
//     const formattedData = requests.rows.map((item, index) => {
//       const createdAt = new Date(item.createdAt);

//       return {
//         '#': offset + index + 1,
//         imageUrl: item.redeemUser?.imageUrl || null,
//         name: item.redeemUser?.name || null,
//         points: item.points,
//         date: createdAt.toISOString().split("T")[0], // YYYY-MM-DD
//         time: createdAt.toTimeString().split(" ")[0], // HH:MM:SS
//       };
//     });

//     res.status(200).json({
//       success: true,
//       message: "Active payment requests fetched successfully.",
//       totalRecords: requests.count,
//       currentPage: page,
//       totalPages: Math.ceil(requests.count / limit),
//       data: formattedData
//     });

//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch active payment requests",
//       error: error.message
//     });
//   }
// };

const getActivePaymentRequests = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Fetch data from RedeemHistory with user info
    const requests = await RedeemHistory.findAndCountAll({
      where: { status: "inProgress" },

      // Fetch all columns
      attributes: { exclude: [] }, // or just remove 'attributes' entirely

      include: [
        {
          model: ReferralUser,
          as: 'redeemUser', // MUST MATCH alias in associations.js
          attributes: { exclude: [] }, // fetch all columns
        }
      ],

      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    // // Format response
    // const formattedData = requests.rows.map((item, index) => {
    //   const createdAt = new Date(item.createdAt);

    //   return {
    //     '#': offset + index + 1,
    //     // Include all redeemUser fields dynamically
    //     ...item.redeemUser?.dataValues,  
    //     ...item.dataValues, // all RedeemHistory fields
    //     date: createdAt.toISOString().split("T")[0], // YYYY-MM-DD
    //     time: createdAt.toTimeString().split(" ")[0], // HH:MM:SS
    //   };
    // });
    const formattedData = requests.rows.map((item, index) => {
  const createdAt = new Date(item.createdAt);

  return {
    '#': offset + index + 1,
    ...item.dataValues,               // ✅ RedeemHistory data pehle
    redeemUser: item.redeemUser?.dataValues || {},  // ✅ ReferralUser data baad mein
    date: createdAt.toISOString().split("T")[0],    // YYYY-MM-DD
    time: createdAt.toTimeString().split(" ")[0],   // HH:MM:SS
  };
});

    res.status(200).json({
      success: true,
      message: "Active payment requests fetched successfully.",
      totalRecords: requests.count,
      currentPage: page,
      totalPages: Math.ceil(requests.count / limit),
      data: formattedData
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch active payment requests",
      error: error.message
    });
  }
};









// Get Pending Payment Requests (status = pending)
// const getPendingPaymentRequests = async (req, res) => {
//   try {
//     // Pagination
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const offset = (page - 1) * limit;

//     // Fetch data from RedeemHistory with user info
//     const requests = await RedeemHistory.findAndCountAll({
//       where: { status: "pending" }, // <-- just change status here
//       attributes: ["points", "createdAt"],

//       include: [
//         {
//           model: ReferralUser,
//           as: 'redeemUser', // must match alias in associations.js
//           attributes: ['name', 'imageUrl'],
//         }
//       ],

//       limit,
//       offset,
//       order: [['createdAt', 'DESC']],
//     });

//     // Format response
//     const formattedData = requests.rows.map((item, index) => {
//       const createdAt = new Date(item.createdAt);

//       return {
//         '#': offset + index + 1,
//         name: item.redeemUser?.name || null,
//         imageUrl: item.redeemUser?.imageUrl || null,
//         points: item.points,
//         date: createdAt.toISOString().split("T")[0], // YYYY-MM-DD
//         time: createdAt.toTimeString().split(" ")[0], // HH:MM:SS
//       };
//     });

//     res.status(200).json({
//       success: true,
//       message: "Pending payment requests fetched successfully.",
//       totalRecords: requests.count,
//       currentPage: page,
//       totalPages: Math.ceil(requests.count / limit),
//       data: formattedData
//     });

//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch pending payment requests",
//       error: error.message
//     });
//   }
// };

const getPendingPaymentRequests = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Fetch data from RedeemHistory with user info
    const requests = await RedeemHistory.findAndCountAll({
      where: { status: "pending" }, // <-- just change status here

      // removed attributes to fetch all columns
      include: [
        {
          model: ReferralUser,
          as: 'redeemUser', // must match alias in associations.js
          // removed attributes to fetch all columns
        }
      ],

      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    // // Format response
    // const formattedData = requests.rows.map((item, index) => {
    //   const createdAt = new Date(item.createdAt);

    //   return {
    //     '#': offset + index + 1,
    //     ...item.dataValues,                // all RedeemHistory columns
    //     ...item.redeemUser?.dataValues,    // all ReferralUser columns
    //     date: createdAt.toISOString().split("T")[0], // YYYY-MM-DD
    //     time: createdAt.toTimeString().split(" ")[0], // HH:MM:SS
    //   };
    // });

 const formattedData = requests.rows.map((item, index) => {
  const createdAt = new Date(item.createdAt);

  // Remove the automatic nested redeemUser from dataValues
  const { redeemUser, ...redeemHistoryData } = item.dataValues;

  return {
    '#': offset + index + 1,
    redeemHistory: redeemHistoryData,           // RedeemHistory data without nested user
    redeemUser: item.redeemUser?.dataValues || {}, // ReferralUser data
    date: createdAt.toISOString().split("T")[0],
    time: createdAt.toTimeString().split(" ")[0],
  };
});

    res.status(200).json({
      success: true,
      message: "Pending payment requests fetched successfully.",
      totalRecords: requests.count,
      currentPage: page,
      totalPages: Math.ceil(requests.count / limit),
      data: formattedData
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending payment requests",
      error: error.message
    });
  }
};









// // Get Redeemed Payment Requests (status = successful)
// const getRedeemedPaymentRequests = async (req, res) => {
//   try {
//     // Pagination
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const offset = (page - 1) * limit;

//     // Fetch data from RedeemHistory with user info
//     const requests = await RedeemHistory.findAndCountAll({
//       where: { status: "successful" }, // <-- status filter
//       attributes: ["points", "createdAt"],

//       include: [
//         {
//           model: ReferralUser,
//           as: 'redeemUser', // alias must match associations.js
//           attributes: ['name', 'imageUrl'],
//         }
//       ],

//       limit,
//       offset,
//       order: [['createdAt', 'DESC']],
//     });

//     // Format response
//     const formattedData = requests.rows.map((item, index) => {
//       const createdAt = new Date(item.createdAt);

//       return {
//         '#': offset + index + 1,
//         name: item.redeemUser?.name || null,
//         imageUrl: item.redeemUser?.imageUrl || null,
//         points: item.points,
//         date: createdAt.toISOString().split("T")[0], // YYYY-MM-DD
//         time: createdAt.toTimeString().split(" ")[0], // HH:MM:SS
//       };
//     });

//     res.status(200).json({
//       success: true,
//       message: "Redeemed payment requests fetched successfully.",
//       totalRecords: requests.count,
//       currentPage: page,
//       totalPages: Math.ceil(requests.count / limit),
//       data: formattedData
//     });

//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch redeemed payment requests",
//       error: error.message
//     });
//   }
// };

// const getRedeemedPaymentRequests = async (req, res) => {
//   try {
//     // Pagination
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const offset = (page - 1) * limit;

//     // Fetch data from RedeemHistory with user info
//     const requests = await RedeemHistory.findAndCountAll({
//       where: { status: "successful" }, // <-- status filter

//       // Fetch all columns
//       attributes: { exclude: [] }, // or remove 'attributes' entirely

//       include: [
//         {
//           model: ReferralUser,
//           as: 'redeemUser', // alias must match associations.js
//           attributes: { exclude: [] }, // fetch all columns
//         }
//       ],

//       limit,
//       offset,
//       order: [['createdAt', 'DESC']],
//     });

//     // Format response
//     const formattedData = requests.rows.map((item, index) => {
//       const createdAt = new Date(item.createdAt);

//       return {
//         '#': offset + index + 1,
//         ...item.dataValues, // all RedeemHistory fields
//         ...item.redeemUser?.dataValues, // all ReferralUser fields
//         date: createdAt.toISOString().split("T")[0], // YYYY-MM-DD
//         time: createdAt.toTimeString().split(" ")[0], // HH:MM:SS
//       };
//     });

//     res.status(200).json({
//       success: true,
//       message: "Redeemed payment requests fetched successfully.",
//       totalRecords: requests.count,
//       currentPage: page,
//       totalPages: Math.ceil(requests.count / limit),
//       data: formattedData
//     });

//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch redeemed payment requests",
//       error: error.message
//     });
//   }
// };

const getRedeemedPaymentRequests = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Fetch data from RedeemHistory with user info
    const requests = await RedeemHistory.findAndCountAll({
      where: { status: "successful" }, // status filter

      include: [
        {
          model: ReferralUser,
          as: 'redeemUser', // alias must match associations.js
        }
      ],

      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    // Format response
    const formattedData = requests.rows.map((item, index) => {
      const createdAt = new Date(item.createdAt);

      // Remove automatic nested redeemUser from dataValues
      const { redeemUser, ...redeemHistoryData } = item.dataValues;

      return {
        '#': offset + index + 1,
        redeemHistory: redeemHistoryData,               // RedeemHistory data only
        redeemUser: item.redeemUser?.dataValues || {},  // ReferralUser data nested
        date: createdAt.toISOString().split("T")[0],
        time: createdAt.toTimeString().split(" ")[0],
      };
    });

    res.status(200).json({
      success: true,
      message: "Redeemed payment requests fetched successfully.",
      totalRecords: requests.count,
      currentPage: page,
      totalPages: Math.ceil(requests.count / limit),
      data: formattedData
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch redeemed payment requests",
      error: error.message
    });
  }
};











// //change pending status into cancelled/inProgress
// const updateRedeemStatus = async (req, res) => {
//   try {
//     const id = req.body.id;
//     const action = req.body.action;

//     if (!id || !action) {
//       return res.status(400).json({
//         success: false,
//         message: "id and action are required"
//       });
//     }

//     let status;

//     if (action === "cancel") {
//       status = "cancelled";
//     } 
//     else if (action === "accept") {
//       status = "inProgress";
//     } 
//     else {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid action. Use accept or cancel"
//       });
//     }

//     const query = `
//       UPDATE redeem_history
//       SET status = :status, updatedAt = NOW()
//       WHERE id = :id
//     `;

//     const result = await db.query(query, {
//       replacements: { status, id }
//     });

//     res.json({
//       success: true,
//       message: "Status updated successfully",
//       newStatus: status
//     });

//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Update failed",
//       error: error.message
//     });
//   }
// };

const updateRedeemStatus = async (req, res) => {
  try {
    const { id, action } = req.body;

    // Validate input
    if (!id || !action) {
      return res.status(400).json({
        success: false,
        message: "id and action are required"
      });
    }

    let status;

    if (action === "cancel") {
      status = "cancelled";
    } else if (action === "accept") {
      status = "inProgress";
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Use accept or cancel"
      });
    }

    // ✅ Update only if status is pending
    const query = `
      UPDATE redeem_history
      SET status = :status, updatedAt = NOW()
      WHERE id = :id AND status = 'pending'
    `;

    const [result] = await db.query(query, {
      replacements: { status, id }
    });

    // ✅ Handle invalid id OR non-pending status
    if (result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid id or request is not pending"
      });
    }

    res.status(200).json({
      success: true,
      message: "Status updated successfully",
      newStatus: status
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Update failed",
      error: error.message
    });
  }
};












//change inProgress status into successful
const handlePaymentRequest = async (req, res) => {
  try {
    const { id, action } = req.body; // form-data also comes in req.body

    if (!id || !action) {
      return res.status(400).json({
        success: false,
        message: "id and action are required",
      });
    }

    // Find redeem request
    const request = await RedeemHistory.findOne({
      where: { id: id }
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Payment request not found",
      });
    }

    // Only allow if status is inProgress
    if (request.status !== "inProgress") {
      return res.status(400).json({
        success: false,
        message: "Only inProgress requests can be resolved",
      });
    }

    // Action handling
    if (action === "resolved") {
      request.status = "successful";
      request.paymentDate = new Date(); // current server time
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid action",
      });
    }

    await request.save();

    return res.status(200).json({
      success: true,
      message: "Payment request updated successfully",
      data: request,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error updating payment request",
      error: error.message,
    });
  }
};

module.exports = {
  getActivePaymentRequests,
  getPendingPaymentRequests,
  getRedeemedPaymentRequests,
  updateRedeemStatus,
  handlePaymentRequest
};