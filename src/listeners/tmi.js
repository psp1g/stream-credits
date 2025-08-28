const tmi = require('tmi.js');
const { setupTMIEvents } = require('../events/tmiEvents');
const { setupTMICommands } = require('../events/tmiCommands');
require('dotenv').config();

console.log(`[debug] Attempting to connect to channel: ${process.env.TWITCH_CHANNEL_NAME}`);

const tmiClient = new tmi.Client({
    options: { 
        debug: false // Enable debug to see more connection info
    },
    connection: {
        reconnect: true,
        secure: true, // Try with secure connection
        port: 443
    },
    channels: [ process.env.TWITCH_CHANNEL_NAME ]
});

// Setup all TMI events
setupTMIEvents(tmiClient);
setupTMICommands(tmiClient);

// Connection-related events that need to stay here for connection management
tmiClient.on('connected', (address, port) => {
    console.log(`[connected] Connected to ${address}:${port}`);
});

tmiClient.on('connecting', (address, port) => {
    console.log(`[connecting] Connecting to ${address}:${port}`);
});

tmiClient.on('disconnected', (reason) => {
    console.log(`[disconnected] Disconnected: ${reason}`);
    // Remove the manual reconnection since TMI handles it automatically
});

tmiClient.on('logon', () => {
    console.log(`[logon] Connection established, sending info to server`);
});

tmiClient.on('reconnect', () => {
    console.log(`[reconnect] TMI.js is reconnecting...`);
});

tmiClient.on('notice', (channel, msgid, message) => {
    console.log(`[notice] ${msgid}: ${message}`);
});

tmiClient.on('error', (error) => {
    console.error(`[error] TMI connection error:`, error);
});

// Connect with error handling
tmiClient.connect().catch((error) => {
    console.error('[connect] Failed to connect to Twitch:', error);
});

module.exports = tmiClient;