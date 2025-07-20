const tmi = require('tmi.js');
const { setupTMIEvents } = require('../events/tmiEvents');
require('dotenv').config();

const tmiClient = new tmi.Client({
    options: { debug: false },
    connection: {
        reconnect: true,
        secure: false,
    },
    channels: [ process.env.TWITCH_CHANNEL_NAME ]
});

// Setup all TMI events
setupTMIEvents(tmiClient);

// Connection-related events that need to stay here for connection management
tmiClient.on('connected', (address, port) => {
    console.log(`[connected] Connected to ${address}:${port}`);
});

tmiClient.on('connecting', (address, port) => {
    console.log(`[connecting] Connecting to ${address}:${port}`);
});

tmiClient.on('disconnected', (reason) => {
    console.log(`[disconnected] Disconnected: ${reason}`);
    console.log(`[disconnected] Forcing reconnection...`);
    
    // Force reconnect
    setTimeout(() => {
        tmiClient.connect().catch((error) => {
            console.error('[reconnect] Failed to reconnect:', error);
        });
    }, 2000); // Wait 2 seconds then reconnect
});

tmiClient.on('logon', () => {
    console.log(`[logon] Connection established, sending info to server`);
});

tmiClient.on('ping', () => {
    console.log(`[ping] Received PING from server`);
});

tmiClient.on('pong', (latency) => {
    console.log(`[pong] PONG sent, latency: ${latency}ms`);
});

tmiClient.on('reconnect', () => {
    console.log(`[reconnect] Attempting to reconnect to Twitch...`);
});

// Handle connection errors
tmiClient.on('notice', (channel, msgid, message) => {
    console.log(`[notice] ${msgid}: ${message}`);
});

// Handle any connection errors
tmiClient.on('error', (error) => {
    console.error(`[error] TMI connection error:`, error);
    // TMI will handle reconnection automatically due to reconnect: true
});


// Join events (optional, for debugging)
// client.on('join', (channel, username, self) => {
//     console.log(`[join] ${username} joined ${channel}`);
// });

// Connect with error handling
tmiClient.connect().catch((error) => {
    console.error('[connect] Failed to connect to Twitch:', error);
    console.log('[connect] TMI will attempt to reconnect automatically...');
});
