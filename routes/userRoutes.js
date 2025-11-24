const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");   

const { 
    ragistar, 
    signup,
    getAllUser, 
    getUserById,
    updateProfilePic ,
    logout
} = require("../controllers/fb-userController");

const { 
    SendMessage,
    getAllMessage 
} = require('../controllers/chatController');


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


// Routes
router.post("/registar", ragistar);
router.post("/signup", signup);
router.post("/logout", logout);

router.post("/send", SendMessage);
router.get("/messages/:sender/:receiver", getAllMessage);

router.get("/allusers", getAllUser);
router.get("/user/:id", getUserById);

router.post("/updateProfilePic", upload.single("image"), updateProfilePic);

module.exports = router;
