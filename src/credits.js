const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'logs/data.json');
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
        // this.data = this.load();
        this.data = this.defaults;
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
        // this.save();
    }

    increment(path) {
        // Always add 1
        this.add(path, 1);
    }

    add(path, value) {
        addByPath(this.data, path, value);
        // this.save();
    }

    append(path, value) {
        appendByPath(this.data, path, value);
        // this.save();
    }

    getAll() {
        postProcess();
        return this.data;
    }


    postProcess(){
         // --- TOP CHATTERS ---
        const chatters = credits.get('messages.chatters') || {};
        const chattersArr = Object.entries(chatters).map(([name, count]) => ({ name, count }));
        const topChattersArr = chattersArr.sort((a, b) => b.count - a.count).slice(0, 5);

        // Convert back to object { username: count, ... }
        const topChattersObj = {};
        for (const { name, count } of topChattersArr) {
            topChattersObj[name] = count;
        }

        credits.set('messages.topChatters', topChattersObj);
    }
}

const credits = new Credits();
module.exports = credits;