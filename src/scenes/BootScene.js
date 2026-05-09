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
            text: 'Cargando Gobierno...',
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

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            this.scene.start('MenuScene');
        });

        this.load.image('office_writing', '/assets/office_petro_writing.png');
        this.load.image('office_talking', '/assets/office_petro_talking.png');
        this.load.image('town', '/assets/town.png');
        this.load.image('contralor', '/assets/contralor.png');
        this.load.spritesheet('guide', '/assets/guide_sprite.png', { frameWidth: 256, frameHeight: 1024 });
        this.load.image('heart', '/assets/heart.png');


        // Load Audio Locally
        this.load.audio('success', '/assets/audio/success.mp3');
        this.load.audio('error', '/assets/audio/error.mp3');
        this.load.audio('click', '/assets/audio/click.mp3');
        this.load.audio('music', '/assets/audio/music.mp3');
    }
}
