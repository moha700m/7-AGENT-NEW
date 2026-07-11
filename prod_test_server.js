const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = 3001;

// Mock Vercel API
app.get('/api/config', (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY
  });
});

// Serve static files
app.use(express.static(__dirname));

// Fallback to index.html for any other GET requests that don't have a file extension
app.get('*', (req, res) => {
  if (!req.path.includes('.')) {
    res.sendFile(path.join(__dirname, 'index.html'));
  } else {
    res.status(404).send('Not Found');
  }
});

app.listen(PORT, () => {
  console.log(`Production test server running at http://localhost:${PORT}`);
});
