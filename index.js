require('dotenv').config();
const fs = require('fs');
const Eris = require('eris');
const bot = new Eris(process.env.TOKEN);

const languageList = require('./discord-langs.json');
const demoTextPath = './node_modules/highlight.js/test/detect/';
const languages = new Map();
const aliases = new Map([['js', 'javascript']]);

console.log('Processing languages...');
let count = 0;
for(let lang of languageList) {
    count++;
    // console.log('processing', lang, `(${count} of ${languageList.length})`);
    let demoText;
    try {
        demoText = fs.readFileSync(demoTextPath + lang + '/default.txt', 'utf8');
    } catch(e) {
        if(!aliases.has(lang)) console.log(`Demo text for "${lang}" not found`)
    }
    if(demoText) {
        languages.set(lang, demoText)
    }
}

bot.on('ready', () => {
    console.log('Ready to test', languages.size, 'languages');
});

let running = false;

bot.on('messageCreate', async msg => {
    if(running && msg.content === '!syntax_stop') {
        running = false;
        return sendMessage(msg.channel, `Language testing aborted`);
    }
    if(msg.content === '!syntax_list') {
        let list = '```\n' + Array.from(languages.keys()).join(' ') + '```';
        return sendMessage(msg.channel, `Listing \`${languages.size}\` languages:\n${list}`);
    }
    if(running) return;
    let match = msg.content && msg.content.match(/!syntax_test ?(.+)?/);
    if(match) {
        if(match[1]) {
            let targetLang = aliases.get(match[1]) ||  match[1];
            if(languages.has(targetLang)) {
                return sendMessage(msg.channel, makeCodeBlock(targetLang));
            } else {
                return sendMessage(msg.channel, `Invalid language \`${match[1]}\``)
            }
        } else {
            await sendMessage(msg.channel, `Beginning output test of \`${languages.size}\` languages`);
            await sleep(2000);
        }
    } else {
        return;
    }
    running = true;
    let response = '';
    for(let [name] of languages) {
        if(!running) return;
        let addedText = makeCodeBlock(name);
        if(response.length + addedText.length > 1950) {
            await sendMessage(msg.channel, response);
            await sleep(1000);
            response = addedText;
        } else {
            response += '\n' + addedText;
        }
    }
    await sendMessage(msg.channel, response);
    await sendMessage(msg.channel, `Test complete`);
    running = false;
});

function makeCodeBlock(lang) {
    let demoText = languages.get(lang).substring(0, 1000);
    return `\`${lang}\`\n\`\`\`${lang}\n${demoText}\`\`\``
}

function sendMessage(channel, msg) { // Allows ignoring errors while using await
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
