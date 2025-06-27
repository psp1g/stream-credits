const TES = require("tesjs");
require('dotenv').config(); 

const app = require('./server'); 



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

// define an event handler for the `channel.update` event
// NOTES: 
//   this handles ALL events of that type
//   events will not be fired until there is a subscription made for them
tes.on("channel.update", (event) => {
    console.log(`${event.broadcaster_user_name}'s new title is ${event.title}`);
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
     console.log(event.message.text)

});

tes.on("revocation", (subscriptionData) => {
    console.log(`Subscription ${subscriptionData.id} has been revoked`);
    // perform necessary cleanup here
});

async function logSubscriptions() {
    const subs = await tes.getSubscriptions();
    console.log(`I have ${subs.total} event subscriptions`);
    console.log(JSON.stringify(subs, null, 2));
}


// create a new subscription for the `channel.update` event for broadcaster "1337"
tes.subscribe("channel.update", { broadcaster_user_id: "415401864" })
    .then(() => {
        console.log("Subscription successful");
    }).catch(err => {
        console.log(err);
    });

tes.subscribe("channel.chat.message", { broadcaster_user_id: "415401864", user_id: "415401864" })
    .then(() => {
        console.log("Subscription successful");
    }).catch(err => {
        console.log(err);
    });

tes.subscribe("channel.subscribe", { broadcaster_user_id: "415401864" })
    .then(() => {
        console.log("Subscription successful");
    }).catch(err => {
        console.log(err);
    });


// logSubscriptions();
