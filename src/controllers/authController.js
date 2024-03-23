/**
 * Controladores de autenticacion, manejo de las cuentas de usuario
 */

const {
	getUserByEmail,
	getUsers,
	insertUser,
	updatePasswordUser,
	searchUser,
	insertGoogleUser,
	updateUserStatus,
} = require("../models/UsersModel");
const { insertCode } = require("../models/CodesModel");
const { verifyTokenGoogle } = require("../middlewares/authMiddleware");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const secretKey = process.env.SECRET_KEY_JWT;
const nodemailer = require("nodemailer");

const { supabase } = require("../configs/databaseConfig");

// const transporter = nodemailer.createTransport({
// 	name: "gmail",
// 	service: "gmail",
// 	secure: true,
// 	host: "smtp.gmail.com",
// 	port: 465,
// 	auth: {
// 		type: "OAuth2",
// 		user: process.env.MAIL_USERNAME,
// 		pass: process.env.MAIL_PASSWORD,
// 		clientId: process.env.OAUTH_CLIENTID,
// 		clientSecret: process.env.OAUTH_CLIENT_SECRET,
// 		refreshToken: process.env.OAUTH_REFRESH_TOKEN,
// 	},
// });

// Configura el transporte de nodemailer con tus credenciales de Gmail
const transporter = nodemailer.createTransport({
	service: "gmail",
	host: "smtp.gmail.com",
	port: 465,
	secure: true,
	auth: {
		user: "romainteractiva@gmail.com",
		pass: "moqkwrtblblthnaw",
	},
});

//POST para el inicio de sesion de los usuarios
async function loginUser(req, res) {
	try {
		// Datos obtenidos por el frontend
		const { email, password } = req.body;

		// Realizar la consulta para obtener todos los datos del usuario en la base de datos
		const userData = await getUserByEmail(email);

		// Verificar el hash de la contraseña
		const passwordHash = userData.password;

		// Comparar el hash almacenado con el hash de la contraseña proporcionada por el usuario
		const match = await bcrypt.compare(password, passwordHash);

		// Si las contraseñas no coinciden, se envía una respuesta de error
		if (!match) {
			throw new Error("Credenciales de inicio de sesión inválidas");
		}

		const user = {
			id: userData.id,
			email: userData.email,
		};

		// Generar token JWT con el user_id email y nickname del usuario
		const token = jwt.sign(user, secretKey);

		// Enviar el token al frontend con los datos del usuario y un mensaje de confirmacion
		res.json({ userData, token, message: "Inicio de sesión exitoso" });
	} catch (error) {
		//console.error("Error al iniciar sesión:", error);
		res.status(500).json({ error: "Credenciales de inicio de sesión inválidas" });
	}
}

//POST LOGIN WITH GOOGLE
async function loginGoogleUser(req, res) {
	try {
		const { credentialResponse } = req.body;

		const clientId = credentialResponse.clientId;
		const credential = credentialResponse.credential;

		// Verificar el token con la función verifyTokenGoogle
		const payload = await verifyTokenGoogle(clientId, credential);

		//Obtener datos del usuario
		const { email, name, picture, given_name } = payload;

		//Email a verificar si ya existe en la base de datos
		const emailToCheck = email;

		try {
			//Consulta para verificar si el email existe en la base de datos
			const verifyExistenceUser = await searchUser(emailToCheck);

			//Si el correo electrónico NO está registrado en la tabla
			if (verifyExistenceUser.length == 0) {
				const registerUser = await insertGoogleUser(email, given_name, name);
				console.log(registerUser);
			}
		} catch (error) {
			console.error("Error en la consulta:", error);
		}

		const usuarioData = await getUserByEmail(email);

		//Datos para poner en el token
		const user = {
			user_id: usuarioData.user_id,
			email: usuarioData.email,
			nickname: usuarioData.nickname,
		};

		// Generar token JWT con el user_id email y nickname del usuario
		const token = jwt.sign(user, secretKey);

		// Enviar el token al frontend con los datos del usuario y un mensaje de confirmacion
		res.json({ usuarioData, token, message: "Inicio de sesión exitoso" });
	} catch (error) {
		console.error("Error al iniciar sesión:", error);
		res.status(500).json({ error: "Credenciales de inicio de sesión inválidas" });
	}
}

