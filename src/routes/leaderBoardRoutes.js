const express = require("express");
const router = express.Router();
const {
	updateScore,
	getScores,
	getScoreById
} = require("../controllers/leaderBoardController");

router.post("/updatescore", updateScore);
router.get("/getscores", getScores);
router.get("/score:user_id",getScoreById)


module.exports = router;
