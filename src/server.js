const express = require('express');
const path = require('path');
const { readData } = require('./data');

const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'static')));

// API endpoint for data
app.get('/data', (req, res) => {
    res.json(readData());
});

// Serve index.html at "/"
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Frontend server running at http://localhost:${PORT}/`);
});

module.exports = app; 