//POST para el registro de usuarios
async function registerUser(req, res) {
	try {
		//Datos de registro del usuario recibidos
		const { name, email, password } = req.body;

		// Generar el hash de la contraseña
		const hashedPassword = await bcrypt.hash(password, 10); // 10 es el número de rondas de hashing

		const data = await insertUser(name, email, hashedPassword);

		//Respuesta
		res.json("OK");
	} catch (error) {
		console.error("Error al crear el usuario:", error);
		res.status(500).json({ error: error.message });
	}
}

async function lockoutUser(req, res) {
	try {
		//Datos de registro del usuario recibidos
		const { email } = req.body;

		const currentDate = new Date();

		// Calcular la fecha de expiración (15 minutos después)
		const expirationDate = new Date(currentDate.getTime() + 30 * 60000); // 15 minutos en milisegundos

		const expirationDateString = expirationDate.toISOString(); // Fecha y hora de expiración

		const { data, error } = await supabase
			.from("users")
			.update({ lockout_time: expirationDateString })
			.eq("email", email);

		//Respuesta
		res.json("The User has been lockedout");
	} catch (error) {
		console.error("Error al crear el usuario:", error);
		res.status(500).json({ error: error.message });
	}
}

// // Obtener informacion de todos los usuarios de la base de datos
async function users(req, res) {
	const data = await getUsers();
	//Respuesta
	res.json(data);
}

async function recoverUserByEmail(req, res) {
	try {
		const { email } = req.body;
		//SEARCH IF THE USER EXISTS
		const { data, error } = await supabase.from("users").select("*").eq("email", email).single();

		// IF USER DOESNT EXIST
		if (error) {
			throw new Error("Email does not exist");
		}

		// Verificar si el usuario no esta desactivado
		if (data.status != "active") {
			throw new Error("User is deactivated");
		}

		const currentDate = new Date();

		const fechaFormateada = currentDate.toISOString();

		if (data.lockout_time > fechaFormateada) {
			res.status(200).json({ message: "El usuario está suspendido" });
		}

		console.log(data.user_id);
		//VERIFY IF A CODE EXISTS
		const { data: dataCode, error: errorCode } = await supabase
			.from("codes")
			.select("*")
			.eq("user_id", data.user_id)
			.eq("type", "recover_password")
			.order("created_at", { ascending: false })
			.limit(1)
			.single();

		console.log(data, dataCode, fechaFormateada);

		if (dataCode != null) {
			const randomCode = dataCode.code;

			const expirationTime = new Date(dataCode.expires);
			const expirationDateString = expirationTime.toISOString();
			console.log(expirationDateString);
			if (dataCode.expires > fechaFormateada) {
				res.status(200).json({ message: "Code already sent", randomCode, expirationDateString });
				return;
			}
		}

		//CREATE AND SEND CODE IF USER EXISTS
		const randomCode = Math.floor(1000 + Math.random() * 9000);

		// Calcular la fecha de expiración (15 minutos después)
		const expirationDate = new Date(currentDate.getTime() + 15 * 60000); // 15 minutos en milisegundos

		const creationDate = currentDate.toISOString(); // Fecha y hora de creación
		const expirationDateString = expirationDate.toISOString(); // Fecha y hora de expiración

		const type = "recover_password";

		const insert = await insertCode(
			creationDate,
			expirationDateString,
			randomCode,
			data.user_id,
			type
		);

		const htmlContent = `
			<html>
				<head>
					<title>Código de verificación</title>
				</head>
				<body>
					<h3>Estimado usuario,</h3>
					<p>El código de verificación para recuperar su contraseña es: <strong>${randomCode}</strong></p> 
					<p>El código tiene una vigencia de 15 minutos.</p>
				</body>
			</html>
			`;

		// Define el contenido del correo electrónico
		const mailOptions = {
			from: "Univalle AlToque uvaltoque@gmail.com",
			to: data.email,
			subject: "Univalle AlToque - Recuperar contraseña",
			html: htmlContent,
		};

		// Envia el correo electrónico
		transporter.sendMail(mailOptions, (error, info) => {
			if (error) {
				res.status(500).json({ message: "Error sending email" });
				console.log("Error al enviar el correo electrónico:", error);
			} else {
				res
					.status(200)
					.json({ message: "Email sent successfully", randomCode, expirationDateString });
			}
		});
	} catch (error) {
		console.error("Error: " + `${error}`);
		res.status(500).json({ error: `${error}` });
	}
}

