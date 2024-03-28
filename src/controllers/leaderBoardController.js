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
            .select('score')
            .eq('user_id', user_id)
            .single();

        if (userError) {
            throw userError;
        }

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

        return { success: true, puntajeTotal };
    } catch (err) {
        return { success: false, error: err.message };
    }
}



module.exports = {
	
	recoverUserByEmail,
	updateScore
};
