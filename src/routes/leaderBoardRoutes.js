const express = require("express");
const router = express.Router();
const {
	updateScore
} = require("../controllers/leaderBoardController");

router.post("/updatescore", updateScore);

module.exports = router;