async function deleteUserAccountCode(req, res) {
	try {
		const { user_id, password } = req.body;
		//SEARCH IF THE USER EXISTS
		const { data, error } = await supabase
			.from("users")
			.select("*")
			.eq("user_id", user_id)
			.single();

		if (error) {
			throw new Error("Error getting user data");
		}

		// Verificar el hash de la contraseña
		const passwordHash = data.password;

		// Comparar el hash almacenado con el hash de la contraseña proporcionada por el usuario
		const match = await bcrypt.compare(password, passwordHash);

		// Si las contraseñas no coinciden, se envía una respuesta de error
		if (!match) {
			throw new Error("Invalid password");
		}

		//CREATE AND SEND CODE

		const randomCode = Math.floor(1000 + Math.random() * 9000);

		const currentDate = new Date();

		// Calcular la fecha de expiración (15 minutos después)
		const expirationDate = new Date(currentDate.getTime() + 15 * 60000); // 15 minutos en milisegundos

		const creationDate = currentDate.toISOString(); // Fecha y hora de creación
		const expirationDateString = expirationDate.toISOString(); // Fecha y hora de expiración

		const type = "delete_account";

		const insert = await insertCode(
			creationDate,
			expirationDateString,
			randomCode,
			data.user_id,
			type
		);

		const htmlContent = `
			<html>
				<head>
					<title>Código de verificación</title>
				</head>
				<body>
					<h3>Estimado usuario,</h3>
					<p>El código de verificación para eliminar su cuenta de usuario es: <strong>${randomCode}</strong></p> 
					<p>El código tiene una vigencia de 15 minutos.</p>
				</body>
			</html>
			`;

		const mailOptions = {
			from: "Univalle AlToque uvaltoque@gmail.com",
			to: data.email,
			subject: "Univalle AlToque - Eliminar cuenta de usuario",
			html: htmlContent,
		};

		// Envia el correo electrónico
		transporter.sendMail(mailOptions, (error, info) => {
			if (error) {
				res.status(500).json({ error: "Error sending email" });
				console.log("Error al enviar el correo electrónico:", error);
			} else {
				res.status(200).json({ message: "Code sent" });
				console.log("Correo electrónico enviado:", info.response);
			}
		});
	} catch (error) {
		res.status(500).json({ error: `${error}` });
	}
}

async function deleteUserAccountConfirm(req, res) {
	try {
		const { user_id, code } = req.body;

		//Buscar si el código existe
		const { data, error } = await supabase
			.from("codes")
			.select("*")
			.eq("code", code)
			.eq("user_id", user_id)
			.eq("type", "delete_account")
			.single();

		//Si el código no existe
		if (error) {
			throw new Error("Invalid code");
		}

		const currentTime = new Date();
		const expirationTime = new Date(data.expires);

		//Verificar si el código ha expirado
		const expiredCode = expirationTime < currentTime;

		console.log(currentTime, " ", expirationTime, expiredCode);

		if (expiredCode) {
			res.status(202).json({ message: "Code expired" });
		} else {
			const inactivateUser = await updateUserStatus(user_id, "inactive");

			if (inactivateUser == "OK") {
				res.status(200).json({ message: "User successfully deactivated" });
			}
		}
	} catch (error) {
		res.status(500).json({ error: `${error}` });
	}
}

