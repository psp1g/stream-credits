const credits = require('../data/credits');
const emoteTracker = require('../emotes');

function setupTMIEvents(client) {
    
    // Initialize emote tracking when connected
    client.on('connected', async (address, port) => {
        console.log(`[connected] Connected to ${address}:${port}`);
        await emoteTracker.initialize(process.env.TWITCH_CHANNEL_NAME);
    });

    // Raided - Channel is now being raided by another broadcaster.
    client.on('raided', (channel, username, viewers) => {
        credits.append('raid.raiders', {username: username, viewers: viewers} );
        credits.add("raid.totalViewers", viewers);
        console.log(`[raided] ${channel} raided by ${username} with ${viewers} viewers`);
    });

    //  -------------- MESSAGES STATS -----------------
    client.on('message', (channel, tags, message, self) => {
        username = tags['display-name'];

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

        // if halflife in category
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

        // track attending moderators
        if (tags['mod']) {
            const chatterPath = `stream.moderators.${username}`;
            if (credits.get(chatterPath) === undefined) {
                credits.set(chatterPath, 0);
            } else {
                credits.add(chatterPath, 1);
            }
        }

        // ---- EMOTE SPECIFIC ----
        if (tags['first-msg']) {
            if (message.includes('test')) {
                credits.increment('emotes.firstTimeTesters');
            }
        }

        // ---- EMOTE TRACKING (now handled by emoteTracker) ----
        emoteTracker.trackEmotes(message, tags.emotes, credits);
    });
    

    // watch streaks
    client.on('raw_message', (messageCloned, message) => {
        // Check for watch streak messages in the raw IRC string
        if (message.raw && message.raw.includes('msg-param-category=watch-streak')) {
            const rawString = message.raw;
            
            // Extract display-name
            const username = tags['display-name']
            
            // Extract msg-param-value
            const valueMatch = rawString.match(/msg-param-value=(\d+)/);
            const streakValue = valueMatch ? parseInt(valueMatch[1]) : null;
            
            if (username && streakValue) {
                const watchStreakPath = `watchStreaks.${username}`;
                if (credits.get(watchStreakPath) === undefined) {
                    credits.set(watchStreakPath, streakValue);
                } else {
                    credits.set(watchStreakPath, streakValue);
                }
                console.log(`[watch-streak] ${username} achieved ${streakValue} consecutive streams`);
            }
        }

        // Serialize the raw IRC message object for logging
        // console.log(`[raw_message] IRC data received: ${JSON.stringify(message, null, 2)}`);
    });



    // ---------------- SUPPORT -------------------

    // Cheer - Username has cheered to a channel.
    client.on('cheer', (channel, tags, message) => {
        credits.append('support.cheers.users', {username: tags["display-name"], amount: tags['bits']} );
        credits.add("support.cheers.totalBits", tags['bits']);
        console.log(`[cheer] ${tags['display-name']} cheered: ${message}`);
    });

    // Subgift - Username gifted a subscription to recipient in a channel.
    client.on('subgift', (channel, username, streakMonths, recipient, methods, userstate) => {
        credits.increment('support.subs.gifters');
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
        credits.add('support.subs.gifters', numbOfSubs);
        console.log(`[submysterygift] ${username} is gifting ${numbOfSubs} subs in ${channel}`);
    });

    // Subscription - Username has subscribed to a channel.
    client.on('subscription', (channel, username, methods, message, userstate) => {
        credits.increment('support.subs.new');
        credits.append('support.subs.users', username);
        console.log(`[subscription] ${username} subscribed in ${channel}: ${message}`);
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

    // Anongiftpaidupgrade - Username is continuing the Gift Sub they got from an anonymous user in channel.
    client.on('anongiftpaidupgrade', (channel, username, userstate) => {
        console.log(`[anongiftpaidupgrade] ${username} continued a gift sub in ${channel}`);
    });

    // Clearchat - Chat of a channel got cleared.
    client.on('clearchat', (channel) => {
        console.log(`[clearchat] Chat cleared in ${channel}`);
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

    // R9kbeta - Channel enabled or disabled R9K mode.
    client.on('r9kbeta', (channel, enabled) => {
        console.log(`[r9kbeta] R9K mode in ${channel}: ${enabled}`);
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
}

module.exports = { setupTMIEvents };
