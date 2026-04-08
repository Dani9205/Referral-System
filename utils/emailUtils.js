// const nodemailer = require("nodemailer");

// const sendEmail = async (to, subject, message) => {

//   const transporter = nodemailer.createTransport({
//     host: process.env.MAIL_HOST,
//     port: process.env.MAIL_PORT,
//     secure: false, // because port 587
//     auth: {
//       user: process.env.MAIL_USER,
//       pass: process.env.MAIL_PASS
//     },
//     tls: {
//       rejectUnauthorized: false
//     }
//   });

//   const info = await transporter.sendMail({
//     from: process.env.MAIL_USER,
//     to: to,
//     subject: subject,
//     text: message
//   });

//   console.log("Email sent:", info.response);
// };

// module.exports = sendEmail;

const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, message) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: parseInt(process.env.MAIL_PORT),
      secure: process.env.MAIL_SECURE === 'true', // true for 465, false for 587
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
      },
      tls: { rejectUnauthorized: false },
      logger: true,
      debug: true
    });

    const info = await transporter.sendMail({
      from: process.env.MAIL_USER,
      to,
      subject,
      text: message
    });

    console.log("Email sent:", info.response);
  } catch (error) {
    console.error("Email Error:", error);
    throw error;
  }
};

module.exports = sendEmail;