async function getCodeByEmail(req, res) {
	try {
		const { email } = req.params;

		// Obtener user_id mediante el correo proporcionado
		const { data: userData, error: userError } = await supabase
			.from("users")
			.select("user_id")
			.eq("email", email)
			.single();

		if (userError) {
			throw new Error("Error retrieving user data");
		}

		const { data: codeData, error: codeError } = await supabase
			.from("codes")
			.select("code", "expires")
			.eq("user_id", userData.user_id)
			.eq("type", "recover_password")
			.order("created_at", { ascending: false })
			.limit(1)
			.single();

		if (codeError) {
			throw new Error("Error retrieving code data");
		}

		if (!codeData) {
			res.status(404).json({ message: "Code not found" });
			return;
		}

		const currentTime = new Date();
		const expirationTime = new Date(codeData.expires);

		// Verificar si el código ha expirado
		const isCodeExpired = expirationTime < currentTime;

		if (isCodeExpired) {
			res.status(404).json({ message: "Code has expired" });
			return;
		}

		res.status(200).json({ code: codeData.code });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
}

async function changeUserPassword(req, res) {
	try {
		const { user_id, old_password, new_password } = req.body;

		const { data: userData, error: errorData } = await supabase
			.from("users")
			.select("*")
			.eq("user_id", user_id)
			.single();

		// Verificar el hash de la contraseña
		const passwordHash = userData.password;

		// Comparar el hash almacenado con el hash de la contraseña proporcionada por el usuario
		const match = await bcrypt.compare(old_password, passwordHash);

		// Si las contraseñas no coinciden, se envía una respuesta de error
		if (!match) {
			res.status(401).json({ message: "Old password is invalid" });
		}

		// Generar el hash de la contraseña nueva
		const hashedPassword = await bcrypt.hash(new_password, 10); // 10 es el número de rondas de hashing

		const { data: updatePassword, error: errorUpdating } = await supabase
			.from("users")
			.update({ password: hashedPassword })
			.eq("user_id", user_id);

		if (errorUpdating) {
			res.status(401).json({ message: "Error updating user password" });
		}

		res.status(200).json({ message: "Password updated successfully" });
	} catch (error) {
		console.error("Error:", error);
		res.status(500).json({ error: "Credenciales de inicio de sesión inválidas" });
	}
}

async function newUserPassword(req, res) {
	try {
		const { email, new_password } = req.body;

		// Generar el hash de la contraseña nueva
		const hashedPassword = await bcrypt.hash(new_password, 10); // 10 es el número de rondas de hashing

		const { data: updatePassword, error: errorUpdating } = await supabase
			.from("users")
			.update({ password: hashedPassword })
			.eq("email", email);

		if (errorUpdating) {
			res.status(401).json({ message: "Error updating user password" });
		}

		res.status(200).json({ message: "Password updated successfully" });
	} catch (error) {
		console.error("Error:", error);
		res.status(500).json({ error: "Credenciales de inicio de sesión inválidas" });
	}
}

async function saveChat(req, res) {
    try {
        const { user_id, conversation } = req.body;

        // Buscar la fila existente con el mismo user_id
        const { data: existingData, error: existingError } = await supabase
            .from('chats')
            .select('*')
            .eq('user_id', user_id);

        if (existingError) {
            throw existingError;
        }

        // Si existe la fila, actualizarla; de lo contrario, insertar una nueva
        if (existingData && existingData.length > 0) {
            const { data, error } = await supabase
                .from('chats')
                .update({ conversation: JSON.stringify(conversation) })
                .eq('user_id', user_id);

            if (error) {
                throw error;
            }

            res.status(200).json({ success: true, data });
        } else {
            const { data, error } = await supabase
                .from('chats')
                .upsert([
                    {
                        user_id: user_id,
                        conversation: JSON.stringify(conversation),
                    },
                ]);

            if (error) {
                throw error;
            }

            res.status(201).json({ success: true, data });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error al guardar el mensaje en la base de datos.' });
    }
}


async function getChat(req, res) {
	try {
		const { user_id } = req.params;

        // Obtener la conversación de la base de datos para un usuario específico
        const { data, error } = await supabase
            .from('chats')
            .select('*')
            .eq('user_id', user_id)

        if (data.length > 0) {
      // Convierte el JSON a un array de mensajes
      const conversationArray = JSON.parse(data[0].conversation);
      res.status(200).json({ success: true, data: conversationArray });
    } else {
      res.status(404).json({ success: false, error: 'No se encontró la conversación para el usuario especificado.' });
    }
	} catch (error) {
		console.error(error);
        res.status(500).json({ success: false, error: 'Error al obtener la conversación de la base de datos.' });
	}
}

module.exports = {
	loginUser,
	loginGoogleUser,
	registerUser,
	users,
	recoverUserByEmail,
	deleteUserAccountConfirm,
	deleteUserAccountCode,
	getCodeByEmail,
	lockoutUser,
	changeUserPassword,
	newUserPassword,
	saveChat,
	getChat
};
