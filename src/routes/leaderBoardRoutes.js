const express = require("express");
const router = express.Router();
const {
	updateScore,
	getScores
} = require("../controllers/leaderBoardController");

router.post("/updatescore", updateScore);
router.get("/getscores", getScores)

module.exports = router;
