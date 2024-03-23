
const { supabase } = require("../configs/databaseConfig");

async function saaveChat(req, res) {
	try {
		const { user_id, conversation } = req.body;

        // Insertar el mensaje en la base de datos
        const { data, error } = await supabase
            .from('chats')
            .upsert([
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
        res.status(500).json({ success: false, error: 'Error al guardar el mensaje en la base de datos.' });
	}
}

async function getChaat(req, res) {
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
		onsole.error(error);
        res.status(500).json({ success: false, error: 'Error al obtener la conversación de la base de datos.' });
	}
}

module.exports = {
    saaveChat,
    getChaat
};
