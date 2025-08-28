const {tes} = require("../listeners/tes");
const credits = require('../data/credits');
const { Credits } = require('../data/credits');

require('dotenv').config(); 

tes.on("stream.online", (event) => {
    console.log(`🔴 Stream went online: ${event.broadcaster_user_name}`);
    
    credits.startNewStream();
});

tes.on("stream.offline", (event) => {
    console.log(`⚫ Stream went offline: ${event.broadcaster_user_name}`);
    
    credits.endStream();
});

tes.on("channel.update", (event) => {
    console.log(`${event.broadcaster_user_name}'s new title is ${event.title}`);
    console.log(`${event.broadcaster_user_name}'s new category is ${event.category_name}`);
    
    credits.append('stream.titleHistory', event.title);
    credits.append('stream.categoryHistory', event.category_name);
});


tes.on("channel.shared_chat.begin", (event) => {
    console.log(`🤝 Shared chat began with ${event.participants.length} participants`);
    const mainChannel = process.env.TWITCH_CHANNEL_NAME.toLowerCase();
    event.participants.forEach(participant => {
        const guestName = participant.broadcaster_user_name;
        if (guestName.toLowerCase() !== mainChannel) {
            if (credits.appendUnique('stream.specialGuests', guestName)) {
                console.log(`[special guest] Added ${guestName} to special guests list`);
            }
        }
    });
});

tes.on("channel.subscribe", (event) => {
    const { user_login, user_name, is_gift } = event;
    if (is_gift) {
        console.log(`Thank you ${user_login} for gifting a sub!`);
    } else {
        console.log(`Thank you ${user_login} for subbing!`);
    }
    // Use credits instead of currentStreamCredits
});

tes.on("channel.ban", (event) => {
    // Use credits for all tracking
    if (event.ends_at !== null) {
        credits.increment("moderation.timeouts");
    } else {
        credits.increment('moderation.bans');
    }

    if (event.reason.includes("NUKED")) {
        credits.increment("blicky.nuked");
    }
    
    // Blicky
    if (event.reason && event.reason.toLowerCase().includes("emote detected")) {
        
        const lowerReason = event.reason.toLowerCase();
        
        if (lowerReason.includes("xqc")) {
            credits.increment("blicky.xqc");
        }
        if (lowerReason.includes("hasan")) {
            credits.increment("blicky.hasanabi");
        }
        if (lowerReason.includes("poki")) {
            credits.increment("blicky.pokimane");
        }
        if (lowerReason.includes("miz")) {
            credits.increment("blicky.mizkif");
        }
    }


    // TRACK MODERATOR ACTIONS
    const chatterPath = `stream.moderators.${event.moderator_user_name}`;
    if (credits.get(chatterPath) === undefined) {
        credits.set(chatterPath, 1);
    } else {
        credits.add(chatterPath, 50);
    }

});

tes.on("revocation", (subscriptionData) => {
    console.log(`Subscription ${subscriptionData.id} has been revoked`);
    // perform necessary cleanup here
});

// Handle TES disconnection - force reconnect
tes.on('disconnected', () => {
    console.log('[TES] Disconnected - forcing reconnection...');
    
    // Force reconnect TMI client too
    const tmiClient = require('../listeners/tmi');
    if (tmiClient && tmiClient.readyState() !== 'OPEN') {
        console.log('[TES] Also forcing TMI reconnection...');
        tmiClient.connect().catch(console.error);
    }
});

// No need to export anything - everything uses the default credits instance
module.exports = {};

