const fs = require('fs');
const path = require('path');
const { postProcess } = require('./postprocess');

const LOGS_DIR = path.join(__dirname, '..', '..', 'logs');
const DEFAULTS_FILE = path.join(__dirname, 'default.json');

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// Utility: get/set/increment/append by path
function getByPath(obj, path) {
    return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
}
function setByPath(obj, path, value) {
    const keys = path.split('.');
    let o = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        if (o[keys[i]] === undefined) o[keys[i]] = {};
        o = o[keys[i]];
    }
    o[keys[keys.length - 1]] = value;
}
function incrementByPath(obj, path, value = 1) {
    const keys = path.split('.');
    let o = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        if (o[keys[i]] === undefined) o[keys[i]] = {};
        o = o[keys[i]];
    }
    const lastKey = keys[keys.length - 1];
    if (typeof o[lastKey] !== 'number') o[lastKey] = 0;
    o[lastKey] += value;
}
function appendByPath(obj, path, value) {
    const keys = path.split('.');
    let o = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        if (o[keys[i]] === undefined) o[keys[i]] = {};
        o = o[keys[i]];
    }
    const lastKey = keys[keys.length - 1];
    if (!Array.isArray(o[lastKey])) o[lastKey] = [];
    // Check for uniqueness (deep equality for objects, or simple for primitives)
    const exists = o[lastKey].some(entry =>
        typeof entry === 'object' && entry !== null && typeof value === 'object' && value !== null
            ? JSON.stringify(entry) === JSON.stringify(value)
            : entry === value
    );
    if (!exists) o[lastKey].push(value);
}
function addByPath(obj, path, value) {
    const keys = path.split('.');
    let o = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        if (o[keys[i]] === undefined) o[keys[i]] = {};
        o = o[keys[i]];
    }
    const lastKey = keys[keys.length - 1];
    if (typeof o[lastKey] !== 'number') o[lastKey] = 0;
    o[lastKey] += value;
}

class Credits {
    constructor(logFileName = null) {
        this.defaults = JSON.parse(fs.readFileSync(DEFAULTS_FILE, 'utf8'));
        this.logFileName = logFileName || this.getTodayLogName();
        this.dataFile = path.join(LOGS_DIR, this.logFileName);
        this.data = this.load();
    }

    getTodayLogName() {
        // Check if in development mode
        if (process.env.DEVELOPMENT === 'true') {
            return 'test.json';
        }
        // Production mode - use date-based naming
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        return `${today}.json`;
    }

    getLogPath() {
        return this.dataFile;
    }

    load() {
        if (fs.existsSync(this.dataFile)) {
            try {
                const fileData = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
                return { ...this.defaults, ...fileData };
            } catch (e) {
                console.error(`Failed to load ${this.logFileName}, using defaults.`, e);
                return { ...this.defaults };
            }
        } else {
            return { ...this.defaults };
        }
    }

    save(force=false) {
        // Ensure we're using today's file before saving
        
        // Only save if stream is live or if explicitly ending the stream (isLive === false)
        if ( force || (this.data.stream && (this.data.stream.isLive === true))) {
            fs.writeFileSync(this.dataFile, JSON.stringify(this.data, null, 2));
        }
    }

    startNewStream() {
        console.log(`📝 Starting new stream log: ${this.logFileName}`);
        
        // Check if we need to update to today's file (in case program ran across days)
        const todayFileName = this.getTodayLogName();
        if (this.logFileName !== todayFileName) {
            console.log(`📅 Switching from ${this.logFileName} to ${todayFileName}`);
            this.logFileName = todayFileName;
            this.dataFile = path.join(LOGS_DIR, this.logFileName);
        }
        
        // Load existing data for today's file if it exists, otherwise start fresh
        if (fs.existsSync(this.dataFile)) {
            console.log(`📂 Loading existing data from ${this.logFileName}`);
            this.data = this.load();
        } else {
            console.log(`🔄 Creating new file with fresh defaults for ${this.logFileName}`);
            this.data = { ...this.defaults };
        }
        
        // Set stream as live and save
        this.data.stream.startTime = new Date().toISOString();
        this.data.stream.isLive = true;
        this.save();
    }


    endStream() {
        console.log(`🔚 Ending stream log: ${this.logFileName}`);
        this.data.stream.endTime = new Date().toISOString();
        this.data.stream.isLive = false;
        this.save(true);
    }

    reset() {
        this.data = { ...this.defaults };
        this.save();
    }

    get(path) {
        return getByPath(this.data, path);
    }

    set(path, value) {
        setByPath(this.data, path, value);
        this.save();
    }

    increment(path) {
        // Always add 1
        this.add(path, 1);
    }

    add(path, value) {
        addByPath(this.data, path, value);
        this.save();
    }

    append(path, value) {
        appendByPath(this.data, path, value);
        this.save();
    }

    appendUnique(path, value) {
        const currentArray = this.get(path) || [];
        if (!currentArray.includes(value)) {
            appendByPath(this.data, path, value);
            this.save();
            return true; // Item was added
        }
        return false; // Item already exists
    }

    getAll() {
        postProcess(this.data, this.get.bind(this), this.logFileName);
        this.save();
        return this.data;
    }

    getDefaults() {
        // Always read fresh from file for live debugging
        this.data = JSON.parse(fs.readFileSync(DEFAULTS_FILE, 'utf8'));
        postProcess(this.data, this.get.bind(this), this.logFileName);
        return this.data;
    }

    // Get and return the most recent log file's data (by filename date, e.g. 2025-07-03 > 2025-07-02)
    static getLatestFilename() {
        const logs = this.getAllLogs();
        if (!logs.length) return null;
        // logs are already sorted descending by date in getAllLogs
        return logs[0].filename;
    }

    addEmoteUsage(emoteName, emoteUrl = null) {
        const emotePath = `emotes.usage.${emoteName}`;
        const existingEmote = this.get(emotePath);
        
        if (existingEmote) {
            // Emote exists, increment count
            this.increment(`${emotePath}.count`);
        } else {
            // New emote, create entry
            this.set(emotePath, {
                url: emoteUrl || "",
                count: 1
            });
        }
    }

    // Update top emotes based on usage
    updateTopEmotes() {
        const usage = this.get('emotes.usage') || {};
        const sortedEmotes = Object.entries(usage)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10); // Top 10 emotes
        
        this.set('emotes.top', sortedEmotes);
    }

    static getAllLogs() {
        if (!fs.existsSync(LOGS_DIR)) return [];
        
        return fs.readdirSync(LOGS_DIR)
            .filter(file => file.endsWith('.json'))
            .map(file => {
                const filePath = path.join(LOGS_DIR, file);
                const stats = fs.statSync(filePath);
                return {
                    filename: file,
                    date: file.replace('.json', ''),
                    displayName: file.replace('.json', ''),
                    size: stats.size,
                    modified: stats.mtime
                };
            })
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    static createInstance(logFileName = null) {
        return new Credits(logFileName);
    }

    
}

// Default instance for current day
const credits = new Credits();
module.exports = credits;
module.exports.Credits = Credits;