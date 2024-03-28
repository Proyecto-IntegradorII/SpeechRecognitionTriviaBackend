/**
 * Controladores de autenticacion, manejo de las cuentas de usuario
 */
const { supabase } = require("../configs/databaseConfig");


async function updateScore(req, res) {
	try {

		const {user_id, score} = req.body;

        // Obtiene el puntaje actual del usuario
        const { data: userData, error: userError } = await supabase
            .from('scores')
            .select('*')
            .eq('user_id', user_id)
            .single();

        if (userError) {
            throw userError;
        }

		console.log(userData);

        let puntajeTotal;

        if (userData) {
            // Si el usuario ya tiene una entrada, actualiza el puntaje
            const puntajeActual = parseInt(userData.score);
            puntajeTotal = puntajeActual + score;

            await supabase
                .from('scores')
                .update({ score: puntajeTotal.toString() })
                .eq('user_id', user_id);

				res.status(200).json({ success: true});
        } else {
            // Si el usuario no tiene una entrada, crea una nueva fila

            await supabase
                .from('scores')
                .insert([{ user_id, score: score.toString() }]);

				res.status(200).json({ success: true});
        }

        return { success: true, puntajeTotal };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

async function je(req, res) {
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

module.exports = {
	updateScore,
	je
};
