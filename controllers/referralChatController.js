const ReferralChat = require('../models/ReferralChat');
const { Op } = require('sequelize');

class ChatController {
    constructor(io) {
        this.io = io;
        this.initializeSocketEvents();
    }

    getRoom(senderId, receiverId) {
        return [String(senderId), String(receiverId)].sort().join('-');
    }

    initializeSocketEvents() {
        this.io.on('connection', (socket) => {
            console.log('User connected:', socket.id);

            // Join chat room
            socket.on('joinChat', ({ senderId, receiverId }) => {
                if (!senderId || !receiverId) {
                    socket.emit('joinChatError', { message: 'senderId and receiverId are required' });
                    return;
                }

                const room = this.getRoom(senderId, receiverId);
                socket.join(room);

                console.log(`User joined room: ${room}`);
            });

            // Typing indicator
            socket.on('typing', ({ senderId, receiverId }) => {
                if (!senderId || !receiverId) return;

                const room = this.getRoom(senderId, receiverId);

                socket.to(room).emit('userTyping', {
                    senderId,
                    message: 'User is typing...',
                });
            });

            socket.on('stopTyping', ({ senderId, receiverId }) => {
                if (!senderId || !receiverId) return;

                const room = this.getRoom(senderId, receiverId);

                socket.to(room).emit('userStoppedTyping', {
                    senderId,
                });
            });

            // Send message
            socket.on('sendMessage', async (payload) => {
                const {
                    senderId,
                    receiverId,
                    message,
                    senderType,
                    messageType,
                } = payload;

                if (!senderId || !receiverId || !senderType || !messageType) {
                    socket.emit('sendMessageError', {
                        message: 'senderId, receiverId, senderType and messageType are required',
                    });
                    return;
                }

                const allowedSenderTypes = ['user', 'manager'];
                const allowedMessageTypes = ['text', 'image'];

                if (!allowedSenderTypes.includes(senderType)) {
                    socket.emit('sendMessageError', {
                        message: 'Invalid senderType. Allowed: user, manager',
                    });
                    return;
                }

                if (!allowedMessageTypes.includes(messageType)) {
                    socket.emit('sendMessageError', {
                        message: 'Invalid messageType. Allowed: text, image',
                    });
                    return;
                }

                if (messageType === 'text' && (!message || !String(message).trim())) {
                    socket.emit('sendMessageError', {
                        message: 'Text message cannot be empty',
                    });
                    return;
                }

                if (messageType === 'image' && (!message || !String(message).trim())) {
                    socket.emit('sendMessageError', {
                        message: 'Image message must contain image path/name/url',
                    });
                    return;
                }

                const room = this.getRoom(senderId, receiverId);

                try {
                    const newMessage = await ReferralChat.create({
                        senderId,
                        receiverId,
                        senderType,
                        message: String(message).trim(),
                        messageType,
                        readStatus: 0,
                    });

                    this.io.to(room).emit('receiveMessage', newMessage);
                } catch (error) {
                    console.error('Error sending message:', error);
                    socket.emit('sendMessageError', {
                        message: 'Failed to send message',
                    });
                }
            });

            // Fetch chat history
            socket.on('fetchMessages', async ({ senderId, receiverId }) => {
                if (!senderId || !receiverId) {
                    socket.emit('previousMessages', []);
                    return;
                }

                try {
                    const messages = await ReferralChat.findAll({
                        where: {
                            [Op.or]: [
                                { senderId, receiverId },
                                { senderId: receiverId, receiverId: senderId },
                            ],
                        },
                        order: [['createdAt', 'ASC']],
                    });

                    socket.emit('previousMessages', messages);
                } catch (error) {
                    console.error('Error fetching messages:', error);
                    socket.emit('previousMessages', []);
                }
            });

            // Mark single message as read
            socket.on('markMessageAsRead', async ({ messageId }) => {
                if (!messageId) return;

                try {
                    const chat = await ReferralChat.findByPk(messageId);

                    if (!chat) {
                        socket.emit('markReadError', { message: 'Message not found' });
                        return;
                    }

                    await chat.update({ readStatus: 1 });

                    const room = this.getRoom(chat.senderId, chat.receiverId);

                    this.io.to(room).emit('messageRead', {
                        messageId: chat.id,
                        readStatus: 1,
                    });

                    console.log(`Message ${messageId} marked as read`);
                } catch (error) {
                    console.error('Error marking message as read:', error);
                    socket.emit('markReadError', {
                        message: 'Failed to mark message as read',
                    });
                }
            });

            // Mark all messages as read for one chat
            socket.on('markAllMessagesAsRead', async ({ senderId, receiverId, readerId }) => {
                if (!senderId || !receiverId || !readerId) return;

                try {
                    await ReferralChat.update(
                        { readStatus: 1 },
                        {
                            where: {
                                senderId,
                                receiverId,
                                readStatus: 0,
                            },
                        }
                    );

                    const room = this.getRoom(senderId, receiverId);

                    this.io.to(room).emit('allMessagesRead', {
                        senderId,
                        receiverId,
                        readerId,
                    });
                } catch (error) {
                    console.error('Error marking all messages as read:', error);
                    socket.emit('markReadError', {
                        message: 'Failed to mark all messages as read',
                    });
                }
            });

            socket.on('disconnect', () => {
                console.log('User disconnected:', socket.id);
            });
        });
    }
}

