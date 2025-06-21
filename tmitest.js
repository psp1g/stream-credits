// Import tmi.min.js
const tmi = require('tmi.js');
const fs = require('fs');
const path = require('path');

const clientId = "mbahipc06tkpvsedf2ezlslh5fzd55"
const token = "p5c5rm4rvcy7ngappozzubwf598tdf"

// Set up the client
const client = new tmi.Client({
	options: { debug: true },
    connection: {
        reconnect: true,
        secure: true
    },
    identity: {
        username: 'flovrek',
        password: `oauth:7dee508hwg57hvni6ebmg4zoqbj1sw`
    },
	channels: [ 'psp1g' ]
});

client.connect();
console.log('waga');

const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

client.on('chat', (channel, tags, message, self) => {
    // Ignore echoed messages.
    if (self) return;

    // Log everything exposed by the client on message event
    const logEntry = {
        timestamp: new Date().toISOString(),
        channel,
        tags,
        message,
        self
    };

    // Pretty-print to console
    console.log('--- FULL MESSAGE EVENT ---');
    console.dir(logEntry, { depth: null, colors: true });

    // Write to JSON file (append as line-delimited JSON)
    const logFile = path.join(logsDir, `${channel.replace('#', '')}.json`);
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
});

// List of all tmi.js events you want to track
const events = [
    'action',              // Action - Received action message on channel.
    'anongiftpaidupgrade', // Anongiftpaidupgrade - Username is continuing the Gift Sub they got from an anonymous user in channel.
    'ban',                 // Ban - Username has been banned on a channel.
    'chat',                // Chat - Received message on channel.
    'cheer',               // Cheer - Username has cheered to a channel.
    'clearchat',           // Clearchat - Chat of a channel got cleared.
    'connected',           // Connected - Connected to server.
    'connecting',          // Connecting - Connecting to a server.
    'disconnected',        // Disconnected - Got disconnected from server.
    'emoteonly',           // Emoteonly - Channel enabled or disabled emote-only mode.
    'emotesets',           // Emotesets - Received the emote-sets from Twitch.
    'followersonly',       // Followersonly - Channel enabled or disabled followers-only mode.
    'giftpaidupgrade',     // Giftpaidupgrade - Username is continuing the Gift Sub they got from sender in channel.
    'hosted',              // Hosted - Channel is now hosted by another broadcaster.
    'hosting',             // Hosting - Channel is now hosting another channel.
    'join',                // Join - Username has joined a channel.
    'logon',               // Logon - Connection established, sending informations to server.
    'message',             // Message - Received a message.
    'messagedeleted',      // Messagedeleted - Message was deleted/removed.
    'mod',                 // Mod - Someone got modded on a channel.
    'mods',                // Mods - Received the list of moderators of a channel.
    'notice',              // Notice - Received a notice from server.
    'part',                // Part - User has left a channel.
    'ping',                // Ping - Received PING from server.
    'pong',                // Pong - Sent a PING request ? PONG.
    'r9kbeta',             // R9kbeta - Channel enabled or disabled R9K mode.
    'raided',              // Raided - Channel is now being raided by another broadcaster.
    'raw_message',         // Raw_message - IRC data was received and parsed.
    'reconnect',           // Reconnect - Trying to reconnect to server.
    'resub',               // Resub - Username has resubbed on a channel.
    'roomstate',           // Roomstate - The current state of the channel.
    'serverchange',        // Serverchange - Channel is no longer located on this cluster.
    'slowmode',            // Slowmode - Gives you the current state of the channel.
    'subgift',             // Subgift - Username gifted a subscription to recipient in a channel.
    'submysterygift',      // Submysterygift - Username is gifting a subscription to someone in a channel.
    'subscribers',         // Subscribers - Channel enabled or disabled subscribers-only mode.
    'subscription',        // Subscription - Username has subscribed to a channel.
    'timeout',             // Timeout - Username has been timed out on a channel.
    'unhost',              // Unhost - Channel ended the current hosting.
    'unmod',               // Unmod - Someone got unmodded on a channel.
    'vips',                // VIPs - Received the list of VIPs of a channel.
    'whisper'              // Whisper - Received a whisper.
];

// Get today's date in YYYY-MM-DD format
const today = new Date().toISOString().slice(0, 10);

// Attach a logger for each event
events.forEach(event => {
    client.on(event, (...args) => {
        const logEntry = {
            timestamp: new Date().toISOString(),
            event,
            args
        };

        // Pretty-print to console
        console.log(`--- EVENT: ${event} ---`);
        console.dir(logEntry, { depth: null, colors: true });

        // Write to JSON file named after today's date
        const logFile = path.join(logsDir, `${today}.json`);
        fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
    });
});

