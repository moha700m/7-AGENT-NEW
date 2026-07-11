module.exports = function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  // Fallback values if environment variables are not set
  const supabaseUrl = process.env.SUPABASE_URL || 'https://pfrugircpdwrxmfikfhv.supabase.co';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_40317f22384755106208953934394c50355a30384a31413d';

  if (!supabaseUrl || !supabaseAnonKey) {
    return response.status(500).json({ error: 'Supabase configuration missing' });
  }

  response.setHeader('Cache-Control', 'no-store, max-age=0');
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  return response.status(200).json({ supabaseUrl, supabaseAnonKey });
};
