
var voters = new Map(); // Change to Map to store username and their votes
const channel = "flovrek"
const clientId = "mbahipc06tkpvsedf2ezlslh5fzd55"

var chatters = new Map()
var bannedCount = 0;

setup();


function setup() {
    console.log("Voting system initialized...");

    const client = new tmi.Client({
        options: { 
            debug: true,
            // clientId: clientId
         },
        // identity: {
        //     username: 'florekbot',
        //     password: `oauth:${token}`
        // },
        connection: { reconnect: true},
        channels: ["flovrek"]
    });

    client.connect().catch(console.error);

    client.on('ban', (channel, tags, message, self) => {
        bannedCount++;
    });

    // setInterval(() => {
    //     client.say("flourek1g", `sus`);
    // }, 2000);

    
    client.on('message', (channel, tags, message, self) => {
        if (self) return;
        if (tags.username.toLowerCase() == 'nightbot') return;

        console.log(tags)

        const username = tags['display-name'];
        
        if (!chatters.has(username)) {
            // If not, add it with the current time
            chatters.set(username, getCurrentTime());
        }

    });
    

    client.on('message', async (channel, tags, message, self) => {
        if(self || !message.startsWith('-')) return;
        if (tags.username.toLowerCase() == 'nightbot') return;
        if( !(tags.mod || tags.username == "flourek1g")) return;
        
        console.log(tags);

        const args = message.slice(1).split(' ');
        const command = args.shift().toLowerCase();

        if(command === 'hello') {
            client.say(channel, `@${tags.username}, heya!`);
        }
    });


        
    window.addEventListener('obsSceneChanged', function (event) {
        lol();
    })


}

function getCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
}

lol();


function lol (){
    // client.say("flourek1g", `scene chang!!!`);
    $("*").stop(true, true);
    
    let chattersIntro = Array.from(chatters).map(([username, time]) => `${time}:   ${username}`).join("<br>");

    $('#chatters #text').html(chattersIntro);
    $('#bannedCount').html(bannedCount);

    const count = chatters.size; // Count the number of usernames
    const height = $('#chatters').height();
    const time = 130000 + (count * 200);
    

    $('#chatters')
        .css({ top: `1080px`, display: 'block' }) // Start below the container
        .animate({ top: `-${height + 300}px` }, time, "linear"); 

    

}

