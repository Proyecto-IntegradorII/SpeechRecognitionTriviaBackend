const express = require("express");
const router = express.Router();
const multer = require("multer");

const { saaveChat, getChaat, ociTranscription } = require("../controllers/chatController");

// Configuración de multer para almacenar el archivo de audio en una ubicación específica
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, "uploads/"); // Ruta donde se almacenarán los archivos de audio
	},
	filename: function (req, file, cb) {
		cb(null, file.originalname); // Nombre original del archivo de audio
	},
});

const upload = multer({ storage: storage });

router.post("/saaveChat", saaveChat);
router.get("getChaat/:user_id", getChaat);
router.post("/transcribe", upload.single("audio"), ociTranscription);

module.exports = router;
