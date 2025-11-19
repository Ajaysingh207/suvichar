const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
async function ragistar(req, res) {
    try {
        const { name, userName, password, surname, day, month, year, gender, role } = req.body;

        if (!userName || !password) {
            return res.status(400).json({ message: "Username and password fields are required" });
        }
        const existingUser = await User.findOne({ userName });
        if (existingUser) {
            return res.status(409).json({ message: "Username already exists" });
        }
        const hashPassword = await bcrypt.hash(password, 10)
        const newUser = new User({ userName, name, password: hashPassword, surname, day, month, year, gender, role });
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
        const token = jwt.sign({ id: user._id, userName: user.userName, role: user.role }, "your_jwt_is_secret", { expiresIn: "1h" })

        res.cookie("token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 1000 * 60 * 60
        });

        res.status(200).json({
            message: "Login successfully",
            role: user.role,
            user: user._id,
            token: token
        });

    } catch (error) {
        console.log(error, "server error");

    }

}

async function getAllUser(req, res) {
    try {
        const user = await User.find()
        if (user.length === 0) {
           return res.status(404).json({ message: "user not found" })
        }

      return  res.status(200).json({ user: user, message: "all users " })
    }
    catch (error) {
        console.log(error, "something went wrong ");
        return res.status(500).json({ message: "Server error" });
    }

}


module.exports = { ragistar, signup, getAllUser } 
