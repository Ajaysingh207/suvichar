// controllers/chatController.js
const Message = require("../models/messages");

function chatController(io) {
  const onlineUsers = {}; // { userId: socketId }

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    /* ------------------------- USER ONLINE STATUS ------------------------- */
    socket.on("userOnline", (userId) => {
      onlineUsers[userId] = socket.id;
      io.emit("onlineUsers", Object.keys(onlineUsers));
      console.log("User online:", userId);
    });

    socket.on("userOffline", (userId) => {
      delete onlineUsers[userId];
      io.emit("onlineUsers", Object.keys(onlineUsers));
      console.log("User offline:", userId);
    });

    /* ------------------------- USER JOINS ROOM ---------------------------- */
    socket.on("joinRoom", ({ senderId, receiverId }) => {
      const roomId = [senderId, receiverId].sort().join("_");
      socket.join(roomId);
      console.log(`User joined room: ${roomId}`);
    });

    /* ------------------------- TYPING INDICATOR --------------------------- */
    socket.on("typing", ({ from, to }) => {
      const receiverSocket = onlineUsers[to];
      if (receiverSocket) {
        io.to(receiverSocket).emit("typing", { from });
      }
    });

    socket.on("stopTyping", ({ from, to }) => {
      const receiverSocket = onlineUsers[to];
      if (receiverSocket) {
        io.to(receiverSocket).emit("stopTyping", { from });
      }
    });

    /* ---------------------------- SEND MESSAGE ---------------------------- */
    socket.on("sendMessage", async ({ sender, receiver, message }) => {
      try {
        const newMessage = new Message({
          sender,
          receiver,
          message,
          createdAt: new Date()
        });

        const saved = await newMessage.save();

        const roomId = [sender, receiver].sort().join("_");

        // Emit real-time message to both users in the room
        io.to(roomId).emit("receiveMessage", {
          _id: saved._id,
          sender: saved.sender,
          receiver: saved.receiver,
          message: saved.message,
          createdAt: saved.createdAt
        });

        
        const receiverSocket = onlineUsers[receiver];
        if (receiverSocket) {
          io.to(receiverSocket).emit("newMessageNotification", {
            from: sender,
            message: saved.message,
            createdAt: saved.createdAt
          });
        }
      } catch (err) {
        console.error("Error sending message:", err);
      }
    });

    /* ------------------------------ SEEN STATUS --------------------------- */
    socket.on("messageSeen", ({ messageId, seenBy, chatWith }) => {
      const roomId = [seenBy, chatWith].sort().join("_");
      io.to(roomId).emit("messageSeenUpdate", {
        messageId,
        seenBy,
        chatWith
      });
    });

    /* ------------------------------ DISCONNECT ---------------------------- */
    socket.on("disconnect", () => {
      for (const [userId, socketId] of Object.entries(onlineUsers)) {
        if (socketId === socket.id) {
          delete onlineUsers[userId];
          io.emit("onlineUsers", Object.keys(onlineUsers));
          console.log("User offline:", userId);
          break;
        }
      }
      console.log("Socket disconnected:", socket.id);
    });
  });
}

/* -------------------------------------------------------------------------- */
/*                               EXPRESS ROUTES                               */
/* -------------------------------------------------------------------------- */

async function SendMessage(req, res) {
  try {
    const { sender, receiver, message } = req.body;

    const newMessage = new Message({
      sender,
      receiver,
      message,
      createdAt: new Date()
    });

    await newMessage.save();

    return res.status(201).json({
      success: true,
      message: "Message sent successfully"
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({ error: "Failed to send message" });
  }
}

async function getAllMessage(req, res) {
  try {
    const { sender, receiver } = req.params;

    const messages = await Message.find({
      $or: [
        { sender, receiver },
        { sender: receiver, receiver: sender }
      ]
    }).sort({ createdAt: 1 });

    return res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return res.status(500).json({ error: "Failed to get messages" });
  }
}

module.exports = { chatController, SendMessage, getAllMessage };
