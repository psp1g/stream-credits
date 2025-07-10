const fs = require('fs');
const path = require('path');

const LOGS_DIR = path.join(__dirname, 'logs');
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
        this.logFileName = logFileName || this.getLogName();
        this.dataFile = path.join(LOGS_DIR, this.logFileName);
        this.data = this.load();
    }

    getLogName() {
        // Check if in development mode
        if (process.env.DEVELOPMENT === 'true') {
            return 'test.json';
        }
        // Production mode - use date-based naming
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        return `${today}.json`;
    }

    getTodayLogName() {
        return this.getLogName(); // Use the same logic
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

    save() {
        // Only save if stream is live or if explicitly ending the stream (isLive === false)
        if (this.data.stream && (this.data.stream.isLive === true || this.data.stream.isLive === false)) {
            fs.writeFileSync(this.dataFile, JSON.stringify(this.data, null, 2));
        }
    }

    startNewStream() {
        console.log(`📝 Starting new stream log: ${this.logFileName}`);
        this.data = { ...this.defaults };
        this.data.stream.startTime = new Date().toISOString();
        this.data.stream.isLive = true;
        this.save();
    }


    endStream() {
        console.log(`🔚 Ending stream log: ${this.logFileName}`);
        this.data.stream.endTime = new Date().toISOString();
        this.data.stream.isLive = false;
        this.save();
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
        this.postProcess(); // Fix: call this.postProcess()
        return this.data;
    }

    getDefaults() {
        // Always read fresh from file for live debugging
        this.data = JSON.parse(fs.readFileSync(DEFAULTS_FILE, 'utf8'));
        this.postProcess(); // Fix: call this.postProcess()
        return this.data;
    }

    // Get and return the most recent log file's data (by filename date, e.g. 2025-07-03 > 2025-07-02)
    static getLatestFilename() {
        const logs = this.getAllLogs();
        if (!logs.length) return null;
        // logs are already sorted descending by date in getAllLogs
        return logs[0].filename;
    }

    calculateAttendanceStreaks() {
        const logs = Credits.getAllLogs();
        const userAttendance = {}; // { username: [dates] }
        
        // Collect all present users from all logs
        logs.forEach(log => {
            try {
                const logData = JSON.parse(fs.readFileSync(path.join(LOGS_DIR, log.filename), 'utf8'));
                const presentUsers = logData.present || [];
                const date = log.date;
                
                presentUsers.forEach(username => {
                    if (!userAttendance[username]) {
                        userAttendance[username] = [];
                    }
                    userAttendance[username].push(date);
                });
            } catch (e) {
                console.error(`Error reading ${log.filename}:`, e);
            }
        });
        
        // Calculate max streak for each user
        const userMaxStreaks = {};
        
        Object.entries(userAttendance).forEach(([username, dates]) => {
            // Sort dates chronologically
            dates.sort((a, b) => new Date(a) - new Date(b));
            
            let maxStreak = 1;
            let currentStreak = 1;
            
            for (let i = 1; i < dates.length; i++) {
                const prevDate = new Date(dates[i - 1]);
                const currentDate = new Date(dates[i]);
                const dayDiff = (currentDate - prevDate) / (1000 * 60 * 60 * 24);
                
                if (dayDiff === 1) {
                    currentStreak++;
                    maxStreak = Math.max(maxStreak, currentStreak);
                } else {
                    currentStreak = 1;
                }
            }
            
            if (maxStreak >= 2) {
                userMaxStreaks[username] = maxStreak;
            }
        });
        
        // Sort by streak length
        const sortedUsers = Object.entries(userMaxStreaks)
            .sort((a, b) => b[1] - a[1]);
        
        // Save to presentStreak
        setByPath(this.data, 'presentStreak', Object.fromEntries(sortedUsers));
    }

    postProcess() { 
        // Get excluded users from environment
        const excludedUsers = process.env.EXCLUDED_USERS ? 
            process.env.EXCLUDED_USERS.split(',').map(user => user.trim().toLowerCase()) : 
            [];

        // --- TOP CHATTERS ---
        const chatters = this.get('messages.chatters') || {};
        const chattersArr = Object.entries(chatters).map(([name, count]) => ({ name, count }));
        const topChattersArr = chattersArr.sort((a, b) => b.count - a.count).slice(0, 20);

        // Convert back to object { username: count, ... }
        const topChattersObj = {};
        for (const { name, count } of topChattersArr) {
            topChattersObj[name] = count;
        }

        setByPath(this.data, 'messages.topChatters', topChattersObj);

        // --- TOP MODERATORS ---
        const moderators = this.get('stream.moderators') || [];
        
        // Check if moderators is an array, if not convert it
        let moderatorsArray;
        if (Array.isArray(moderators)) {
            moderatorsArray = moderators;
        } else {
            // If it's an object, get the keys (usernames)
            moderatorsArray = Object.keys(moderators);
        }
        
        // Filter out excluded users
        const filteredModerators = moderatorsArray.filter(mod => 
            !excludedUsers.includes(mod.toLowerCase())
        );
        
        // Sort moderators by message count (if available) or keep original order
        const sortedModerators = filteredModerators.sort((a, b) => {
            const aCount = this.get(`messages.chatters.${a}`) || 0;
            const bCount = this.get(`messages.chatters.${b}`) || 0;
            return bCount - aCount; // Sort by message count descending
        });

        setByPath(this.data, 'stream.moderatorsSorted', sortedModerators);

        // --- ATTENDANCE STREAKS ---
        this.calculateAttendanceStreaks();

        // --- TOP EMOTES ---
        const emoteUsage = this.get('emotes.usage') || {};
        const emotesArr = Object.entries(emoteUsage).map(([emoteId, data]) => ({ 
            id: emoteId, 
            url: data.url, 
            count: data.count 
        }));
        const topEmotesArr = emotesArr.sort((a, b) => b.count - a.count).slice(0, 18);

        // Convert to object for template { emoteId: { url, count }, ... }
        const topEmotesObj = {};
        for (const emote of topEmotesArr) {
            topEmotesObj[emote.id] = {
                url: emote.url,
                count: emote.count
            };
        }
        
        setByPath(this.data, 'emotes.top', topEmotesObj);
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

    static analyzeAttendanceStreaks() {
        const logs = this.getAllLogs();
        const userAttendance = {}; // { username: [dates] }
        
        // Collect all present users from all logs
        logs.forEach(log => {
            try {
                const logData = JSON.parse(fs.readFileSync(path.join(LOGS_DIR, log.filename), 'utf8'));
                const presentUsers = logData.present || [];
                const date = log.date;
                
                presentUsers.forEach(username => {
                    if (!userAttendance[username]) {
                        userAttendance[username] = [];
                    }
                    userAttendance[username].push(date);
                });
            } catch (e) {
                console.error(`Error reading ${log.filename}:`, e);
            }
        });
        
        // Calculate streaks for each user
        const userStreaks = {};
        
        Object.entries(userAttendance).forEach(([username, dates]) => {
            // Sort dates chronologically
            dates.sort((a, b) => new Date(a) - new Date(b));
            
            let streaks = [];
            let currentStreak = [dates[0]];
            
            for (let i = 1; i < dates.length; i++) {
                const prevDate = new Date(dates[i - 1]);
                const currentDate = new Date(dates[i]);
                const dayDiff = (currentDate - prevDate) / (1000 * 60 * 60 * 24);
                
                if (dayDiff === 1) {
                    // Consecutive day
                    currentStreak.push(dates[i]);
                } else {
                    // Streak broken
                    if (currentStreak.length >= 2) {
                        streaks.push({
                            startDate: currentStreak[0],
                            endDate: currentStreak[currentStreak.length - 1],
                            length: currentStreak.length,
                            dates: [...currentStreak]
                        });
                    }
                    currentStreak = [dates[i]];
                }
            }
            
            // Don't forget the last streak
            if (currentStreak.length >= 2) {
                streaks.push({
                    startDate: currentStreak[0],
                    endDate: currentStreak[currentStreak.length - 1],
                    length: currentStreak.length,
                    dates: [...currentStreak]
                });
            }
            
            if (streaks.length > 0) {
                userStreaks[username] = streaks;
            }
        });
        
        // Flatten all streaks and sort by length
        const allStreaks = [];
        Object.entries(userStreaks).forEach(([username, streaks]) => {
            streaks.forEach(streak => {
                allStreaks.push({
                    username,
                    ...streak
                });
            });
        });
        
        // Sort by streak length (longest first)
        allStreaks.sort((a, b) => b.length - a.length);
        
        // Display results
        console.log('\n🏆 ATTENDANCE STREAKS (3+ days)');
        console.log('=====================================');
        
        if (allStreaks.length === 0) {
            console.log('No streaks of 3+ days found.');
        } else {
            allStreaks.forEach((streak, index) => {
                console.log(`${index + 1}. ${streak.username} - ${streak.length} days`);
                console.log(`   ${streak.startDate} to ${streak.endDate}`);
                console.log(`   Dates: ${streak.dates.join(', ')}`);
                console.log('');
            });
        }
        
        return allStreaks;
    }
}

// Default instance for current day
const credits = new Credits();
module.exports = credits;
module.exports.Credits = Credits;