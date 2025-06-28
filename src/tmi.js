const tmi = require('tmi.js');
const credits = require('./credits');
// const { appendLog } = require('./data'); // Uncomment to log to file

const client = new tmi.Client({
    options: { debug: true },
    connection: {
        reconnect: true,
        secure: true
    },
    // identity: {
    //     username: "Flovrek",
    // },
    // channels: [ "ramzes", "flovrek", "caedrel", "forsen" ]
    channels: [ "flovrek" ]
});

client.connect();

// Action - Received action message on channel.
// client.on('action', (channel, userstate, message, self) => {
//     console.log(`[action] ${userstate['display-name']}: ${message}`);
// });

// Anongiftpaidupgrade - Username is continuing the Gift Sub they got from an anonymous user in channel.
client.on('anongiftpaidupgrade', (channel, username, userstate) => {
    console.log(`[anongiftpaidupgrade] ${username} continued a gift sub in ${channel}`);
});




// Chat - Received message on channel.
// client.on('chat', (channel, userstate, message, self) => {
//     console.log(`[chat] ${userstate['display-name']}: ${message}`);
// });


// Clearchat - Chat of a channel got cleared.
client.on('clearchat', (channel) => {
    console.log(`[clearchat] Chat cleared in ${channel}`);
});

// Connected - Connected to server.
client.on('connected', (address, port) => {
    console.log(`[connected] Connected to ${address}:${port}`);
});

// Connecting - Connecting to a server.
client.on('connecting', (address, port) => {
    console.log(`[connecting] Connecting to ${address}:${port}`);
});

// Disconnected - Got disconnected from server.
client.on('disconnected', (reason) => {
    console.log(`[disconnected] Disconnected: ${reason}`);
});

// Emoteonly - Channel enabled or disabled emote-only mode.
client.on('emoteonly', (channel, enabled) => {
    console.log(`[emoteonly] Emote-only mode in ${channel}: ${enabled}`);
});

// Emotesets - Received the emote-sets from Twitch.
client.on('emotesets', (sets, obj) => {
    console.log(`[emotesets] Emote sets: ${sets}`);
});

// Followersonly - Channel enabled or disabled followers-only mode.
client.on('followersonly', (channel, enabled, length) => {
    console.log(`[followersonly] Followers-only in ${channel}: ${enabled}, Length: ${length}`);
});

// Giftpaidupgrade - Username is continuing the Gift Sub they got from sender in channel.
client.on('giftpaidupgrade', (channel, username, sender, userstate) => {
    console.log(`[giftpaidupgrade] ${username} continued a gift sub from ${sender} in ${channel}`);
});

// Hosted - Channel is now hosted by another broadcaster.
client.on('hosted', (channel, username, viewers, autohost) => {
    console.log(`[hosted] ${channel} is hosted by ${username} (${viewers} viewers, autohost: ${autohost})`);
});

// Hosting - Channel is now hosting another channel.
client.on('hosting', (channel, target, viewers) => {
    console.log(`[hosting] ${channel} is hosting ${target} (${viewers} viewers)`);
});

// Join - Username has joined a channel.
// client.on('join', (channel, username, self) => {
//     console.log(`[join] ${username} joined ${channel}`);
// });

// Logon - Connection established, sending informations to server.
client.on('logon', () => {
    console.log(`[logon] Connection established, sending info to server`);
});







// Mod - Someone got modded on a channel.
client.on('mod', (channel, username) => {
    console.log(`[mod] ${username} was modded in ${channel}`);
});

// Mods - Received the list of moderators of a channel.
client.on('mods', (channel, mods) => {
    console.log(`[mods] Mods in ${channel}: ${mods.join(', ')}`);
});

// Notice - Received a notice from server.
client.on('notice', (channel, msgid, message) => {
    console.log(`[notice] ${msgid} in ${channel}: ${message}`);
});

// Part - User has left a channel.
client.on('part', (channel, username, self) => {
    console.log(`[part] ${username} left ${channel}`);
});

// Ping - Received PING from server.
client.on('ping', () => {
    console.log(`[ping] Received PING from server`);
});

// Pong - Sent a PING request ? PONG.
client.on('pong', (latency) => {
    console.log(`[pong] PONG sent, latency: ${latency}ms`);
});

// R9kbeta - Channel enabled or disabled R9K mode.
client.on('r9kbeta', (channel, enabled) => {
    console.log(`[r9kbeta] R9K mode in ${channel}: ${enabled}`);
});



// Raw_message - IRC data was received and parsed.
client.on('raw_message', (messageCloned, message) => {
    console.log(`[raw_message] IRC data received: ${message.raw}`);
});

// Reconnect - Trying to reconnect to server.
client.on('reconnect', () => {
    console.log(`[reconnect] Trying to reconnect to server`);
});

// Roomstate - The current state of the channel.
client.on('roomstate', (channel, state) => {
    console.log(`[roomstate] State for ${channel}:`, state);
});

// Serverchange - Channel is no longer located on this cluster.
client.on('serverchange', (channel) => {
    console.log(`[serverchange] ${channel} moved to a new server cluster`);
});

// Slowmode - Gives you the current state of the channel.
client.on('slowmode', (channel, enabled, length) => {
    console.log(`[slowmode] Slowmode in ${channel}: ${enabled}, Length: ${length}`);
});

