const TES = require("tesjs");
require('dotenv').config(); 

const app = require('../server'); 

const subscriptionConfig = {
    "channel.update": {
        version: "2"
    },
    "channel.chat.message": { // user:read:chat
        conditions: { user_id: "415401864" }
    },
    "channel.subscribe": {},    // channel:read:subscriptions
    "channel.ban": {},              // channel:moderate
    "stream.online": {},
    "stream.offline": {},
    "channel.shared_chat.begin": {}
};


console.log(process.env.TWITCH_CLIENT_SECRET);
// initialize TESjs
const tes = new TES({
    identity: {
        id: process.env.TWITCH_CLIENT_ID,
        secret: process.env.TWITCH_CLIENT_SECRET
    },
    listener: {
        type: "webhook",
        server: app,
        baseURL: "https://psp.flourek.dev",
        secret: process.env.WEBHOOKS_SECRET,
    }
});






// Generic subscription handler
async function subscribeToEvents() {
    const promises = Object.entries(subscriptionConfig).map(([event, config]) => {
        const condition = { 
            broadcaster_user_id: process.env.TWITCH_CHANNEL_ID,
            ...config.conditions 
        };
        
        return tes.subscribe(event, condition, config.version)
            .then(() => console.log(`✅ ${event} subscription successful`))
            .catch(err => console.error(`❌ ${event} subscription failed:`, err));
    });
    
    await Promise.allSettled(promises);
}


async function logSubscriptions() {
    const subs = await tes.getSubscriptions();
    console.log(`I have ${subs.total} event subscriptions`);
    console.log(JSON.stringify(subs, null, 2));
}

// Function to unsubscribe from all subscriptions
async function unsubscribeFromAll() {
    try {
        const subs = await tes.getSubscriptions();
        console.log(`Found ${subs.total} subscriptions to remove`);
        
        const promises = subs.data.map(subscription => {
            return tes.unsubscribe(subscription.id)
                .then(() => console.log(`✅ Unsubscribed from ${subscription.type} (${subscription.id})`))
                .catch(err => console.error(`❌ Failed to unsubscribe from ${subscription.type}:`, err));
        });
        
        await Promise.allSettled(promises);
        console.log('🧹 Cleanup complete');
        subscribeToEvents();

    } catch (err) {
        console.error('❌ Failed to get subscriptions for cleanup:', err);
    }
}

unsubscribeFromAll();
setTimeout(logSubscriptions, 10000);


module.exports = tes;