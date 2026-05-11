import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        const { width, height } = this.cameras.main;

        const clickSound = this.cache.audio.exists('click') ? this.sound.add('click', { volume: 0.5 }) : null;

        // Play Intro Audio
        if (this.cache.audio.exists('intro')) {
            const introMusic = this.sound.add('intro', { volume: 0.2, loop: true });
            introMusic.play();

            this.events.on('shutdown', () => {
                introMusic.stop();
            });

            // Handle browser autoplay policy: resume audio context on first click
            this.input.once('pointerdown', () => {
                if (this.sound.context.state === 'suspended') {
                    this.sound.context.resume();
                }
                if (!introMusic.isPlaying) {
                    introMusic.play();
                }
            });
        }

        // ─── BACKGROUND ───
        const bg = this.add.image(width / 2, height / 2, 'town').setDisplaySize(width, height);
        bg.setAlpha(0.5);

        // Slow zoom animation on background
        this.tweens.add({
            targets: bg,
            scale: bg.scaleX * 1.08,
            duration: 20000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // ─── DARK GRADIENT OVERLAY ───
        const overlay = this.add.graphics();
        overlay.fillGradientStyle(0x0a0e27, 0x0a0e27, 0x0f172a, 0x0f172a, 0.85, 0.85, 0.6, 0.6);
        overlay.fillRect(0, 0, width, height);

        // ─── ANIMATED PARTICLES (floating dots) ───
        this.createFloatingParticles(width, height);

        // ─── DECORATIVE TOP ACCENT LINE ───
        const accentLine = this.add.graphics();
        accentLine.fillStyle(0x3b82f6, 1);
        accentLine.fillRect(width / 2 - 60, height / 2 - 210, 120, 3);
        accentLine.setAlpha(0);
        this.tweens.add({ targets: accentLine, alpha: 1, duration: 800, delay: 300 });

        // Glowing pulse on accent line
        this.tweens.add({
            targets: accentLine,
            alpha: 0.4,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            delay: 1200
        });

        // ─── SHIELD / EMBLEM ICON ───
        const shield = this.add.text(width / 2, height / 2 - 175, '🏛️', {
            font: '48px serif'
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: shield,
            alpha: 1,
            y: height / 2 - 180,
            duration: 600,
            delay: 200,
            ease: 'Back.easeOut'
        });

        // Gentle float
        this.tweens.add({
            targets: shield,
            y: height / 2 - 186,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            delay: 900
        });

        // ─── MAIN TITLE ───
        const title = this.add.text(width / 2, height / 2 - 110, 'SIMULADOR DE\nALCALDE', {
            font: 'bold 56px Outfit',
            fill: '#ffffff',
            align: 'center',
            lineSpacing: 6,
            stroke: '#1e3a8a',
            strokeThickness: 2
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: title,
            alpha: 1,
            y: title.y + 5,
            duration: 700,
            delay: 400,
            ease: 'Power2'
        });

        // ─── SUBTITLE ───
        const subtitle = this.add.text(width / 2, height / 2 - 38, 'MISIÓN: RISARALDA', {
            font: '600 22px Outfit',
            fill: '#60a5fa',
            letterSpacing: 8
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: subtitle,
            alpha: 1,
            duration: 600,
            delay: 700,
            ease: 'Power2'
        });

        // ─── DIVIDER ───
        const divider = this.add.graphics();
        divider.fillStyle(0x334155, 1);
        divider.fillRect(width / 2 - 80, height / 2 - 6, 160, 1);
        divider.setAlpha(0);
        this.tweens.add({ targets: divider, alpha: 0.6, duration: 500, delay: 900 });

        // ─── TAGLINE ───
        const tagline = this.add.text(width / 2, height / 2 + 12, 'Constitución Política de Colombia\nTítulos IX · X · XI', {
            font: '15px Outfit',
            fill: '#94a3b8',
            align: 'center',
            lineSpacing: 4
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: tagline,
            alpha: 1,
            duration: 600,
            delay: 1000
        });

        // ─── BUTTONS ───
        const btnY = height / 2 + 80;
        const btnW = 200;
        const btnH = 55;
        const gap = 20;

        // Start Button
        const startBtnBg = this.add.graphics();
        this.drawStartButton(startBtnBg, width / 2 - btnW - gap / 2, btnY, btnW, btnH, false);
        startBtnBg.setAlpha(0);

        const startBtn = this.add.text(width / 2 - btnW / 2 - gap / 2, btnY + btnH / 2, '▶  EMPEZAR', {
            font: 'bold 20px Outfit',
            fill: '#ffffff'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setAlpha(0);

        // Tour Button
        const tourBtnBg = this.add.graphics();
        this.drawTourButton(tourBtnBg, width / 2 + gap / 2, btnY, btnW, btnH, false);
        tourBtnBg.setAlpha(0);

        const tourBtn = this.add.text(width / 2 + btnW / 2 + gap / 2, btnY + btnH / 2, '📖  VER TOUR', {
            font: 'bold 20px Outfit',
            fill: '#60a5fa'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setAlpha(0);

        // Buttons entrance animation
        this.tweens.add({
            targets: [startBtnBg, startBtn],
            alpha: 1,
            y: '+=8',
            duration: 500,
            delay: 1200,
            ease: 'Back.easeOut'
        });

        this.tweens.add({
            targets: [tourBtnBg, tourBtn],
            alpha: 1,
            y: '+=8',
            duration: 500,
            delay: 1350,
            ease: 'Back.easeOut'
        });

        // ─── BUTTON INTERACTIONS ───
        startBtn.on('pointerover', () => {
            this.drawStartButton(startBtnBg, width / 2 - btnW - gap / 2, btnY, btnW, btnH, true);
            startBtn.setScale(1.05);
        });

        startBtn.on('pointerout', () => {
            this.drawStartButton(startBtnBg, width / 2 - btnW - gap / 2, btnY, btnW, btnH, false);
            startBtn.setScale(1);
        });

        tourBtn.on('pointerover', () => {
            this.drawTourButton(tourBtnBg, width / 2 + gap / 2, btnY, btnW, btnH, true);
            tourBtn.setScale(1.05);
            tourBtn.setColor('#ffffff');
        });

        tourBtn.on('pointerout', () => {
            this.drawTourButton(tourBtnBg, width / 2 + gap / 2, btnY, btnW, btnH, false);
            tourBtn.setScale(1);
            tourBtn.setColor('#60a5fa');
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
            this.cameras.main.fadeOut(400, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('TutorialScene');
            });
        });

        // ─── FOOTER ───
        const footer = this.add.text(width / 2, height - 30, 'Un juego educativo sobre gobernanza municipal', {
            font: '13px Outfit',
            fill: '#475569'
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: footer,
            alpha: 0.7,
            duration: 800,
            delay: 1600
        });

        // ─── FADE IN ───
        this.cameras.main.fadeIn(600, 10, 14, 39);
    }

    // ─── HELPER: Draw Start Button ───
    drawStartButton(gfx, x, y, w, h, hover) {
        gfx.clear();
        if (hover) {
            gfx.fillGradientStyle(0x2563eb, 0x1d4ed8, 0x1d4ed8, 0x1e40af, 1, 1, 1, 1);
        } else {
            gfx.fillGradientStyle(0x3b82f6, 0x2563eb, 0x2563eb, 0x1d4ed8, 1, 1, 1, 1);
        }
        gfx.fillRoundedRect(x, y, w, h, 12);

        // Subtle glow
        gfx.lineStyle(1, 0x60a5fa, hover ? 0.6 : 0.3);
        gfx.strokeRoundedRect(x, y, w, h, 12);
    }

    // ─── HELPER: Draw Tour Button ───
    drawTourButton(gfx, x, y, w, h, hover) {
        gfx.clear();
        if (hover) {
            gfx.fillStyle(0x1e3a5f, 0.5);
            gfx.fillRoundedRect(x, y, w, h, 12);
            gfx.lineStyle(2, 0x60a5fa, 1);
        } else {
            gfx.fillStyle(0x0f172a, 0.3);
            gfx.fillRoundedRect(x, y, w, h, 12);
            gfx.lineStyle(2, 0x3b82f6, 0.7);
        }
        gfx.strokeRoundedRect(x, y, w, h, 12);
    }

    // ─── HELPER: Floating Particles ───
    createFloatingParticles(width, height) {
        for (let i = 0; i < 25; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const size = Phaser.Math.FloatBetween(1, 3);
            const alpha = Phaser.Math.FloatBetween(0.05, 0.2);

            const dot = this.add.graphics();
            dot.fillStyle(0x3b82f6, 1);
            dot.fillCircle(0, 0, size);
            dot.setPosition(x, y);
            dot.setAlpha(0);

            // Fade in
            this.tweens.add({
                targets: dot,
                alpha: alpha,
                duration: Phaser.Math.Between(1000, 3000),
                delay: Phaser.Math.Between(0, 2000)
            });

            // Float upward
            this.tweens.add({
                targets: dot,
                y: y - Phaser.Math.Between(50, 150),
                x: x + Phaser.Math.Between(-30, 30),
                alpha: 0,
                duration: Phaser.Math.Between(6000, 12000),
                delay: Phaser.Math.Between(0, 4000),
                repeat: -1,
                onRepeat: () => {
                    dot.setPosition(
                        Phaser.Math.Between(0, width),
                        height + 20
                    );
                    dot.setAlpha(alpha);
                }
            });
        }
    }
}
