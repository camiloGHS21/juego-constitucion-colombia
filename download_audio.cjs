const fs = require('fs');
const https = require('https');
const path = require('path');

const audioDir = path.join(__dirname, 'public', 'assets', 'audio');

if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
}

const files = {
    'success.mp3': 'https://labs.phaser.io/assets/audio/SoundEffects/magic.mp3',
    'error.mp3': 'https://labs.phaser.io/assets/audio/SoundEffects/explosion.mp3',
    'click.mp3': 'https://labs.phaser.io/assets/audio/SoundEffects/p-ping.mp3',
    'music.mp3': 'https://labs.phaser.io/assets/audio/Dancer.mp3'
};

Object.entries(files).forEach(([name, url]) => {
    const file = fs.createWriteStream(path.join(audioDir, name));
    https.get(url, (response) => {
        response.pipe(file);
        file.on('finish', () => {
            file.close();
            console.log(`Downloaded ${name}`);
        });
    }).on('error', (err) => {
        fs.unlink(path.join(audioDir, name));
        console.error(`Error downloading ${name}: ${err.message}`);
    });
});
