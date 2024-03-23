const { createClient } = require("@supabase/supabase-js");

// Credenciales supabase
console.log(process.env.SUPABASE_KEY)
const supabaseUrl = "https://irsekyuuxfezyqafyihw.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = {
	supabase,
};
