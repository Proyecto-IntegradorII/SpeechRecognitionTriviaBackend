const express = require("express");
const router = express.Router();

const { saaveChat, getChaat} = require("../controllers/chatController");

router.post("/saaveChat",saaveChat);
router.get("getChaat/:user_id",getChaat);

module.exports = router;