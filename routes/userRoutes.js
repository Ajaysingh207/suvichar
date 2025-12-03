const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { 
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
} = require("../controllers/fb-userController");


const {SendMessage,getAllMessage} = require("../controllers/chatController");


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./uploads");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});


const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only JPEG, PNG and JPG images allowed"), false);
    }
};

const upload = multer({ storage, fileFilter });

// ==========================
// USER ROUTES
// ==========================


router.post("/register", ragistar); 

router.post("/signup", signup);


router.post("/logout", logout);


router.get("/allusers", getAllUser);


router.get("/user/:id", getUserById);


router.patch("/updateProfilePic", upload.single("image"), updateProfilePic);


router.patch("/updateUser", userUpdate);


router.delete("/deleteUser", userDelete);

// ==========================
// FRIEND REQUEST ROUTES
// ==========================

// Send Friend Request
router.post("/friend/send", sendFriendRequest);

// Accept Friend Request
router.post("/friend/accept", acceptFriendRequest);


router.post("/friend/reject", rejectFriendRequest);

// ==========================
// BLOCK / UNBLOCK ROUTES
// ==========================


router.post("/block", blockUser);


router.post("/unblock", unblockUser);

// ==========================
// CHAT ROUTES
// ==========================
router.post("/send", SendMessage);

router.get("/messages/:sender/:receiver", getAllMessage);

module.exports = router;
