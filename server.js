require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, '.')));

const configHandler = require('./api/config.js');

app.get('/api/config', (req, res) => {
  const mockRes = {
    status: (code) => ({
      json: (data) => res.status(code).json(data)
    }),
    setHeader: (name, value) => res.setHeader(name, value)
  };
  configHandler(req, mockRes);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
