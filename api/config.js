const VERIFIED_SUPABASE_URL = '';
const VERIFIED_SUPABASE_ANON_KEY = '';

module.exports = function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || VERIFIED_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || VERIFIED_SUPABASE_ANON_KEY;

  response.setHeader('Cache-Control', 'no-store, max-age=0');
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  return response.status(200).json({ supabaseUrl, supabaseAnonKey });
};
