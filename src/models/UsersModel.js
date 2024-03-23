/**
 * MANEJO DE LAS SOLICITUDES A LA BASE DE DATOS DE LA TABLA DE "usuarios"
 */
const { supabase } = require("../configs/databaseConfig");

// Realizar la consulta para obtener todos los datos del usuario en la base de datos
const getUserByEmail = async (email) => {
	try {
		const { data, error } = await supabase.from("users").select("*").eq("email", email).single();

		if (error) {
			throw error;
		}

		return data;
	} catch (error) {
		throw new Error("DB: Error fetching user data");
	}
};

const getUsers = async () => {
	try {
		// Seleccionar todos los usuarios de la base de datos con todos sus atributos
		const { data, error: queryError } = await supabase.from("users").select("*");

		//Si hay un error durante la consulta
		if (queryError) {
			throw new Error(queryError.message);
		}

		return data;
	} catch (error) {
		throw new Error("DB: Error fetching users");
	}
};

const insertUser = async (name, email, hashedPassword) => {
	try {
		// Guardar los datos adicionales del usuario en la tabla 'usuarios'
		const { data, error: insertError } = await supabase.from("users").insert([
			{
				name,
				email,
				password: hashedPassword,
			},
		]);

		//Si hay un error durante la insercion de los datos del usuario
		if (insertError) {
			throw new Error(insertError.message);
		}

		return data;
	} catch (error) {
		throw new Error("DB: Error inserting user");
	}
};

const updatePasswordUser = async (to) => {
	try {
		const { error: queryError } = await supabase.from("users").update(newData).eq("email", to);

		//Si hay un error durante
		if (queryError) {
			throw new Error(queryError.message);
		}
	} catch (error) {
		throw new Error("DB: Error updating user password");
	}
};
//Consulta para verificar si el email existe en la base de datos
const searchUser = async (emailToCheck) => {
	try {
		//Consulta para verificar si el email existe en la base de datos
		const { data: userData, error: queryError } = await supabase
			.from("users")
			.select("*")
			.eq("email", emailToCheck);

		//Si hay un error durante
		if (queryError) {
			throw new Error(queryError.message);
		}

		return userData;
	} catch (error) {
		throw new Error("DB: Error al buscar usuario/el usuario ya existe");
	}
};

const insertGoogleUser = async (email, given_name, name) => {
	try {
		// Guardar los datos del usuario en la tabla 'usuarios'
		const { data, error: insertError } = await supabase
			.from("users")
			.insert([{ email: email, nickname: given_name, nombre_usuario: name }]);

		//Si hay un error durante la insercion de los datos del usuario
		if (insertError) {
			throw new Error(insertError.message);
		}

		return data;
	} catch (error) {
		throw new Error("DB: Error al insertar usuario/el usuario ya existe");
	}
};

const getUserPassword = async (user_id) => {
	try {
		//Obtener contrasena encriptada del usuario
		const { data, error } = await supabase.from("users").select("password").eq("user_id", user_id);

		//Si hay un error
		if (error) {
			throw new Error(error.message);
		}

		return data;
	} catch (error) {
		throw new Error("DB: Error fetching user password ");
	}
};

const updateUserPassword = async (newData, user_id) => {
	try {
		const { data, error } = await supabase.from("users").update(newData).eq("user_id", user_id);

		//Si hay un error
		if (error) {
			throw new Error(error.message);
		}

		return data;
	} catch (error) {
		throw new Error("DB: Error updating user password");
	}
};

const updateUserStatus = async (user_id, status) => {
	try {
		const { data, error } = await supabase
			.from("users")
			.update({ status: status })
			.eq("user_id", user_id);

		//Si hay un error
		if (error) {
			throw new Error(error.message);
		}

		return "OK";
	} catch (error) {
		throw new Error("DB: Error updating user status" + `${error}`);
	}
};

module.exports = {
	getUserByEmail,
	getUsers,
	getUserPassword,
	insertGoogleUser,
	insertUser,
	updatePasswordUser,
	updateUserPassword,
	searchUser,
	updateUserStatus,
};
