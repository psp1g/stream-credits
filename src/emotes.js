const axios = require('axios');
require('dotenv').config();

class EmoteTracker {
    constructor() {
        this.emotes = {
            twitch: new Map(),
            bttv: new Map(),
            ffz: new Map(),
            seventv: new Map()
        };
        this.initialized = false;
        this.channelName = process.env.TWITCH_CHANNEL_NAME;
        this.channelId = process.env.TWITCH_CHANNEL_ID;
    }

    async initialize() {
        if (this.initialized) return;
        
        if (!this.channelName || !this.channelId) {
            throw new Error('TWITCH_CHANNEL_NAME and TWITCH_CHANNEL_ID must be set in .env file');
        }
        
        console.log(`[emotes] Initializing emote tracking for ${this.channelName} (ID: ${this.channelId})`);
        
        try {
            await Promise.all([
                this.loadBTTVEmotes(),
                this.loadFFZEmotes(),
                this.loadSevenTVEmotes()
            ]);
            
            this.initialized = true;
            console.log(`[emotes] Loaded ${this.getTotalEmoteCount()} emotes total`);
        } catch (error) {
            console.error('[emotes] Failed to initialize emotes:', error);
        }
    }

    async loadBTTVEmotes() {
        try {
            // Global BTTV emotes
            const globalResponse = await axios.get('https://api.betterttv.net/3/cached/emotes/global');
            globalResponse.data.forEach(emote => {
                this.emotes.bttv.set(emote.code, {
                    id: emote.id,
                    url: `https://cdn.betterttv.net/emote/${emote.id}/3x`,
                    service: 'bttv'
                });
            });

            // Channel-specific BTTV emotes - use channel ID
            try {
                const channelResponse = await axios.get(`https://api.betterttv.net/3/cached/users/twitch/${this.channelId}`);
                channelResponse.data.channelEmotes?.forEach(emote => {
                    this.emotes.bttv.set(emote.code, {
                        id: emote.id,
                        url: `https://cdn.betterttv.net/emote/${emote.id}/3x`,
                        service: 'bttv'
                    });
                });
                channelResponse.data.sharedEmotes?.forEach(emote => {
                    this.emotes.bttv.set(emote.code, {
                        id: emote.id,
                        url: `https://cdn.betterttv.net/emote/${emote.id}/3x`,
                        service: 'bttv'
                    });
                });
            } catch (channelError) {
                console.log(`[emotes] No BTTV channel emotes found for ${this.channelName}`);
            }

            console.log(`[emotes] Loaded ${this.emotes.bttv.size} BTTV emotes`);
        } catch (error) {
            console.error('[emotes] Failed to load BTTV emotes:', error);
        }
    }

    async loadFFZEmotes() {
        try {
            // Global FFZ emotes
            const globalResponse = await axios.get('https://api.frankerfacez.com/v1/set/global');
            Object.values(globalResponse.data.sets).forEach(set => {
                set.emoticons?.forEach(emote => {
                    const bestUrl = emote.urls['4'] || emote.urls['2'] || emote.urls['1'];
                    this.emotes.ffz.set(emote.name, {
                        id: emote.id,
                        url: bestUrl.startsWith('https:') ? bestUrl : `https:${bestUrl}`, // Fix here
                        service: 'ffz'
                    });
                });
            });

            // Channel-specific FFZ emotes - use channel name
            try {
                const channelResponse = await axios.get(`https://api.frankerfacez.com/v1/room/${this.channelName}`);
                Object.values(channelResponse.data.sets).forEach(set => {
                    set.emoticons?.forEach(emote => {
                        const bestUrl = emote.urls['4'] || emote.urls['2'] || emote.urls['1'];
                        this.emotes.ffz.set(emote.name, {
                            id: emote.id,
                            url: bestUrl.startsWith('https:') ? bestUrl : `https:${bestUrl}`, // Fix here
                            service: 'ffz'
                        });
                    });
                });
            } catch (channelError) {
                console.log(`[emotes] No FFZ channel emotes found for ${this.channelName}`);
            }

            console.log(`[emotes] Loaded ${this.emotes.ffz.size} FFZ emotes`);
        } catch (error) {
            console.error('[emotes] Failed to load FFZ emotes:', error);
        }
    }

