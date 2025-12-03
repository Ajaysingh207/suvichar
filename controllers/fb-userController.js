// controllers/fb-userController.js

const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_is_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

/**
 * Register user (keeps original name 'ragistar' to avoid breaking routes)
 */
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

    const hashPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      userName,
      name,
      password: hashPassword,
      surname,
      day,
      month,
      year,
      gender,
      role,
      image: req.file ? req.file.filename : null
    });

    await newUser.save();

    // Do not return password
    const userToReturn = newUser.toObject();
    delete userToReturn.password;

    return res.status(201).json({ message: "User registered successfully", user: userToReturn });
  } catch (error) {
    console.error("Error in ragistar:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * Login
 */
async function signup(req, res) {
  try {
    const { userName, password } = req.body;

    if (!userName || !password) {
      return res.status(400).json({ message: "Username and password fields are required" });
    }

    const user = await User.findOne({ userName });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id, userName: user.userName, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // cookie settings: adjust secure/sameSite in production appropriately
    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // set true on HTTPS in production
      sameSite: "lax",
      maxAge: 1000 * 60 * 60
    });

    return res.status(200).json({
      message: "Login successful",
      role: user.role,
      user: user._id,
      token
    });
  } catch (error) {
    console.error("Error in signup:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * Get user by id (without password)
 */
async function getUserById(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "User found", user });
  } catch (error) {
    console.error("Error getting user by ID:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * Get all users (exclude passwords)
 */
async function getAllUser(req, res) {
  try {
    const users = await User.find().select("-password");

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "Users not found" });
    }

    return res.status(200).json({ users, message: "All users" });
  } catch (error) {
    console.error("Error in getAllUser:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * Update profile picture (expects multipart/form-data with field name 'image')
 */
const updateProfilePic = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Valid userId is required" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image uploaded" });
    }

    const imageName = req.file.filename;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { image: imageName },
      { new: true, select: "-password" }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, message: "Profile picture updated", user: updatedUser });
  } catch (error) {
    console.error("Error updating profile picture:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Logout - clear cookie
 */
const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: false, // true on prod HTTPS
      sameSite: "lax"
    });

    return res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Update user (basic example)
 */
