const clientId = "mbahipc06tkpvsedf2ezlslh5fzd55"
const token = "7dee508hwg57hvni6ebmg4zoqbj1sw"

const client = new tmi.Client({
	options: { debug: true },
    connection: {
        reconnect: true,
        secure: true
    },
    identity: {
        username: 'flovrek',
        password: `oauth:7dee508hwg57hvni6ebmg4zoqbj1sw`
    },
	channels: [ 'flovrek' ]
});

client.connect();
console.log('waga');

client.on('message', (channel, tags, message, self) => {
	// Ignore echoed messages.
	if(self) return;

	if(message.toLowerCase() === '!hello') {
		// "@alca, heya!"
		client.say(channel, `@${tags.username}, heya!`);
	}
});


async function helix(opts, method="GET") {
	const qs = new URLSearchParams(Object.entries(opts.qs).filter(([ k, v ]) => v !== undefined));
	const res = await fetch(`https://api.twitch.tv/helix/${opts.endpoint}?${qs}`, {
        method: method,
		headers: {
			'Client-Id': clientId,
			Authorization: `Bearer ${token}`
		}
	});
	return await res.json();
}


async function getUserId(username) {
    const res = await helix({
		endpoint: 'users/',
		qs: { login: username},
	});

    return res.data[0].id;

}


async function isLive(username) {

    const res = await helix({
		endpoint: 'streams/',
		qs: { user_id: await getUserId(username)},
	});

    if (res.data.length > 0) {
        console.log(`User ${username} is live!`);
        return true;
    } else {
        console.log(`User ${username} is offline.`);
        return false
    }

}

isLive("wuh6")
isLive("flovrek")



scrollAnimation ();

function scrollAnimation (){
    
    console.log("what")

    const height = $('#scrolling').height();
    const time = 130000 + (10 * 200);

    setTimeout(() => {
        $('#psplogo')
            .css({ display: 'block' }) // Ensure starting color is black
    }, 200);
    //2
    setTimeout(() => {
        $('#scrolling')
            .css({ top: `32%`, display: 'block' })
            // .animate({ top: `-${height + 300}px` }, { duration: time, queue: false, easing: "linear" });
        
        $('#logocontainer')
            .animate({ 'background-color': 'rgba(0,0,0,0)' }, { duration: 500, queue: false, easing: "linear" })

        $('#psplogo')
            .animate({ 'opacity': '0' }, { duration: 500, queue: false, easing: "linear" })
    }, 500);
    // 500

 
}


function creditBlock(left, right, title=null){
    let html = `<div class="line">`;
    if (title) {
        html += `<div class="header">${title}</div>`;
    }
    html += `<div class="line-content">
        <div class="left">${left}</div>
        <div class="right">${right}</div>
    </div>
    </div>`;
    return html;
}


function generateCredits(){

    var res = "" 
    + creditBlock("Will", "MATT DAMON", "In order of appearance")
    + creditBlock("Chuckie", "BEN AFFLECK")
    + creditBlock("Head Mod", "Ratatas1g", "Moderators")

    
    return res;
}


function setText(){

    result = generateCredits();

    $('#scrolling').html(result);
}

setText();
