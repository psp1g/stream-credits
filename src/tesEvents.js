const tes = require("./tes");
const credits = require('./credits');

require('dotenv').config(); 


tes.on("channel.update", (event) => {
    console.log(`${event.broadcaster_user_name}'s new title is ${event.title}`);
    console.log(`${event.broadcaster_user_name}'s new category is ${event.category_name}`);
    
    credits.append('stream.titleHistory', event.title);
    credits.append('stream.categoryHistory', event.category_name);
});



tes.on("channel.subscribe", (event) => {
    const { user_login, user_name, is_gift } = event;
    if (is_gift) {
        console.log(`Thank you ${user_login} for gifting a sub!`);
    } else {
        console.log(`Thank you ${user_login} for subbing!`);
    }
});

tes.on("channel.chat.message", (event) => {
    //  console.log(event.message.text)

});

tes.on("channel.ban", (event) => {
    console.log();

    // timeout
    if (event.ends_at !== null) {
        credits.increment("moderation.timeouts");
        // credits.add("moderation.totalTimeoutSeconds", event.duration);
    } else{ //ban
        credits.increment('moderation.bans');
    }

    // Blicky
    if (event.reason && event.reason.toLowerCase().includes("emote detected")) {
        
        const lowerReason = reason.toLowerCase();
        
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

