import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // Create a premium loading bar
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

        const loadingText = this.make.text({
            x: width / 2,
            y: height / 2 - 50,
            text: 'Cargando Alcaldía...',
            style: {
                font: '20px Outfit',
                fill: '#ffffff'
            }
        });
        loadingText.setOrigin(0.5, 0.5);

        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x3b82f6, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
        });

        this.load.on('filecomplete-audio', (key) => {
            console.log(`Audio successfully decoded: ${key}`);
        });

        this.load.on('loaderror', (file) => {
            console.warn(`Asset failed to load: ${file.key} at ${file.src}`);
        });

        this.load.on('complete', () => {
            loadingText.setText('Preparando Despacho...');
            
            // Give the browser a moment to decode audio
            this.time.delayedCall(800, () => {
                progressBar.destroy();
                progressBox.destroy();
                loadingText.destroy();
                this.scene.start('MenuScene');
            });
        });

        this.load.image('office_writing', 'assets/office_federico_writing.png');
        this.load.image('office_closed', 'assets/office_federico_closed.png');
        this.load.image('office_semi', 'assets/office_federico_semi.png');
        this.load.image('office_open', 'assets/office_federico_open.png');

        this.load.image('town', 'assets/town.png');
        this.load.image('contralor', 'assets/contralor.png');
        this.load.spritesheet('guide', 'assets/guide_sprite.png', { frameWidth: 256, frameHeight: 1024 });
        this.load.image('heart', 'assets/heart.png');

        // Intro Speech
        this.load.audio('intro_speech', 'assets/audio/federico_intro.mp3');


        // Load Audio Locally
        this.load.audio('success', 'assets/audio/success.mp3');
        this.load.audio('error', 'assets/audio/error.mp3');
        this.load.audio('click', 'assets/audio/click.mp3');
        this.load.audio('intro', 'assets/audio/intro.mp3');
    }
}
