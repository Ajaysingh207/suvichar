require('dotenv').config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cookieParser = require("cookie-parser");
const cors = require("cors");


const dbConnectt = require("./db/dbConnect");
const userRoutes = require("./routes/userRoutes");
const {chatController} = require("./controllers/chatController");

const app = express();
const server = http.createServer(app);

dbConnectt();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static("uploads"));

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
}));

app.use("/api", userRoutes);
app.use("/", (req, res) => {
  res.send("You are hosting on Vercel");
});

// Attach Socket.io Server
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Move all socket logic to controller

chatController(io);

 const port = process.env.PORT
server.listen(port, () => console.log(`Server running on http://localhost:${port}`));
  