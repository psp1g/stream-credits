const tmi = require('tmi.js');
const { setupTMIEvents } = require('../events/tmiEvents');
require('dotenv').config();

const client = new tmi.Client({
    options: { debug: true },
    connection: {
        reconnect: true,
        secure: true,
        maxReconnectAttempts: null, // Infinite reconnect attempts
        maxReconnectInterval: 30000, // Max 30 seconds between reconnects
        reconnectDecay: 1.5, // Exponential backoff multiplier
        reconnectInterval: 1000 // Start with 1 second delay
    },
    channels: [ process.env.TWITCH_CHANNEL_NAME ]
});

// Setup all TMI events
setupTMIEvents(client);

// Connection-related events that need to stay here for connection management
client.on('connected', (address, port) => {
    console.log(`[connected] Connected to ${address}:${port}`);
});

client.on('connecting', (address, port) => {
    console.log(`[connecting] Connecting to ${address}:${port}`);
});

client.on('disconnected', (reason) => {
    console.log(`[disconnected] Disconnected: ${reason}`);
    console.log(`[disconnected] TMI will attempt to reconnect automatically...`);
});

client.on('logon', () => {
    console.log(`[logon] Connection established, sending info to server`);
});

client.on('ping', () => {
    console.log(`[ping] Received PING from server`);
});

client.on('pong', (latency) => {
    console.log(`[pong] PONG sent, latency: ${latency}ms`);
});

client.on('reconnect', () => {
    console.log(`[reconnect] Attempting to reconnect to Twitch...`);
});

// Handle connection errors
client.on('notice', (channel, msgid, message) => {
    console.log(`[notice] ${msgid}: ${message}`);
});

// Handle any connection errors
client.on('error', (error) => {
    console.error(`[error] TMI connection error:`, error);
    // TMI will handle reconnection automatically due to reconnect: true
});

// Raw message handling (optional, for debugging)
client.on('raw_message', (messageCloned, message) => {
    // console.log(`[raw_message] IRC data received: ${message.raw}`);
});

// Join events (optional, for debugging)
// client.on('join', (channel, username, self) => {
//     console.log(`[join] ${username} joined ${channel}`);
// });

// Connect with error handling
client.connect().catch((error) => {
    console.error('[connect] Failed to connect to Twitch:', error);
    console.log('[connect] TMI will attempt to reconnect automatically...');
});

// Additional connection monitoring
let connectionTimeout;
let isConnected = false;

client.on('connected', () => {
    isConnected = true;
    if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        connectionTimeout = null;
    }
});

client.on('disconnected', () => {
    isConnected = false;
});

// Monitor connection health
setInterval(() => {
    if (!isConnected) {
        console.log('[health-check] Connection lost, TMI should be attempting reconnection...');
    }
}, 60000); // Check every minute
