const express = require("express");
const router = express.Router();
const {
	updateScores,
	je
} = require("../controllers/leaderBoardController");

router.post("/updatescores", updateScores);
router.post("/je",je)

module.exports = router;
