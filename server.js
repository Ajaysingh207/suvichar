const express = require("express");
const dbConnectt = require("./db/dbConnect");

const userRoutes = require("./routes/userRoutes");
const cors = require("cors")
const cookieParser = require("cookie-parser");


const app = express();
const port = 3000;

dbConnectt();

app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true, 
  })
);

app.use(cookieParser());


app.use("/api", userRoutes);

app.listen(port, () => console.log(`Server is running on http://localhost:${port}`));
