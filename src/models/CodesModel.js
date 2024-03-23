const { supabase } = require("../configs/databaseConfig");

const insertCode = async (created_at, expires, code, user_id, type) => {
	try {
		// Guardar los datos adicionales del usuario en la tabla 'usuarios'
		const { data, error: insertError } = await supabase
			.from("codes")
			.insert([{ created_at, expires, code, user_id, type }]);

		//Si hay un error durante la insercion de los datos del usuario
		if (insertError) {
			throw new Error(insertError.message);
		}

		return data;
	} catch (error) {
		throw new Error("DB: Error inserting new code " + error);
	}
};

module.exports = {
	insertCode,
};
