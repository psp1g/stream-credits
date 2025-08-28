const credits = require('../data/credits');
const {logSubscriptions} = require('../listeners/tes');
require('dotenv').config();

const COMMAND_PREFIX = process.env.COMMAND_PREFIX || '-';
const AUTHORIZED_USER = (process.env.AUTHORIZED_USER || 'flovrek').toLowerCase(); // TMI usernames are lowercase

function setupTMICommands(client) {
    client.on('message', (channel, tags, message, self) => {
        // Ignore messages from the bot itself

        if (self) return;
        
        // Check if message starts with command prefix
        if (!message.startsWith(COMMAND_PREFIX)) return;
        

        // Check if user is authorized
        const username = tags.username.toLowerCase();
        if (username !== AUTHORIZED_USER) {
            console.log(`[commands] Unauthorized command attempt from ${username}: ${message}`);
            return;
        }
        
        
        // Parse command and arguments
        const args = message.slice(COMMAND_PREFIX.length).trim().split(' ');
        const command = args[0].toLowerCase();
        const commandArgs = args.slice(1);
        
        console.log(`[commands] Executing command: ${command} with args:`, commandArgs);
        
        // Handle commands
        switch (command) {
            case 'addtitle':
                handleAddTitle(commandArgs, channel, client);
                break;
           
            case 'addguest':
               handleAddGuest(commandArgs, channel, client);
                break;
                
            case 'webhook':
                logSubscriptions();
                break;
           
            case 'forceonline':
                credits.startNewStream();
                break;
           
            case 'forceoffline':
                credits.endStream();
                break;
                
            case 'addcategory':
                handleAddCategory(commandArgs, channel, client);
                break;
                
            case 'addguest':
                handleAddGuest(commandArgs, channel, client);
                break;
                
            case 'help':
                handleHelp(commandArgs, channel, client);
                break;
                
            default:
                // client.say(channel, `Unknown command: ${command}. Use -help for available commands.`);
                break;
        }
    });
}

function handleAddGuest(args, channel, client) {
    if (args.length === 0) {
        // client.say(channel, 'Usage: -addguest <guest name>');
        return;
    }
    
    const guestName = args.join(' ');
    if (credits.appendUnique('stream.specialGuests', guestName)) {
        // client.say(channel, `✅ Added special guest: "${guestName}"`);
        console.log(`[commands] Added special guest: ${guestName}`);
    } else {
        // client.say(channel, `⚠️ Guest "${guestName}" is already in the list`);
        console.log(`[commands] Guest "${guestName}" already exists`);
    }
}

function handleAddTitle(args, channel, client) {
    if (args.length === 0) {
        // client.say(channel, 'Usage: -addtitle <title text>');
        return;
    }
    
    const title = args.join(' ');
    credits.append('stream.titleHistory', title);
    // client.say(channel, `✅ Added title: "${title}"`);
    console.log(`[commands] Added title: ${title}`);
}

function handleAddCategory(args, channel, client) {
    if (args.length === 0) {
        // client.say(channel, 'Usage: -addcategory <category name>');
        return;
    }
    
    const category = args.join(' ');
    credits.append('stream.categoryHistory', category);
    // client.say(channel, `✅ Added category: "${category}"`);
    console.log(`[commands] Added category: ${category}`);
}

function handleAddGuest(args, channel, client) {
    if (args.length === 0) {
        // client.say(channel, 'Usage: -addguest <guest name>');
        return;
    }
    
    const guestName = args.join(' ');
    if (credits.appendUnique('stream.specialGuests', guestName)) {
        // client.say(channel, `✅ Added special guest: "${guestName}"`);
        console.log(`[commands] Added special guest: ${guestName}`);
    } else {
        // client.say(channel, `⚠️ Guest "${guestName}" is already in the list`);
    }
}

function handleHelp(args, channel, client) {
    const commands = [
        '-addtitle <text> - Add a title to stream history',
        '-addcategory <text> - Add a category to stream history',
        '-addguest <name> - Add a special guest',
        '-help - Show this help message'
    ];
    const category = args.join(' ');
    console.log(category)
    // client.say(channel, `Available commands: ${commands.join(' | ')}`);
}

module.exports = { setupTMICommands };