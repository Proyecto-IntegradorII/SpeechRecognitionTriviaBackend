/**
 * Controladores para el manejo de los datos del perfil de los usuarios
 */
const { getUserPassword, updateUserPassword } = require("../models/UsersModel");
const bcrypt = require("bcryptjs");
const { supabase } = require("../configs/databaseConfig");
// Actualizar Datos editables en el perfil de un usuario
// NO meter la logica de cambiar la contraseña aqui
/**
 * Envia un json stado acorde y con un string.
 * {status: 280, Perfil actualizado correctamente}
 */
async function updateBasicDataFromProfile(req, res) {
	console.log(req.body);
	// Obtener el ID de usuario del token decodificado
	const user_id = req.body.user_id;

	const { profile_photo, email, program, phone } = req.body;

	var newData = {};

	if (profile_photo) newData["profile_photo"] = profile_photo;
	if (program) newData["program"] = program;
	if (phone) newData["phone"] = phone;

	var myNewData = async (newData, user_id) => {
		try {
			const { data, error } = await supabase.from("users").update(newData).eq("user_id", user_id);

			//Si hay un error
			if (error) {
				throw new Error(error.message);
			}

			return data;
		} catch (error) {
			throw new Error("DB: Error updating user's basic data: " + error.message);
		}
	};

	const response = await myNewData(newData, user_id);

	res.status(280).json({ message: "Perfil actualizado correctamente", newDataPutted: newData });
	return;
}

module.exports = {
	updateBasicDataFromProfile,
};
