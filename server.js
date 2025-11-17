const express = require("express");
const dbConnectt = require("./db/dbConnect");

const userRoutes = require("./routes/userRoutes");
const cors = require("cors")


const app = express();
const port = 3000;

// Connect to MongoDB
dbConnectt();

// Middleware to parse JSON
app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true, 
  })
);

// Routes
app.use("/api", userRoutes);

// Start server
app.listen(port, () => console.log(`Server is running on http://localhost:${port}`));
