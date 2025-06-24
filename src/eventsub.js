const { ApiClient } = require('twitch');
const { ClientCredentialsAuthProvider } = require('twitch-auth');
const { DirectConnectionAdapter, EventSubListener, ReverseProxyAdapter } = require('twitch-eventsub');
const fs = require('fs');
const path = require('path');


const clientId = 'u94z9qatx8h6l5wvoj4gy52qq5uhn8';
const broadcasterUserId = '415401864'; // Replace with your broadcaster user ID
const userId = '415401864'; // Replace with your broadcaster user ID


(async () => {
    const authProvider = new ClientCredentialsAuthProvider(clientId, clientSecret);
    const apiClient = new ApiClient({ authProvider });
    
    // const listener = new EventSubListener(client, new NgrokAdapter(), 'thisShouldBeARandomlyGeneratedFixedString');
    
//  const listener = new EventSubListener(
//     apiClient,
//     new ReverseProxyAdapter({
//         hostName: 'flourek.dev',
//         port: 3000
//     }),
//     'thisShouldBeARandomlyGeneratedFixedString'
// );

    const listener = new EventSubListener(apiClient, new DirectConnectionAdapter({
        hostName: 'flourek.dev',
        sslCert: {
            key: fs.readFileSync('/home/ubuntu/stream-credits/flourek.dev/privkey.pem'),
            cert: fs.readFileSync('/home/ubuntu/stream-credits/flourek.dev/fullchain.pem')
        }
    }), 'thisShouldBeARandomlyGeneratedFixedString');

    await listener.listen();


    await listener.subscribeToStreamOnlineEvents(userId, e => {
        console.log(`${e.broadcasterDisplayName} just went live!`);
    });

    await listener.subscribeToStreamOfflineEvents(userId, e => {
        console.log(`${e.broadcasterDisplayName} just went offline`);
    });

    await listener.subscribeToChannelUnbanEvents(broadcasterUserId, userId, event => {
        console.log('UNBAN EVENT:', event);
        logEvent(event.broadcasterId, 'channel.unban', event);
    });

    // // Channel point redemptions
    // await listener.subscribeToChannelRedemptionAddEvents(broadcasterUserId, event => {
    //     logEvent(event.broadcasterId, 'channel.channel_points_custom_reward_redemption.add', event);
    // });

    // // Cheers (bits)
    // await listener.subscribeToChannelCheerEvents(broadcasterUserId, event => {
    //     logEvent(event.broadcasterId, 'channel.cheer', event);
    // });

    // // Ban
    // await listener.subscribeToChannelBanEvents(broadcasterUserId, event => {
    //     logEvent(event.broadcasterId, 'channel.ban', event);
    // });
    
    // await listener.subscribeToChannelUnbanEvents(broadcasterUserId, event => {
    //     logEvent(event.broadcasterId, 'channel.unban', event);
    // });

    // // Timeout (moderate)
    // await listener.subscribeToChannelModeratorEventEvents(broadcasterUserId, event => {
    //     logEvent(event.broadcasterId, 'channel.moderate', event);
    // });

    // Unban




    console.log('EventSub listener running!');
})();


const logsDir = path.join(__dirname, 'logs');
function logEvent(userId, eventType, eventData) {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const logFile = path.join(logsDir, `events-${today}.log`);

    // Ensure logs directory exists
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir);
    }

    // Delete log file at the beginning
    if (fs.existsSync(logFile)) {
        fs.unlinkSync(logFile);
    }

    const logEntry = {
        timestamp: new Date().toISOString(),
        userId,
        eventType,
        eventData
    };
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
}

