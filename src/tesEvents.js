const tes = require("./tes");
const credits = require('./credits');
const { Credits } = require('./credits');

require('dotenv').config(); 

let currentStreamCredits = credits; // Default to today's credits

tes.on("stream.online", (event) => {
    console.log(`🔴 Stream went online: ${event.broadcaster_user_name}`);
    
    // Create new log file for this stream
    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const logFileName = `${timestamp}.json`;
    
    currentStreamCredits = Credits.createInstance(logFileName);
    currentStreamCredits.startNewStream();
});

tes.on("stream.offline", (event) => {
    console.log(`⚫ Stream went offline: ${event.broadcaster_user_name}`);
    
    if (currentStreamCredits) {
        currentStreamCredits.endStream();
    }
});

tes.on("channel.update", (event) => {
    console.log(`${event.broadcaster_user_name}'s new title is ${event.title}`);
    console.log(`${event.broadcaster_user_name}'s new category is ${event.category_name}`);
    
    currentStreamCredits.append('stream.titleHistory', event.title);
    currentStreamCredits.append('stream.categoryHistory', event.category_name);
});


tes.on("channel.shared_chat.begin", (event) => {
    console.log(`🤝 Shared chat began with ${event.participants.length} participants`);
    
    // Loop through all participants and add their broadcaster names as special guests
    event.participants.forEach(participant => {
        const guestName = participant.broadcaster_user_name;
        if (currentStreamCredits.appendUnique('stream.specialGuests', guestName)) {
            console.log(`[special guest] Added ${guestName} to special guests list`);
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
    // Use currentStreamCredits instead of credits
});

tes.on("channel.ban", (event) => {
    // Use currentStreamCredits for all tracking
    if (event.ends_at !== null) {
        currentStreamCredits.increment("moderation.timeouts");
    } else {
        currentStreamCredits.increment('moderation.bans');
    }

    // Blicky
    if (event.reason && event.reason.toLowerCase().includes("emote detected")) {
        
        const lowerReason = event.reason.toLowerCase();
        
        if (lowerReason.includes("xqc")) {
            currentStreamCredits.increment("blicky.xqc");
        }
        if (lowerReason.includes("hasan")) {
            currentStreamCredits.increment("blicky.hasanabi");
        }
        if (lowerReason.includes("poki")) {
            currentStreamCredits.increment("blicky.pokimane");
        }
        if (lowerReason.includes("miz")) {
            currentStreamCredits.increment("blicky.mizkif");
        }
    }


    // TRACK MODERATOR ACTIONS
    const chatterPath = `stream.moderators.${event.moderator_user_name}`;
    if (currentStreamCredits.get(chatterPath) === undefined) {
        currentStreamCredits.set(chatterPath, 1);
    } else {
        currentStreamCredits.add(chatterPath, 50);
    }

});

tes.on("revocation", (subscriptionData) => {
    console.log(`Subscription ${subscriptionData.id} has been revoked`);
    // perform necessary cleanup here
});

// Export the current stream credits instance
module.exports = { currentStreamCredits };

