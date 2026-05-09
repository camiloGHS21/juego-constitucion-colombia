const fs = require('fs');
const https = require('https');
const path = require('path');

const audioDir = path.join(__dirname, 'public', 'assets', 'audio');

// Verified direct raw MP3 links from GitHub
const files = {
    'success.mp3': 'https://raw.githubusercontent.com/SkyStoreOFL/skys_notifications/main/html/sounds/success.mp3',
    'error.mp3': 'https://raw.githubusercontent.com/SkyStoreOFL/skys_notifications/main/html/sounds/error.mp3',
    'click.mp3': 'https://raw.githubusercontent.com/SkyStoreOFL/skys_notifications/main/html/sounds/click.mp3',
    'music.mp3': 'https://raw.githubusercontent.com/phaserjs/examples/master/public/assets/audio/kyobi/kyobi.mp3'
};

const options = {
    headers: {
        'User-Agent': 'Mozilla/5.0'
    }
};

const download = (name, url) => {
    return new Promise((resolve, reject) => {
        const filePath = path.join(audioDir, name);
        const file = fs.createWriteStream(filePath);
        
        const request = (currentUrl) => {
            https.get(currentUrl, options, (response) => {
                if (response.statusCode === 301 || response.statusCode === 302) {
                    request(response.headers.location);
                    return;
                }
                
                if (response.statusCode !== 200) {
                    reject(new Error(`Failed to download ${name}: Status ${response.statusCode}`));
                    return;
                }
                
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    const size = fs.statSync(filePath).size;
                    console.log(`Downloaded ${name} (${size} bytes)`);
                    resolve(size);
                });
            }).on('error', (err) => {
                fs.unlink(filePath, () => {});
                reject(err);
            });
        };
        
        request(url);
    });
};

async function run() {
    for (const [name, url] of Object.entries(files)) {
        try {
            await download(name, url);
        } catch (e) {
            console.error(e.message);
        }
    }
}

run();
