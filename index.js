require('dotenv').config();
const fs = require('fs');
const Eris = require('eris');
const bot = new Eris(process.env.TOKEN);

const languageList = require('./discord-langs.json');
const demoTextPath = './node_modules/highlight.js/test/detect/';

bot.on('ready', () => {
    console.log('Ready to test', languageList.length, 'languages');
});

bot.on('messageCreate', async msg => {
    if(msg.content !== '`syntax_test`') return;
    let response = '';
    let count = 0;
    for(let lang of languageList) {
        count++;
        console.log('processing', lang, `(${count} of ${languageList.length})`);
        let demoText;
        try {
            demoText = fs.readFileSync(demoTextPath + lang + '/default.txt', 'utf8');
        } catch(e) {
            console.log(`Demo text for "${lang}" not found`)
        }
        if(demoText) {
            let addedText = '```' + lang + '\n' + demoText.substring(0, 1950) + '\n```';
            if(response.length + addedText.length > 1950) {
                await sendMessage(msg.channel, response);
                await sleep(1000);
                response = addedText;
            } else {
                response += '\n' + addedText;
            }
        }
    }
    await sendMessage(msg.channel, response);
});

function sendMessage(channel, msg) {
    return new Promise((resolve, reject) => {
        channel.createMessage(msg).then(res => {
            resolve(res);
        }).catch(e => {
            console.error('Error sending message', e);
            resolve(e);
        })
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

bot.on('error', console.log);

bot.connect();