// Subscribers - Channel enabled or disabled subscribers-only mode.
client.on('subscribers', (channel, enabled) => {
    console.log(`[subscribers] Subscribers-only mode in ${channel}: ${enabled}`);
});





// Raided - Channel is now being raided by another broadcaster.
client.on('raided', (channel, username, viewers) => {

    credits.append('raid.raiders', {username: username, viewers: viewers} );
    credits.add("raid.totalViewers", viewers);

    console.log(`[raided] ${channel} raided by ${username} with ${viewers} viewers`);
});


 //  -------------- MESSAGES STATS -----------------
client.on('message', (channel, tags, message, self) => {

    // console.log(`[message]`, JSON.parse(JSON.stringify(tags)), ':', message);

    username = tags['display-name'] 

    if (tags['first-msg']) {
        console.log('FIRST MESSAGE:', username, message);
        credits.increment('messages.firstTimeMessages');
    }


    if (message === 'wuh') {
        console.log('AMOGUS:', credits.getAll());
    }
    
    if (message.includes('present') || message.includes('late')) {
        credits.append('present', tags['display-name']);
    }


    // if  halflife in cateagory
    if (message === 'F1' || message === 'E') {
        credits.append('creditedInHalfLifeSpeedrun', tags['display-name']);
    }

    // ---- MESSAGE STAT CATEGORY ------
    credits.increment('messages.total');

    // update how many messages per chatter also chatterCount
    const chatterPath = `messages.chatters.${username}`;
    if (credits.get(chatterPath) === undefined) {
        credits.set(chatterPath, 1);
        credits.increment('messages.chatterCount');
    } else {
        credits.increment(chatterPath);
    }




    // ---- EMOTE SPECIFIC ----
    if (tags['first-msg']) {
        if (message.includes('test')) {
            credits.increment('emotes.firstTimeTesters');
        }
    }





    // Print deserialized tags object and message
});



// ---------------- SUPPPORT -------------------

// Cheer - Username has cheered to a channel.
client.on('cheer', (channel, tags, message) => {
    credits.append('support.cheers.users', {username: tags["display-name"], amount: tags['bits']} );
    credits.add("raid.totalViewers", viewers);
    console.log(`[cheer] ${userstate['display-name']} cheered: ${message}`);
});


// Subgift - Username gifted a subscription to recipient in a channel.
client.on('subgift', (channel, username, streakMonths, recipient, methods, userstate) => {
    credits.increment('support.subs.gifted');
    credits.append('support.subs.users', username);
    console.log(`[subgift] ${username} gifted a sub to ${recipient} in ${channel} (streak: ${streakMonths})`);
});

// Resub - Username has resubbed on a channel.
client.on('resub', (channel, username, streakMonths, msg, userstate, methods) => {
    credits.increment('support.subs.resub');
    credits.append('support.subs.users', username);
    console.log(`[resub] ${username} resubbed in ${channel} (streak: ${streakMonths}): ${msg}`);
});


// Submysterygift - Username is gifting a subscription to someone in a channel.
client.on('submysterygift', (channel, username, numbOfSubs, methods, userstate) => {
    credits.add('support.subs.gifted', numbOfSubs);
    // userstate["msg-param-sender-count"]
    console.log(`[submysterygift] ${username} is gifting ${numbOfSubs} subs in ${channel}`);
});


// Subscription - Username has subscribed to a channel.
client.on('subscription', (channel, username, methods, message, userstate) => {
    credits.increment('support.subs.new');
    credits.append('support.subs.users', username);
    console.log(`[subscription] ${username} subscribed in ${channel}: ${message}`);
});



// Ban - Username has been banned on a channel.
client.on('ban', (channel, username, reason, userstate) => {
    credits.increment('moderation.bans');
    console.log(`[ban] ${username} was banned in ${channel}. Reason: ${reason}`);


});

// Timeout - Username has been timed out on a channel.
client.on('timeout', (channel, username, reason, duration, userstate) => {

    credits.increment("moderation.timeouts");
    credits.add("moderation.totalTimeoutSeconds", duration);

    //   BLICKY 
    if (reason && reason.toLowerCase().includes("emote detected")) {
        
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

    console.log(`[timeout] ${username} timed out in ${channel} for ${duration}s. Reason: ${reason}`);
});

// Messagedeleted - Message was deleted/removed.
client.on('messagedeleted', (channel, username, deletedMessage, userstate) => {
    credits.increment("moderation.deletedMessages");

    console.log(`[messagedeleted] ${username}'s message deleted in ${channel}: ${deletedMessage}`);
});




// Unhost - Channel ended the current hosting.
client.on('unhost', (channel, viewers) => {
    console.log(`[unhost] ${channel} ended hosting (viewers: ${viewers})`);
});

// Unmod - Someone got unmodded on a channel.
client.on('unmod', (channel, username) => {
    console.log(`[unmod] ${username} was unmodded in ${channel}`);
});

// VIPs - Received the list of VIPs of a channel.
client.on('vips', (channel, vips) => {
    console.log(`[vips] VIPs in ${channel}: ${vips.join(', ')}`);
});

// Whisper - Received a whisper.
client.on('whisper', (from, userstate, message, self) => {
    console.log(`[whisper] ${from}: ${message}`);
});
