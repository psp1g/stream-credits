const express = require('express');
const path = require('path');
const credits = require('./data/credits');
const { Credits } = require('./data/credits');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT;

// Set EJS as template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public'));

express.static.mime.define({'video/mp4': ['mp4']});

// Serve static files
app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.mp4')) {
            res.setHeader('Content-Type', 'video/mp4');
        }
    }
}));

// Root route - show list of available logs
app.get('/', (req, res) => {
    const logs = Credits.getAllLogs();
    res.render('logs', { logs });
});

// Credits route - show credits for specific date
app.get('/credits', (req, res) => {
    const date = req.query.date;
    let creditsInstance;
    
    if (date) {
        const logFileName = `${date}.json`;
        creditsInstance = Credits.createInstance(logFileName);
    } else {
        console.log("kurwa: ", Credits.getLatestFilename())
        creditsInstance = Credits.createInstance(Credits.getLatestFilename()); // Default to today
    }
    
    const data = creditsInstance.getAll();
    res.render('index', { data, selectedDate: date });
});

// API endpoint for raw JSON data
app.get('/data', (req, res) => {
    const date = req.query.date;
    let creditsInstance;
    
    if (date) {
        const logFileName = `${date}.json`;
        creditsInstance = Credits.createInstance(logFileName);
    } else {
        creditsInstance = credits;
    }
    
    res.json(creditsInstance.getAll());
});

app.listen(PORT, () => {
    console.log(`Frontend server running at http://localhost:${PORT}/`);
});

module.exports = app;