module.exports = ChatController;










// const ReferralChat = require('../models/ReferralChat');
// const { Op } = require('sequelize');
// const fs = require('fs');
// const path = require('path');

// class ChatController {
//     constructor(io) {
//         this.io = io;
//         this.initializeSocketEvents();
//     }

//     initializeSocketEvents() {
//         this.io.on('connection', (socket) => {
//             console.log('User connected:', socket.id);

//             // Join a chat room
//             socket.on('joinChat', ({ senderId, receiverId }) => {
//                 const room = [senderId, receiverId].sort().join('-');
//                 socket.join(room);
//                 console.log(`User joined room: ${room}`);
//             });

//             // realtime sync that user is tying
//             socket.on('typing', ({ senderId, receiverId }) => {
//                 const room = [senderId, receiverId].sort().join('-');
//                 socket.to(room).emit('userTyping', { senderId, message: 'User is typing...' });
//             });

//             socket.on('stopTyping', ({ senderId, receiverId }) => {
//                 const room = [senderId, receiverId].sort().join('-');
//                 socket.to(room).emit('userStoppedTyping', { senderId });
//             });
//             // realtime sync that user is tying end

//             // Send a message
//             socket.on('sendMessage', async ({ senderId, receiverId, message, managerId, senderType, messageType }) => {
//                 const room = [senderId, receiverId].sort().join('-');

//                 try {
//                     // Create message entry in the database (save only image name)
//                     const newMessage = await ReferralChat.create({
//                         senderId,
//                         receiverId,
//                         message: message || null, // Allow empty message if image is sent
//                         managerId: managerId || null, // Allow empty message if image is sent
//                         senderType,
//                         messageType: messageType, // text, image
//                     });

//                     // Send message to the room
//                     this.io.to(room).emit('receiveMessage', newMessage);
//                 } catch (error) {
//                     console.error('Error sending message:', error.message);
//                     socket.emit('sendMessageError', { message: 'Failed to send message' });
//                 }
//             });

//             // Fetch messages between users
//             socket.on('fetchMessages', async ({ senderId, receiverId }) => {
//                 const room = [senderId, receiverId].sort().join('-');

//                 try {
//                     const messages = await ReferralChat.findAll({
//                         where: {
//                             [Op.or]: [
//                                 { senderId, receiverId },
//                                 { senderId: receiverId, receiverId: senderId },
//                             ],
//                         },
//                         order: [['createdAt', 'ASC']],
//                     });

//                     // Emit messages
//                     socket.emit('previousMessages', messages);
//                 } catch (error) {
//                     console.error('Error fetching messages:', error.message);
//                     socket.emit('previousMessages', []);
//                 }
//             });

//             // Mark a message as read
//             socket.on('markMessageAsRead', async ({ messageId }) => {
//                 try {
//                     await ReferralChat.update({ readStatus: 1 }, { where: { id: messageId } });
//                     console.log(`Message ${messageId} marked as read`);
//                 } catch (error) {
//                     console.error('Error marking message as read:', error.message);
//                 }
//             });

//             // Update message status
//             socket.on('updateMessageStatus', async ({ messageId, status }) => {
//                 const allowedStatuses = ['pending', 'inprogress', 'unresolved', 'resolved'];

//                 if (!allowedStatuses.includes(status)) {
//                     console.error(`Invalid status: ${status}`);
//                     socket.emit('statusUpdateError', { message: 'Invalid status value' });
//                     return;
//                 }

//                 try {
//                     await ReferralChat.update({ status }, { where: { id: messageId } });
//                     console.log(`Message ${messageId} status updated to ${status}`);

//                     // Emit the updated status back to the client
//                     this.io.to(room).emit('statusUpdated', { messageId, status });
//                 } catch (error) {
//                     console.error('Error updating message status:', error.message);
//                     socket.emit('statusUpdateError', { message: 'Error updating status' });
//                 }
//             });

