const Message = require("../models/messages");
// controllers/chatController.js

function chatController(io) {
  const onlineUsers = {}; // { userId: socketId }

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // When client announces its userId after connection
    socket.on("userOnline", (userId) => {
      onlineUsers[userId] = socket.id;
      io.emit("onlineUsers", Object.keys(onlineUsers)); // broadcast list of online userIds
      console.log("User online:", userId);
    });

    socket.on("userOffline", (userId) => {
      delete onlineUsers[userId];
      io.emit("onlineUsers", Object.keys(onlineUsers));
      console.log("User offline:", userId);
    });

    // Join a deterministic room for the pair (sorted)
    socket.on("joinRoom", ({ senderId, receiverId }) => {
      const roomId = [senderId, receiverId].sort().join("_");
      socket.join(roomId);
      // optionally emit who joined
      // socket.to(roomId).emit("userJoinedRoom", { userId: senderId });
      // console.log(`Socket ${socket.id} joined ${roomId}`);
    });

    // Typing indicator
    socket.on("typing", ({ from, to }) => {
      // notify only the recipient (if online)
      const toSocket = onlineUsers[to];
      if (toSocket) io.to(toSocket).emit("typing", { from });
    });

    socket.on("stopTyping", ({ from, to }) => {
      const toSocket = onlineUsers[to];
      if (toSocket) io.to(toSocket).emit("stopTyping", { from });
    });

    // Sending message
    socket.on("sendMessage", async ({ sender, receiver, message }) => {
      try {
        // Save to DB
        const newMessage = new Message({ sender, receiver, message });
        const saved = await newMessage.save();

        // Determine room (sorted)
        const roomId = [sender, receiver].sort().join("_");

        // Emit single event to the room
        io.to(roomId).emit("receiveMessage", {
          _id: saved._id,
          sender: saved.sender.toString(),
          receiver: saved.receiver.toString(),
          message: saved.message,
          createdAt: saved.createdAt || new Date().toISOString()
        });

        // Optionally notify recipient separately (if they are not in the room)
        const recipientSocket = onlineUsers[receiver];
        if (recipientSocket) {
          // we already emitted to the room; this is only for push-like notifications
          io.to(recipientSocket).emit("newMessageNotification", {
            from: sender,
            message: saved.message,
            createdAt: saved.createdAt || new Date().toISOString()
          });
        }
      } catch (err) {
        console.error("Error in sendMessage:", err);
      }
    });

    // Message seen (read receipt) — client emits when they open a chat or view a message
    socket.on("messageSeen", ({ messageId, seenBy, chatWith }) => {
      // Broadcast to the other user in that chat that messageId has been seen
      // chatWith is the id of the other user in that conversation
      const roomId = [seenBy, chatWith].sort().join("_");
      io.to(roomId).emit("messageSeenUpdate", { messageId, seenBy, chatWith });
    });

    socket.on("disconnect", () => {
      // Remove user from onlineUsers if present
      for (const [uid, sid] of Object.entries(onlineUsers)) {
        if (sid === socket.id) {
          delete onlineUsers[uid];
          io.emit("onlineUsers", Object.keys(onlineUsers));
          break;
        }
      }
      console.log("Socket disconnected:", socket.id);
    });
  });
}



// function chatController(io) {
//     io.on("connection", (socket) => {
//         console.log("User connected:", socket.id);

//         // Join a chat room
//         socket.on("joinRoom", ({ senderId, receiverId }) => {
//             const roomId = `${senderId}_${receiverId}`;
//             socket.join(roomId);
//             console.log(`User joined room: ${roomId}`);
//         });

//         // Handle sending message via socket
//         socket.on("sendMessage", async ({ sender, receiver, message }) => {
//             try {
//                 const newMessage = new Message({ sender, receiver, message });
//                 await newMessage.save();

//                 const roomId = `${sender}_${receiver}`;
//                 io.to(roomId).emit("receiveMessage", newMessage);
//             } catch (err) {
//                 console.error("Error saving message:", err);
//             }
//         });

//         socket.on("disconnect", () => {
//             console.log("User disconnected:", socket.id);
//         });
//     });
// }

// Express route handler
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
        res.status(201).json({ success: true, message: "Message sent" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Failed to send message" });
    }
}

async function getAllMessage(req, res)  {
    const { sender, receiver } = req.params;

    const messages = await Message.find({
        $or: [
            { sender, receiver },
            { sender: receiver, receiver: sender }
        ]
    }).sort({ createdAt: 1 });

    res.json(messages);
};

module.exports = { chatController, SendMessage,getAllMessage };


