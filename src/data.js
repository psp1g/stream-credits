const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.json');
const LOGS_DIR = path.join(__dirname, 'logs');

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR);

function readData() {
    if (!fs.existsSync(DATA_FILE)) {
        // Default structure
        const defaultData = {
            channel: "",
            users: [],
            stats: {
                messages: 0,
                bans: 0,
                redeems: 0
            },
            lastEvent: null
        };
        fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
        return defaultData;
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Append event to a daily log file
function appendLog(event) {
    const date = new Date().toISOString().slice(0, 10);
    const logFile = path.join(LOGS_DIR, `events-${date}.log`);
    fs.appendFileSync(logFile, JSON.stringify(event) + '\n');
}

module.exports = { readData, writeData, appendLog };