//             // Disconnect
//             socket.on('disconnect', () => {
//                 console.log('User disconnected:', socket.id);
//             });
//         });
//     }
// }

// module.exports = ChatController;

















// // const ReferralChat = require('../models/ReferralChat');
// // const { Op } = require('sequelize');
// // const fs = require('fs');
// // const path = require('path');

// // class ChatController {
// //     constructor(io) {
// //         this.io = io;
// //         this.initializeSocketEvents();
// //     }

// //     initializeSocketEvents() {
// //         this.io.on('connection', (socket) => {
// //             console.log('User connected:', socket.id);

// //             // Join a chat room
// //             socket.on('joinChat', ({ senderId, receiverId }) => {
// //                 const room = [senderId, receiverId].sort().join('-');
// //                 socket.join(room);
// //                 console.log(`User joined room: ${room}`);
// //             });
            
// //             // realtime sync that user is tying
// //             socket.on('typing', ({ senderId, receiverId }) => {
// //                 const room = [senderId, receiverId].sort().join('-');
// //                 socket.to(room).emit('userTyping', { senderId, message: 'User is typing...' });
// //             });
            
// //             socket.on('stopTyping', ({ senderId, receiverId }) => {
// //                 const room = [senderId, receiverId].sort().join('-');
// //                 socket.to(room).emit('userStoppedTyping', { senderId });
// //             });
// //             // realtime sync that user is tying end

// //             // Send a message
// //             socket.on('sendMessage', async ({ senderId, receiverId, message, managerId, senderType, messageType }) => {
// //                 const room = [senderId, receiverId].sort().join('-');
            
// //                 try {
// //                     // Create message entry in the database (save only image name)
// //                     const newMessage = await ReferralChat.create({
// //                         senderId,
// //                         receiverId,
// //                         message: message || null, // Allow empty message if image is sent
// //                         managerId: managerId || null, // Allow empty message if image is sent
// //                         senderType,
// //                         messageType: messageType, // text, image
// //                     });
            
// //                     // Send message to the room
// //                     this.io.to(room).emit('receiveMessage', newMessage);
// //                 } catch (error) {
// //                     console.error('Error sending message:', error.message);
// //                     socket.emit('sendMessageError', { message: 'Failed to send message' });
// //                 }
// //             });

// //             // Fetch messages between users
// //             socket.on('fetchMessages', async ({ senderId, receiverId }) => {
// //                 const room = [senderId, receiverId].sort().join('-');

// //                 try {
// //                     const messages = await ReferralChat.findAll({
// //                         where: {
// //                             [Op.or]: [
// //                                 { senderId, receiverId },
// //                                 { senderId: receiverId, receiverId: senderId },
// //                             ],
// //                         },
// //                         order: [['createdAt', 'ASC']],
// //                     });

// //                     // Emit messages
// //                     socket.emit('previousMessages', messages);
// //                 } catch (error) {
// //                     console.error('Error fetching messages:', error.message);
// //                     socket.emit('previousMessages', []);
// //                 }
// //             });

// //             // Mark a message as read
// //             socket.on('markMessageAsRead', async ({ messageId }) => {
// //                 try {
// //                     await ReferralChat.update({ readStatus: 1 }, { where: { id: messageId } });
// //                     console.log(`Message ${messageId} marked as read`);
// //                 } catch (error) {
// //                     console.error('Error marking message as read:', error.message);
// //                 }
// //             });

// //             // Update message status
// //             socket.on('updateMessageStatus', async ({ messageId, status }) => {
// //                 const allowedStatuses = ['pending', 'inprogress', 'unresolved', 'resolved'];

// //                 if (!allowedStatuses.includes(status)) {
// //                     console.error(`Invalid status: ${status}`);
// //                     socket.emit('statusUpdateError', { message: 'Invalid status value' });
// //                     return;
// //                 }

// //                 try {
// //                     await ReferralChat.update({ status }, { where: { id: messageId } });
// //                     console.log(`Message ${messageId} status updated to ${status}`);
                    
// //                     // Emit the updated status back to the client
// //                     socket.emit('statusUpdated', { messageId, status });
// //                 } catch (error) {
// //                     console.error('Error updating message status:', error.message);
// //                     socket.emit('statusUpdateError', { message: 'Error updating status' });
// //                 }
// //             });

// //             // Disconnect
// //             socket.on('disconnect', () => {
// //                 console.log('User disconnected:', socket.id);
// //             });
// //         });
// //     }
// // }

// // module.exports = ChatController;
