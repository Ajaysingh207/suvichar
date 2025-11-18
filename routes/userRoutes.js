const express = require("express");
const router = express.Router();

const { ragistar, signup } = require("../controllers/fb-userController");
const messageRoutes = require("./messageRoute");
const { chatController, SendMessage , getAllMessage} = require('../controllers/chatController');

router.post("/registar", ragistar);
router.post("/signup", signup);
router.post("/send", SendMessage);
router.get("/messages/:sender/:receiver", getAllMessage);

module.exports = router;


