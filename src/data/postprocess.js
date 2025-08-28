const fs = require('fs');
const path = require('path');

const LOGS_DIR = path.join(__dirname, '..', '..', 'logs');
const CAST_FILE = path.join(__dirname, 'cast.json');

// Utility functions
function setByPath(obj, path, value) {
    const keys = path.split('.');
    let o = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        if (o[keys[i]] === undefined) o[keys[i]] = {};
        o = o[keys[i]];
    }
    o[keys[keys.length - 1]] = value;
}

/**
 * Simple seedable random number generator (Linear Congruential Generator)
 * @param {string} seed - String to use as seed
 * @returns {function} Random function that returns number between 0 and 1
 */
function createSeededRandom(seed) {
    let seedValue = 0;
    for (let i = 0; i < seed.length; i++) {
        seedValue = ((seedValue << 5) - seedValue + seed.charCodeAt(i)) & 0xffffffff;
    }
    seedValue = Math.abs(seedValue);
    
    return function() {
        seedValue = (seedValue * 1664525 + 1013904223) % 4294967296;
        return seedValue / 4294967296;
    };
}

/**
 * Shuffle array using seeded random
 * @param {Array} array - Array to shuffle
 * @param {function} random - Seeded random function
 * @returns {Array} Shuffled array
 */
function shuffleArray(array, random) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Process randomized cast selection from cast.json
 * @param {Object} data - The credits data object
 * @param {string} filename - Current log filename for seeding randomness
 * @returns {Array} Selected cast members
 */
function processRandomizedCast(data, filename) {
    try {
        // Load cast from cast.json
        const castData = JSON.parse(fs.readFileSync(CAST_FILE, 'utf8'));
        
        // Filter out empty entries
        const validCast = castData.filter(member => member.name && member.name.trim() !== '');
        
        if (validCast.length === 0) {
            console.warn('No valid cast members found in cast.json');
            return [];
        }
        
        // Create seeded random using filename
        const random = createSeededRandom(filename || 'default');
        
        // Randomize the number of cast members (10-15)
        const minCast = 15;
        const maxCast = 20;
        const numToSelect = minCast + Math.floor(random() * (maxCast - minCast + 1));
        
        // Shuffle cast and select the random number
        const shuffledCast = shuffleArray(validCast, random);
        const selectedCast = shuffledCast.slice(0, Math.min(numToSelect, validCast.length));
        
        // Set in data
        setByPath(data, 'cast', selectedCast);
        
        console.log(`[postprocess] Selected ${selectedCast.length} cast members for ${filename}`);
        return selectedCast;
        
    } catch (error) {
        console.error('Error processing randomized cast:', error);
        setByPath(data, 'cast', []);
        return [];
    }
}

/**
 * Get excluded users from environment
 * @returns {string[]} Array of excluded usernames (lowercase)
 */
function getExcludedUsers() {
    return process.env.EXCLUDED_USERS ? 
        process.env.EXCLUDED_USERS.split(',').map(user => user.trim().toLowerCase()) : 
        [];
}

/**
 * Process top chatters from message data
 * @param {Object} data - The credits data object
 * @param {Function} getter - Function to get data by path
 * @returns {Object} Processed top chatters object
 */
function processTopChatters(data, getter) {
    const chatters = getter('messages.chatters') || {};
    const chattersArr = Object.entries(chatters).map(([name, count]) => ({ name, count }));
    const topChattersArr = chattersArr.sort((a, b) => b.count - a.count).slice(0, 24);

    // Convert back to object { username: count, ... }
    const topChattersObj = {};
    for (const { name, count } of topChattersArr) {
        topChattersObj[name] = count;
    }

    setByPath(data, 'messages.topChatters', topChattersObj);
    return topChattersObj;
}

/**
 * Process top moderators with filtering and sorting
 * @param {Object} data - The credits data object
 * @param {Function} getter - Function to get data by path
 * @returns {string[]} Sorted array of moderator usernames
 */
function processTopModerators(data, getter) {
    const excludedUsers = getExcludedUsers();
    const moderators = getter('stream.moderators') || [];
    
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
        const aCount = getter(`messages.chatters.${a}`) || 0;
        const bCount = getter(`messages.chatters.${b}`) || 0;
        return bCount - aCount; // Sort by message count descending
    });

    setByPath(data, 'stream.moderatorsSorted', sortedModerators);
    return sortedModerators;
}

/**
 * Calculate current attendance streaks for users starting from the latest stream
 * @param {Object} data - The credits data object
 * @returns {Object} User current streaks object
 */
function calculateAttendanceStreaks(data) {
    const logs = getAllLogs(); // Already sorted by date descending (newest first)
    const userStreaks = {};
    
    if (logs.length === 0) return {};
    
    // Get all unique users from the latest log first
    let allUsers = new Set();
    logs.forEach(log => {
        try {
            const logData = JSON.parse(fs.readFileSync(path.join(LOGS_DIR, log.filename), 'utf8'));
            const presentUsers = logData.present || [];
            presentUsers.forEach(user => allUsers.add(user));
        } catch (e) {
            console.error(`Error reading ${log.filename}:`, e);
        }
    });
    
    // For each user, calculate their current streak starting from the latest stream
    allUsers.forEach(username => {
        let currentStreak = 0;
        
        // Go through logs from newest to oldest
        for (const log of logs) {
            try {
                const logData = JSON.parse(fs.readFileSync(path.join(LOGS_DIR, log.filename), 'utf8'));
                const presentUsers = logData.present || [];
                
                if (presentUsers.includes(username)) {
                    currentStreak++;
                } else {
                    // Streak broken, stop counting for this user
                    break;
                }
            } catch (e) {
                console.error(`Error reading ${log.filename}:`, e);
                break;
            }
        }
        
        // Only save streaks of 2 or more
        if (currentStreak >= 2) {
            userStreaks[username] = currentStreak;
        }
    });
    
    // Sort by streak length (highest first)
    const sortedStreaks = Object.entries(userStreaks)
        .sort((a, b) => b[1] - a[1]);
    
    // Save to presentStreak
    setByPath(data, 'presentStreak', Object.fromEntries(sortedStreaks));
    return Object.fromEntries(sortedStreaks);
}

/**
 * Process top emotes from usage data
 * @param {Object} data - The credits data object
 * @param {Function} getter - Function to get data by path
 * @returns {Object} Processed top emotes object
 */
function processTopEmotes(data, getter) {
    const emoteUsage = getter('emotes.usage') || {};
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
    
    setByPath(data, 'emotes.top', topEmotesObj);
    return topEmotesObj;
}

/**
 * Get all log files sorted by date
 * @returns {Array} Array of log file objects
 */
function getAllLogs() {
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

/**
 * Main postprocess function that runs all processing steps
 * @param {Object} data - The credits data object
 * @param {Function} getter - Function to get data by path (e.g., credits.get.bind(credits))
 * @param {string} filename - Current log filename for seeding randomness
 * @returns {Object} The processed data object
 */
function postProcess(data, getter, filename) {
    
    // Process randomized cast (do this first so other processing can use it)
    processRandomizedCast(data, filename);
    
    // Process top chatters
    processTopChatters(data, getter);
    
    // Process top moderators
    processTopModerators(data, getter);
    
    // Calculate attendance streaks
    calculateAttendanceStreaks(data);
    
    // Process top emotes
    processTopEmotes(data, getter);

    return data;
}

module.exports = {
    postProcess,
    processTopChatters,
    processTopModerators,
    calculateAttendanceStreaks,
    processTopEmotes,
    processRandomizedCast,
    getExcludedUsers,
    getAllLogs
};
