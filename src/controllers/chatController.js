const { supabase } = require("../configs/databaseConfig");
const multer = require("multer");
const { spawn } = require("child_process");
const path = require("path");
const { PythonShell } = require("python-shell");

async function saaveChat(req, res) {
	try {
		const { user_id, conversation } = req.body;

		// Insertar el mensaje en la base de datos
		const { data, error } = await supabase.from("chats").upsert([
			{
				user_id: user_id,
				conversation: JSON.stringify(conversation), // Convierte el array a JSON
			},
		]);

		if (error) {
			throw error;
		}
		res.status(201).json({ success: true, data });
	} catch (error) {
		onsole.error(error);
		res
			.status(500)
			.json({ success: false, error: "Error al guardar el mensaje en la base de datos." });
	}
}

async function getChaat(req, res) {
	try {
		const { user_id } = req.params;

		// Obtener la conversación de la base de datos para un usuario específico
		const { data, error } = await supabase.from("chats").select("*").eq("user_id", user_id);

		if (data.length > 0) {
			// Convierte el JSON a un array de mensajes
			const conversationArray = JSON.parse(data[0].conversation);
			res.status(200).json({ success: true, data: conversationArray });
		} else {
			res.status(404).json({
				success: false,
				error: "No se encontró la conversación para el usuario especificado.",
			});
		}
	} catch (error) {
		onsole.error(error);
		res
			.status(500)
			.json({ success: false, error: "Error al obtener la conversación de la base de datos." });
	}
}

async function ociTranscription(req, res) {
	try {
		console.log(req.body);
		const { file_url } = req.body;

		// Ruta al script Python
		// const pythonScriptPath = path.join(__dirname, "../../transcribe.py");
		let options = {
			mode: "text",
			pythonPath: "python",
			pythonOptions: ["-u"], // get print results in real-time
			scriptPath: "path",
			args: [file_url],
		};

		console.log("AUDIO URL--->", file_url);

		let transcriptionData = ""; // Variable para almacenar la salida del script Python

		// Ejecutar el script Python como un proceso secundario
		const pythonShell = new PythonShell("../transcribe.py", options);

		// Manejar la salida del script Python
		pythonShell.on("message", (message) => {
			console.log("stdout:", message);
			transcriptionData += message + "\n"; // Acumular los datos de transcripción
		});

		// Manejar errores de salida estándar (stderr)
		pythonShell.on("stderr", (stderr) => {
			console.error("stderr:", stderr);
		});

		// Manejar el cierre del proceso Python
		pythonShell.on("close", (code) => {
			console.log(`child process exited with code ${code}`);
			res.status(200).json({ message: "Transcripción completada", transcriptionData });
			// if (code === 0) {
			// 	// Si el código de salida es 0 (éxito), enviar la transcripción al cliente
			// 	res.status(200).json({ message: "Transcripción completada", transcriptionData });
			// } else {
			// 	// Si hay algún error, responder con un mensaje de error
			// 	res.status(500).json({ success: false, error: "Error al obtener la transcripción." });
			// }
		});

		// console.log("AUDIO URL--->", file_url);

		// // Ejecutar el script Python como un proceso secundario
		// // Ejecutar el script Python como un proceso secundario
		// PythonShell.run("../transcribe.py", options, function (err, results) {
		// 	if (err) {
		// 		console.error(err);
		// 		res.status(500).json({ success: false, error: "Error al obtener la transcripción." });
		// 	} else {
		// 		// Resultados del script Python
		// 		console.log("Transcripción completada:", results);
		// 		res.status(200).json({ message: "Transcripción completada", transcriptionData: results });
		// 	}
		// });
		// const pythonProcess = spawn("python", ["transcribe.py", file_url]); // Pasar la ruta del archivo de audio

		// let transcriptionData = "";

		// // Manejar la salida del script Python
		// pythonProcess.stdout.on("data", (data) => {
		// 	console.log(`stdout: ${data}`);
		// 	// Acumular los datos de transcripción
		// 	transcriptionData += data.toString();
		// });

		// pythonProcess.stderr.on("data", (data) => {
		// 	console.error(`stderr: ${data}`);
		// });

		// pythonProcess.on("close", (code) => {
		// 	console.log(`child process exited with code ${code}`);
		// 	if (code === 0) {
		// 		// Si el código de salida es 0 (éxito), enviar la transcripción al cliente
		// 		res.status(200).json({ message: "Transcripción completada", transcriptionData });
		// 	} else {
		// 		// Si hay algún error, responder con un mensaje de error
		// 		res.status(500).json({ success: false, error: "Error al obtener la transcripción." });
		// 	}
		// });
	} catch (error) {
		console.error(error);
		res
			.status(500)
			.json({ success: false, error: "Error al guardar el mensaje en la base de datos." });
	}
}

module.exports = {
	saaveChat,
	getChaat,
	ociTranscription,
};
