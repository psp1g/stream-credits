const { RefreshingAuthProvider } = require('@twurple/auth');
const { Bot, createBotCommand } = require('@twurple/easy-bot');
const fs = require('fs').promises;

const clientId = 'uo6dggojyb8d6soh92zknwmi5ej1q2';
const clientSecret = 'nyo51xcdrerl8z9m56w9w6wg';

(async () => {
    const tokenData = JSON.parse(await fs.readFile('./token.json', 'utf-8'));
    const authProvider = new RefreshingAuthProvider(
        {
            clientId,
            clientSecret
        }
    );

    authProvider.onRefresh(async (userId, newTokenData) => 
        await fs.writeFile(`./token.json`, JSON.stringify(newTokenData, null, 4), 'utf-8')
    );

    await authProvider.addUserForToken(tokenData, ['chat']);

    const bot = new Bot({
        authProvider,
        channels: ['satisfiedpear'],
        commands: [
            createBotCommand('dice', (params, { reply }) => {
                const diceRoll = Math.floor(Math.random() * 6) + 1;
                reply(`You rolled a ${diceRoll}`);
            }),
            createBotCommand('slap', (params, { userName, say }) => {
                say(`${userName} slaps ${params.join(' ')} around a bit with a large trout`);
            })
        ]
    });

    bot.onSub(({ broadcasterName, userName }) => {
        bot.say(broadcasterName, `Thanks to @${userName} for subscribing to the channel!`);
    });
    bot.onResub(({ broadcasterName, userName, months }) => {
        bot.say(broadcasterName, `Thanks to @${userName} for subscribing to the channel for a total of ${months} months!`);
    });
    bot.onSubGift(({ broadcasterName, gifterName, userName }) => {
        bot.say(broadcasterName, `Thanks to @${gifterName} for gifting a subscription to @${userName}!`);
    });
})();