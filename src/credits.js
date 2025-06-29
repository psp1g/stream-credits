const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'logs/dataga.json');
const DEFAULTS_FILE = path.join(__dirname, 'default.json');

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
    constructor() {
        this.defaults = JSON.parse(fs.readFileSync(DEFAULTS_FILE, 'utf8'));
        this.data = this.load();
        // this.data = this.defaults;
    }

    load() {
        if (fs.existsSync(DATA_FILE)) {
            try {
                const fileData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
                return { ...this.defaults, ...fileData };
            } catch (e) {
                console.error("Failed to load data.json, using defaults.", e);
                return { ...this.defaults };
            }
        } else {
            return { ...this.defaults };
        }
    }

    save() {
        fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2));
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


    postProcess() { 
        // --- TOP CHATTERS ---
        const chatters = this.get('messages.chatters') || {};
        const chattersArr = Object.entries(chatters).map(([name, count]) => ({ name, count }));
        const topChattersArr = chattersArr.sort((a, b) => b.count - a.count).slice(0, 20);

        // Convert back to object { username: count, ... }
        const topChattersObj = {};
        for (const { name, count } of topChattersArr) {
            topChattersObj[name] = count;
        }

        this.set('messages.topChatters', topChattersObj);

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
        
        const firstThreeEmotes = topEmotesArr.slice(0, 3);
        console.log('Top 3 emotes:');
        firstThreeEmotes.forEach((emote, idx) => {
            console.log(`${idx + 1}. ${emote.id}: ${emote.count}`);
        });

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
}

const credits = new Credits();
module.exports = credits;