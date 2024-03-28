const express = require("express");
const router = express.Router();
const {
	updateScore,
	je
} = require("../controllers/leaderBoardController");

router.post("/updatescore", updateScore);
router.post("/je",je)

module.exports = router;
