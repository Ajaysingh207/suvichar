const Message = require("../models/messages");

// Socket.io controller
function chatController(io) {
    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        // Join a chat room
        socket.on("joinRoom", ({ senderId, receiverId }) => {
            const roomId = `${senderId}_${receiverId}`;
            socket.join(roomId);
            console.log(`User joined room: ${roomId}`);
        });

        // Handle sending message via socket
        socket.on("sendMessage", async ({ sender, receiver, message }) => {
            try {
                const newMessage = new Message({ sender, receiver, message });
                await newMessage.save();

                const roomId = `${sender}_${receiver}`;
                io.to(roomId).emit("receiveMessage", newMessage);
            } catch (err) {
                console.error("Error saving message:", err);
            }
        });

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
        });
    });
}

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


