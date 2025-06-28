const express = require('express');
const path = require('path');
const credits = require('./credits'); // Use your credits singleton

const app = express();
const PORT = 3001;

// Set EJS as template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'static'));

// Add explicit MIME type for video files
express.static.mime.define({'video/mp4': ['mp4']});

// Serve static files (CSS, JS, images, videos)
app.use(express.static(path.join(__dirname, 'static'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.mp4')) {
            res.setHeader('Content-Type', 'video/mp4');
        }
    }
}));

// API endpoint for raw JSON data
app.get('/data', (req, res) => {
    res.json(credits.getDefaults());
});

// Serve templated HTML with data at "/"
app.get('/', (req, res) => {
    const data = credits.getAll();
    // const data = credits.getDefaults();
    res.render('index', { data }); // Pass data to template
});

app.listen(PORT, () => {
    console.log(`Frontend server running at http://localhost:${PORT}/`);
});

module.exports = app;