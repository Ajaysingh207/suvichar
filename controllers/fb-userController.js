const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
async function ragistar(req, res) {
    try {
        const {name,userName, password,surname,day,month,year,gender } = req.body;

        if (!userName || !password) {
            return res.status(400).json({ message: "Username and password fields are required" });
        }
        const existingUser = await User.findOne({ userName });
        if (existingUser) {
            return res.status(409).json({ message: "Username already exists" });
        }
        const hashPassword = await bcrypt.hash(password, 10)
        const newUser = new User({ userName, name, password: hashPassword, surname,day,month,year,gender });
        await newUser.save();

        res.status(201).json({ message: "User registered successfully", user: newUser });
    } catch (error) {
        console.error("Error in createUser:", error);
        res.status(500).json({ message: "Server error" });
    }
}

async function signup(req, res) {
    try {


        const { userName, password } = req.body

        if (!userName || !password) {
            return res.status(400).json({ message: "Username and password fields are required" })
        }

        const user = await User.findOne({ userName })
        if (!user) {
            return res.status(401).json({ message: "invalid credencial " })
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(401).json({ message: "invalid credencial" })
        }

        const token = jwt.sign({ id: user._id, userName: user.userName }, "your_jwt_is_secret", { expiresIn: "1h" })

        res.status(201).json({ message: "login successfully", token: token })
    } catch (error) {
        console.log(error, "server error");

    }

}

module.exports = { ragistar, signup } 
