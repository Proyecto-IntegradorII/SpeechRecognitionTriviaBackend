/**
 * Controladores de autenticacion, manejo de las cuentas de usuario
 */
const { supabase } = require("../configs/databaseConfig");

async function updateScore(req, res) {
	try {

		const { user_id, score } = req.body;

		// Obtiene el puntaje actual del usuario
		const { data: userData, error: userError } = await supabase
			.from("scores")
			.select("*")
			.eq('user_id', user_id)
			.single();

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

		} else {
			// Si el usuario no tiene una entrada, crea una nueva fila

			await supabase
				.from('scores')
				.insert([{ user_id, score: score.toString() }]);

		}

		res.status(200).json({ success: true });

	} catch (err) {
		console.log(err)
		res.status(500).json({ success: false });
	}
}

async function getScoreById(req, res) {

	try {

		const { user_id} = req.body;

		// Obtiene el puntaje actual del usuario
		const { data: userData, error: userError } = await supabase
			.from("scores")
			.select("*")
			.eq('user_id', user_id)
			.single();

		console.log(userData);

		res.status(200).json({ success: true, puntaje: userData.score });

	} catch (err) {
		console.log(err)
		res.status(500).json({ success: false });
	}
}

async function getScores(req, res) {
	try {
		// Realiza una consulta para obtener los nombres de los usuarios y sus puntajes ordenados de mayor a menor
		const { data: scores, error } = await supabase
			.from('scores')
			.select('user_id, score');

		if (error) {
			throw error;
		}

		const userIds = scores.map(score => score.user_id);

		// Consulta los nombres de los usuarios correspondientes a los user_id obtenidos
		const { data: users, error: usersError } = await supabase
			.from('users')
			.select('id, name')
			.in('id', userIds);

		if (usersError) {
			throw usersError;
		}

		// Crea un diccionario de user_id a nombres de usuario para facilitar la búsqueda
		const userMap = {};
		users.forEach(user => {
			userMap[user.id] = user.name;
		});

		// Combina los puntajes con los nombres de usuario
		const combinedData = scores.map(score => ({
			name: userMap[score.user_id],
			score: score.score
		}));

		// Ordena los datos por puntaje de mayor a menor
		combinedData.sort((a, b) => b.score - a.score);

		// Envía los datos como respuesta
		res.json(combinedData);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
}


module.exports = {
	updateScore,
	getScores,
	getScoreById
};
