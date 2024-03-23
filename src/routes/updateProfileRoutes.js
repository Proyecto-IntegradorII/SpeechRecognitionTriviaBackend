const express = require("express");
const router = express.Router();
const { updateBasicDataFromProfile } = require("../controllers/updateProfileController");
const { verifyToken } = require("../middlewares/authMiddleware");

//router.put("/actualizarperfil", verifyToken, updateBasicDataFromProfile);
router.put("/updateprofile", updateBasicDataFromProfile);

module.exports = router;
