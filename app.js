// const express = require("express");
// const { Server } = require('socket.io');
// const sequelize = require('./config/db');
// const ChatController = require('./controllers/ChatController');
// const http = require('http');
// const path = require('path');
// const imageUploadRoutes = require('./routes/imageUploadRoutes');
// const cors = require("cors");
// require('dotenv').config();
// require('./models/association');

// const universalRoutes = require("./routes/universal");
// const referralRoutes = require("./routes/referralRoutes");
// const authRoutes = require("./routes/auth/authRoutes");
// const referralManagerRoutes = require('./routes/referralManagerRoutes');  //new


// const app = express();
// const server = http.createServer(app); // Create an HTTP server for the express app
// const io = new Server(server); // Attach Socket.IO to the HTTP server

// sequelize.sync().then(() => console.log('Database synced'));

// // Middleware to serve static files
// app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// // ✅ Enable CORS for frontend
// app.use(cors());

// // ✅ Parse body
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Serve Universal Links and App Links files
// app.use(express.static(".well-known"));

// app.get("/.well-known/assetlinks.json", (req, res) => {
//     res.sendFile(path.join(__dirname, ".well-known", "assetlinks.json"), {
//         headers: {
//             "Content-Type": "application/json",
//         },
//     });
// });

// // Serve fallback HTML pages
// app.use(express.static("public"));

// // Mount routes
// app.use("/", universalRoutes);
// app.use('/api/referrals', referralRoutes);
// app.use('/api/auth', authRoutes);
// app.use('/api', referralManagerRoutes);        //new

// // Initialize the ChatController with Socket.IO
// new ChatController(io);

// app.get('/test', (req, res) => {
//     res.send('Welcome to Referral APIs!');
// });

// // Start the server
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//     console.log(`Server running on http://localhost:${PORT}`);
// });








const express = require("express");
const { Server } = require('socket.io');
const sequelize = require('./config/db');
const ChatController = require('./controllers/referralChatController');
const http = require('http');
const path = require('path');
const imageUploadRoutes = require('./routes/imageUploadRoutes');
const cors = require("cors");
require('dotenv').config();
require('./models/association');

const universalRoutes = require("./routes/universal");
const referralRoutes = require("./routes/referralRoutes");
const referralAuthRoutes = require("./routes/auth/authRoutes");
const referralManagerSysRoutes = require('./routes/referral/referralManagerRoutes');  //new
const paymentRequestRoute = require("./routes/paymentRequestRoute");

const app = express();
const server = http.createServer(app); // Create an HTTP server for the express app
const io = new Server(server); // Attach Socket.IO to the HTTP server

// Sync database
sequelize.sync().then(() => console.log('Database synced'));

// ✅ Middleware to serve uploads folder correctly
// Matches where Multer saves files: ./uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Enable CORS for frontend
app.use(cors());

// ✅ Parse request body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Universal Links and App Links files
app.use(express.static(".well-known"));

app.get("/.well-known/assetlinks.json", (req, res) => {
    res.sendFile(path.join(__dirname, ".well-known", "assetlinks.json"), {
        headers: {
            "Content-Type": "application/json",
        },
    });
});

// Serve fallback HTML pages
app.use(express.static("public"));

// Mount routes
app.use("/", universalRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/auth', referralAuthRoutes);
app.use('/api', referralManagerSysRoutes);        //new
app.use('/api/upload', imageUploadRoutes);     // Optional: if you have separate upload route
app.use("/api/payments", paymentRequestRoute);

// Initialize the ChatController with Socket.IO
new ChatController(io);

// Test route
app.get('/test', (req, res) => {
    res.send('Welcome to Referral APIs!');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