async function userUpdate(req, res) {
  try {
    const { id, name, surname, day, month, year, gender } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Valid user id is required" });
    }

    const updated = await User.findByIdAndUpdate(
      id,
      { name, surname, day, month, year, gender },
      { new: true, select: "-password" }
    );

    if (!updated) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "User updated", user: updated });
  } catch (error) {
    console.error("Error in userUpdate:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * Delete user
 */
async function userDelete(req, res) {
  try {
    const { id } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Valid user id is required" });
    }

    await User.findByIdAndDelete(id);
    return res.status(200).json({ message: "User deleted" });
  } catch (error) {
    console.error("Error in userDelete:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * Block user
 * Body: { userId, blockId }
 */
async function blockUser(req, res) {
  try {
    const { userId, blockId } = req.body;

    if (!userId || !blockId) {
      return res.status(400).json({ message: "userId and blockId are required" });
    }
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(blockId)) {
      return res.status(400).json({ message: "Invalid user id(s)" });
    }
    if (userId === blockId) {
      return res.status(400).json({ message: "You cannot block yourself" });
    }

    await User.findByIdAndUpdate(userId, { $addToSet: { blockedUsers: blockId } });

    // Optionally remove them from friends and friendRequests when blocking
    await User.findByIdAndUpdate(userId, { $pull: { friends: blockId, "friendRequests.received": blockId, "friendRequests.sent": blockId } });
    await User.findByIdAndUpdate(blockId, { $pull: { friends: userId, "friendRequests.received": userId, "friendRequests.sent": userId } });

    return res.status(200).json({ message: "User blocked" });
  } catch (err) {
    console.error("Error in blockUser:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * Unblock user
 * Body: { userId, blockId }
 */
async function unblockUser(req, res) {
  try {  
    const { userId, blockId } = req.body;

    if (!userId || !blockId) { 
      return res.status(400).json({ message: "userId and blockId are required" });
    }
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(blockId)) {
      return res.status(400).json({ message: "Invalid user id(s)" });
    }

    await User.findByIdAndUpdate(userId, { $pull: { blockedUsers: blockId } });

    return res.status(200).json({ message: "User unblocked" });
  } catch (err) {
    console.error("Error in unblockUser:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * Send friend request
 * Body: { from, to }
 */
async function sendFriendRequest(req, res) {
  try {
    const { from, to } = req.body;

    if (!from || !to) {
      return res.status(400).json({ message: "from and to are required" });
    }
    if (!mongoose.Types.ObjectId.isValid(from) || !mongoose.Types.ObjectId.isValid(to)) {
      return res.status(400).json({ message: "Invalid user id(s)" });
    }
    if (from === to) {
      return res.status(400).json({ message: "Cannot send friend request to yourself" });
    }

    const fromUser = await User.findById(from);
    const toUser = await User.findById(to);

    if (!fromUser || !toUser) return res.status(404).json({ message: "User not found" });

    // If either blocked the other
    if (fromUser.blockedUsers.includes(to) || toUser.blockedUsers.includes(from)) {
      return res.status(403).json({ message: "Cannot send friend request due to block" });
    }

    // If already friends
    if (fromUser.friends.some(id => id.toString() === to.toString())) {
      return res.status(400).json({ message: "Already friends" });
    }

    // If request already sent or received
    if (fromUser.friendRequests.sent.some(id => id.toString() === to.toString())) {
      return res.status(400).json({ message: "Friend request already sent" });
    }
    if (fromUser.friendRequests.received.some(id => id.toString() === to.toString())) {
      return res.status(400).json({ message: "You already have a request from this user" });
    }

    await User.findByIdAndUpdate(from, { $addToSet: { "friendRequests.sent": to } });
    await User.findByIdAndUpdate(to, { $addToSet: { "friendRequests.received": from } });

    return res.status(200).json({ message: "Friend request sent" });
  } catch (error) {
    console.error("Error in sendFriendRequest:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * Accept friend request
 * Body: { from, to }  where `from` is the sender of request and `to` is the one accepting
 */
async function acceptFriendRequest(req, res) {
  try {
    const { from, to } = req.body;

    if (!from || !to) {
      return res.status(400).json({ message: "from and to are required" });
    }
    if (!mongoose.Types.ObjectId.isValid(from) || !mongoose.Types.ObjectId.isValid(to)) {
      return res.status(400).json({ message: "Invalid user id(s)" });
    }

    const sender = await User.findById(from);
    const receiver = await User.findById(to);

    if (!sender || !receiver) return res.status(404).json({ message: "User not found" });

    // Ensure there is a received request
    if (!receiver.friendRequests.received.some(id => id.toString() === from.toString())) {
      return res.status(400).json({ message: "No friend request to accept" });
    }

    // Add each other as friends and remove friendRequests
    await User.findByIdAndUpdate(from, {
      $pull: { "friendRequests.sent": to },
      $addToSet: { friends: to }
    });

    await User.findByIdAndUpdate(to, {
      $pull: { "friendRequests.received": from },
      $addToSet: { friends: from }
    });

    return res.status(200).json({ message: "Friend request accepted" });
  } catch (error) {
    console.error("Error in acceptFriendRequest:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * Reject friend request
 * Body: { from, to }
 */
async function rejectFriendRequest(req, res) {
  try {
    const { from, to } = req.body;

    if (!from || !to) {
      return res.status(400).json({ message: "from and to are required" });
    }
    if (!mongoose.Types.ObjectId.isValid(from) || !mongoose.Types.ObjectId.isValid(to)) {
      return res.status(400).json({ message: "Invalid user id(s)" });
    }

    await User.findByIdAndUpdate(from, { $pull: { "friendRequests.sent": to } });
    await User.findByIdAndUpdate(to, { $pull: { "friendRequests.received": from } });

    return res.status(200).json({ message: "Friend request rejected" });
  } catch (error) {
    console.error("Error in rejectFriendRequest:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  ragistar,
  signup,
  getAllUser,
  getUserById,
  updateProfilePic,
  logout,
  userUpdate,
  userDelete,
  blockUser,
  unblockUser,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest
};
