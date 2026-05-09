import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        const { width, height } = this.cameras.main;

        const clickSound = this.cache.audio.exists('click') ? this.sound.add('click', { volume: 0.5 }) : null;

        // Background
        const bg = this.add.image(width / 2, height / 2, 'town');
        bg.setDisplaySize(width, height);
        bg.setAlpha(0.6);

        // Overlay
        const overlay = this.add.graphics();
        overlay.fillStyle(0x0f172a, 0.4);
        overlay.fillRect(0, 0, width, height);

        // Title
        const title = this.add.text(width / 2, height / 2 - 100, 'SIMULADOR DE ALCALDE', {
            font: 'bold 64px Outfit',
            fill: '#ffffff'
        }).setOrigin(0.5);

        const subtitle = this.add.text(width / 2, height / 2 - 30, 'Misión: Risaralda', {
            font: '32px Outfit',
            fill: '#94a3b8'
        }).setOrigin(0.5);

        // Start Button
        const btnBg = this.add.graphics();
        btnBg.fillStyle(0x3b82f6, 1);
        btnBg.fillRoundedRect(width / 2 - 220, height / 2 + 50, 200, 60, 10);

        const startBtn = this.add.text(width / 2 - 120, height / 2 + 80, 'EMPEZAR', {
            font: 'bold 24px Outfit',
            fill: '#ffffff'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Tour Button
        const tourBg = this.add.graphics();
        tourBg.lineStyle(2, 0x3b82f6, 1);
        tourBg.strokeRoundedRect(width / 2 + 20, height / 2 + 50, 200, 60, 10);

        const tourBtn = this.add.text(width / 2 + 120, height / 2 + 80, 'VER TOUR', {
            font: 'bold 24px Outfit',
            fill: '#3b82f6'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        startBtn.on('pointerover', () => {
            btnBg.clear();
            btnBg.fillStyle(0x2563eb, 1);
            btnBg.fillRoundedRect(width / 2 - 220, height / 2 + 50, 200, 60, 10);
            startBtn.setScale(1.1);
        });

        startBtn.on('pointerout', () => {
            btnBg.clear();
            btnBg.fillStyle(0x3b82f6, 1);
            btnBg.fillRoundedRect(width / 2 - 220, height / 2 + 50, 200, 60, 10);
            startBtn.setScale(1);
        });

        startBtn.on('pointerdown', () => {
            if (clickSound) clickSound.play();
            this.cameras.main.fadeOut(500, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('GameScene');
            });
        });

        tourBtn.on('pointerdown', () => {
            if (clickSound) clickSound.play();
            this.scene.start('TutorialScene');
        });
    }
}
