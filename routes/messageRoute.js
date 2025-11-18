// const express = require("express");
// const router = express.Router();
// const Message = require("../models/messages");

// router.get("/messages/:sender/:receiver", async (req, res) => {
//     const { sender, receiver } = req.params;

//     const messages = await Message.find({
//         $or: [
//             { sender, receiver },
//             { sender: receiver, receiver: sender }
//         ]
//     }).sort({ createdAt: 1 });

//     res.json(messages);
// });

// Send message (POST)
// router.post("/send", async (req, res) => {
//     try {
//         const { sender, receiver, message } = req.body;

//         const newMessage = new Message({
//             sender,
//             receiver,
//             message,
//             createdAt: new Date()
//         });

//         await newMessage.save();
//         res.status(201).json({ success: true, message: "Message sent" });

//     } catch (error) {
//         console.log(error);
//         res.status(500).json({ error: "Failed to send message" });
//     }
// });


// module.exports = router;
 