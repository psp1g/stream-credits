const fs = require('fs');
const path = require('path');

const LOGS_DIR = path.join(__dirname, 'logs');

function setByPath(obj, path, value) {
    const keys = path.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
            current[key] = {};
        }
        current = current[key];
    }
    current[keys[keys.length - 1]] = value;
}

// --- TOP CHATTERS PROCESSING ---
function processTopChatters(data) {
    const chatters = data.messages?.chatters || {};
    const chattersArr = Object.entries(chatters).map(([name, count]) => ({ name, count }));
    const topChattersArr = chattersArr.sort((a, b) => b.count - a.count).slice(0, 20);

    // Convert back to object { username: count, ... }
    const topChattersObj = {};
    for (const { name, count } of topChattersArr) {
        topChattersObj[name] = count;
    }

    setByPath(data, 'messages.topChatters', topChattersObj);
}

// --- MODERATORS PROCESSING ---
function processModerators(data) {
    // Get excluded users from environment
    const excludedUsers = process.env.EXCLUDED_USERS ? 
        process.env.EXCLUDED_USERS.split(',').map(user => user.trim().toLowerCase()) : 
        [];

    const moderators = data.stream?.moderators || [];
    
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
        const aCount = data.messages?.chatters?.[a] || 0;
        const bCount = data.messages?.chatters?.[b] || 0;
        return bCount - aCount; // Sort by message count descending
    });

    setByPath(data, 'stream.moderatorsSorted', sortedModerators);
}

// --- RAID PROCESSING ---
function processRaids(data) {
    const raiders = data.raid?.raiders || [];
    
    // Sort raiders by viewer count (highest first)
    const sortedRaiders = raiders.sort((a, b) => b.viewers - a.viewers);
    
    setByPath(data, 'raid.raiders', sortedRaiders);
}

// --- ATTENDANCE STREAKS PROCESSING ---
function processAttendanceStreaks(data) {
    const logs = getAllLogs();
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
    setByPath(data, 'presentStreak', Object.fromEntries(sortedUsers));
}

// --- EMOTES PROCESSING ---
function processEmotes(data) {
    const emoteUsage = data.emotes?.usage || {};
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
}

// --- HELPER FUNCTION ---
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

// --- MAIN POST PROCESSING FUNCTION ---
function postProcess(data) {
    console.log('Running post-processing...');
    
    processTopChatters(data);
    processModerators(data);
    processRaids(data);
    processAttendanceStreaks(data);
    processEmotes(data);
    
    console.log('Post-processing complete');
}

module.exports = {
    postProcess,
    processTopChatters,
    processModerators,
    processRaids,
    processAttendanceStreaks,
    processEmotes
};
