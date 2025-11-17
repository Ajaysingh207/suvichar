const express = require("express");
const router = express.Router();
const {ragistar,signup} = require("../controllers/fb-userController");


router.post("/registar", ragistar);
router.post("/signup",signup);

module.exports = router;