    async loadSevenTVEmotes() {
        try {
            // Global 7TV emotes
            const globalResponse = await axios.get('https://7tv.io/v3/emote-sets/global');
            globalResponse.data.emotes?.forEach(emote => {
                this.emotes.seventv.set(emote.name, {
                    id: emote.id,
                    url: `https://cdn.7tv.app/emote/${emote.id}/4x.webp`,
                    service: '7tv'
                });
            });

            // Channel-specific 7TV emotes - use channel ID
            try {
                const userResponse = await axios.get(`https://7tv.io/v3/users/twitch/${this.channelId}`);
                const emoteSetId = userResponse.data.emote_set?.id;
                
                if (emoteSetId) {
                    const emoteSetResponse = await axios.get(`https://7tv.io/v3/emote-sets/${emoteSetId}`);
                    emoteSetResponse.data.emotes?.forEach(emote => {
                        this.emotes.seventv.set(emote.name, {
                            id: emote.id,
                            url: `https://cdn.7tv.app/emote/${emote.id}/4x.webp`,
                            service: '7tv'
                        });
                    });
                }
            } catch (channelError) {
                console.log(`[emotes] No 7TV channel emotes found for ${this.channelName}`);
            }

            console.log(`[emotes] Loaded ${this.emotes.seventv.size} 7TV emotes`);
        } catch (error) {
            console.error('[emotes] Failed to load 7TV emotes:', error);
        }
    }

    // ... rest of your methods remain the same ...
    getTotalEmoteCount() {
        return this.emotes.bttv.size + this.emotes.ffz.size + this.emotes.seventv.size;
    }

    replaceEmotes(text) {
        let replacedText = text;
        
        ['bttv', 'ffz', 'seventv'].forEach(service => {
            this.emotes[service].forEach((emoteData, emoteName) => {
                const regex = new RegExp(`\\b${this.escapeRegex(emoteName)}\\b`, 'g');
                replacedText = replacedText.replace(regex, `<img src="${emoteData.url}" alt="${emoteName}" class="emote-inline">`);
            });
        });
        
        return replacedText;
    }

    trackEmotes(message, twitchEmotes, credits) {
        const trackedEmotes = new Map();

        if (twitchEmotes && Object.keys(twitchEmotes).length > 0) {
            Object.entries(twitchEmotes).forEach(([emoteId, positions]) => {
                const emoteCount = positions.length;
                const emoteUrl = `https://static-cdn.jtvnw.net/emoticons/v2/${emoteId}/default/dark/3.0`;
                
                for (let i = 0; i < emoteCount; i++) {
                    credits.addEmoteUsage(emoteId, emoteUrl);
                }
                
                trackedEmotes.set(emoteId, { count: emoteCount, service: 'twitch' });
                console.log(`[emote] Tracked Twitch emote: ${emoteId} (used ${emoteCount} times)`);
            });
        }

        ['bttv', 'ffz', 'seventv'].forEach(service => {
            this.emotes[service].forEach((emoteData, emoteName) => {
                const regex = new RegExp(`\\b${this.escapeRegex(emoteName)}\\b`, 'g');
                const matches = message.match(regex);
                
                if (matches) {
                    const count = matches.length;
                    const emoteKey = `${service}_${emoteData.id}`;
                    
                    for (let i = 0; i < count; i++) {
                        credits.addEmoteUsage(emoteKey, emoteData.url);
                    }
                    
                    trackedEmotes.set(emoteKey, { count, service, name: emoteName });
                    console.log(`[emote] Tracked ${service.toUpperCase()} emote: ${emoteName} (used ${count} times)`);
                }
            });
        });

        return trackedEmotes;
    }

    getEmoteData(emoteKey) {
        if (!emoteKey.includes('_')) {
            return {
                url: `https://static-cdn.jtvnw.net/emoticons/v2/${emoteKey}/default/dark/3.0`,
                service: 'twitch'
            };
        }

        const [service, id] = emoteKey.split('_', 2);
        const emoteMap = this.emotes[service];
        
        if (emoteMap) {
            for (const [name, data] of emoteMap) {
                if (data.id === id) {
                    return { ...data, name };
                }
            }
        }

        return null;
    }

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

module.exports = new EmoteTracker();