import Phaser from 'phaser';
import ConstitutionalLexicon from '../components/ConstitutionalLexicon';
import { ARTICLES } from '../data/Articles';

/**
 * Generates a short pedagogical summary for each article,
 * suitable for the guide character to explain to the player.
 */
function buildArticleSteps() {
    const sections = [
        {
            title: 'TÍTULO IX: ELECCIONES Y ORGANIZACIÓN ELECTORAL',
            range: [258, 266],
            image: 'town'
        },
        {
            title: 'TÍTULO X: ORGANISMOS DE CONTROL',
            range: [267, 284],
            image: 'office'
        },
        {
            title: 'TÍTULO XI: ORGANIZACIÓN TERRITORIAL',
            range: [285, 331],
            image: 'town'
        }
    ];

    const steps = [];

    for (const section of sections) {
        const [start, end] = section.range;
        for (let num = start; num <= end; num++) {
            if (!ARTICLES[num]) continue;

            // Take the first meaningful sentence(s) from the article text as summary
            const fullText = ARTICLES[num];
            // Remove the leading "Artículo NNN. " prefix for the summary
            const bodyText = fullText.replace(/^Artículo\s+\d+\.\s*/, '');
            // Grab up to ~220 chars at the nearest sentence boundary
            let summary = bodyText;
            if (summary.length > 220) {
                const cut = summary.lastIndexOf('.', 220);
                summary = cut > 60 ? summary.substring(0, cut + 1) : summary.substring(0, 220) + '…';
            }

            steps.push({
                article: num,
                title: `${section.title}`,
                subtitle: `Artículo ${num}`,
                text: summary,
                image: section.image
            });
        }
    }

    return steps;
}

export default class TutorialScene extends Phaser.Scene {
    constructor() {
        super('TutorialScene');
        this.currentStep = 0;
        this.isTyping = false;
        this.isMuted = false;

        // Build the full list: welcome + all articles + rules
        const articleSteps = buildArticleSteps();
        this.steps = [
            {
                title: '¡BIENVENIDO, ALCALDE!',
                subtitle: 'Guía Constitucional',
                text: 'Soy tu asesora constitucional. Liderar la Alcaldía no es solo hacer obras, es cumplir la ley. Para ganar, debes dominar los Títulos IX, X y XI de nuestra Constitución. Te explicaré cada artículo uno por uno.',
                image: 'town'
            },
            ...articleSteps,
            {
                title: 'REGLAS DE ORO',
                subtitle: '¡A gobernar!',
                text: 'Tienes 4 años de mandato. Si tu Popularidad o Transparencia bajan del 40%, ¡perderás el cargo! El presupuesto es limitado, úsalo con integridad. ¡Buena suerte, Alcalde!',
                image: 'town'
            }
        ];
    }

    create() {
        const { width, height } = this.cameras.main;
        const clickSound = this.cache.audio.exists('click') ? this.sound.add('click', { volume: 0.5 }) : null;
        this.bg = this.add.image(width / 2, height / 2, 'town').setDisplaySize(width, height).setAlpha(0.2);

        // Guide character (animated sprite)
        this.guide = this.add.sprite(width - 220, height - 280, 'guide').setScale(0.75).setOrigin(0.5);

        this.anims.create({
            key: 'guide_talk',
            frames: this.anims.generateFrameNumbers('guide', { start: 1, end: 3 }),
            frameRate: 8,
            repeat: -1,
            yoyo: true
        });

        this.anims.create({
            key: 'guide_idle',
            frames: [{ key: 'guide', frame: 0 }],
            frameRate: 1
        });

        this.guide.play('guide_idle');

        this.tweens.add({
            targets: this.guide,
            y: height - 300,
            duration: 2500,
            yoyo: true,
            repeat: -1,
            ease: 'Power1.easeInOut'
        });

        // ─── Content box ───
        this.contentBox = this.add.graphics();
        this.contentBox.fillStyle(0x0f172a, 0.9);
        this.contentBox.fillRoundedRect(100, 80, width - 400, height - 200, 20);
        this.contentBox.lineStyle(4, 0x3b82f6, 1);
        this.contentBox.strokeRoundedRect(100, 80, width - 400, height - 200, 20);

        // ─── Section Title (e.g. TÍTULO IX) ───
        this.titleText = this.add.text(150, 110, '', {
            font: 'bold 28px Outfit',
            fill: '#3b82f6'
        });

        // ─── Article Subtitle (e.g. Artículo 258) ───
        this.subtitleText = this.add.text(150, 150, '', {
            font: 'bold 22px Outfit',
            fill: '#fbbf24'
        });

        // ─── Body text ───
        this.descText = this.add.text(150, 200, '', {
            font: '22px Outfit',
            fill: '#ffffff',
            wordWrap: { width: width - 520 },
            lineSpacing: 10
        });

        // ─── Progress Bar ───
        this.progressBarBg = this.add.graphics();
        this.progressBarBg.fillStyle(0x334155, 1);
        this.progressBarBg.fillRoundedRect(100, height - 115, width - 400, 14, 7);

        this.progressBarFill = this.add.graphics();

        this.progressText = this.add.text(width / 2 - 100, height - 105, '', {
            font: '16px Outfit',
            fill: '#94a3b8'
        }).setOrigin(0.5, 0);

        // ─── Speaker / Mute Toggle ───
        this.muteBtn = this.add.text(width - 150, 100, '🔊 Voz: ON', {
            font: '18px Outfit',
            fill: '#ffffff'
        }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

        this.muteBtn.on('pointerdown', () => {
            this.isMuted = !this.isMuted;
            this.muteBtn.setText(this.isMuted ? '🔇 Voz: OFF' : '🔊 Voz: ON');
            if (this.isMuted) window.speechSynthesis.cancel();
        });

        // ─── Previous Button ───
        this.prevBtnContainer = this.add.container(width / 2 - 120, height - 155);
        const prevBg = this.add.graphics();
        prevBg.fillStyle(0x475569, 1);
        prevBg.fillRoundedRect(-70, -22, 140, 44, 10);
        const prevText = this.add.text(0, 0, '< ANTERIOR', {
            font: 'bold 18px Outfit',
            fill: '#ffffff'
        }).setOrigin(0.5);
        this.prevBtnContainer.add([prevBg, prevText]);
        const prevHit = new Phaser.Geom.Rectangle(-70, -22, 140, 44);
        this.prevBtnContainer.setInteractive(prevHit, Phaser.Geom.Rectangle.Contains);
        this.prevBtnContainer.on('pointerdown', () => {
            if (this.currentStep > 0) {
                if (clickSound) clickSound.play();
                this.currentStep--;
                this.updateStep();
            }
        });
        this.prevBtnContainer.on('pointerover', () => this.prevBtnContainer.setScale(1.05));
        this.prevBtnContainer.on('pointerout', () => this.prevBtnContainer.setScale(1));

        // ─── Next Button ───
        this.btnContainer = this.add.container(width / 2 + 60, height - 155);
        this.btnBg = this.add.graphics();
        this.btnBg.fillStyle(0x3b82f6, 1);
        this.btnBg.fillRoundedRect(-80, -22, 160, 44, 10);

        this.nextBtnText = this.add.text(0, 0, 'SIGUIENTE >', {
            font: 'bold 18px Outfit',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.btnContainer.add([this.btnBg, this.nextBtnText]);

        const hitArea = new Phaser.Geom.Rectangle(-80, -22, 160, 44);
        this.btnContainer.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
        this.btnContainer.on('pointerdown', () => {
            if (clickSound) clickSound.play();
            this.handleNext();
        });
        this.btnContainer.on('pointerover', () => this.btnContainer.setScale(1.05));
        this.btnContainer.on('pointerout', () => this.btnContainer.setScale(1));

        // ─── Skip Button ───
        this.skipBtn = this.add.text(width - 320, height - 155, 'SALTAR TOUR', {
            font: '18px Outfit',
            fill: '#94a3b8'
        }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

        this.skipBtn.on('pointerdown', () => {
            if (clickSound) clickSound.play();
            window.speechSynthesis.cancel();
            this.scene.start('GameScene');
        });

        // ─── Ver Artículo Button ───
        this.articleBtn = this.add.text(120, height - 155, '📖 VER ARTÍCULO COMPLETO', {
            font: 'bold 18px Outfit',
            fill: '#ffffff',
            backgroundColor: '#1e40af',
            padding: { x: 10, y: 6 }
        }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true }).setDepth(30).setAlpha(0);

        this.articleBtn.on('pointerdown', () => {
            const step = this.steps[this.currentStep];
            if (step.article) {
                if (!this.lexicon) this.lexicon = new ConstitutionalLexicon(this);
                this.lexicon.show(step.article);
            }
        });

        this.updateStep();
    }

    handleNext() {
        if (this.currentStep === this.steps.length - 1) {
            window.speechSynthesis.cancel();
            this.safePlay('click');
            this.scene.start('GameScene');
            return;
        }

        if (this.isTyping) {
            this.showFullText();
            return;
        }

        this.safePlay('click');
        this.currentStep++;
        this.updateStep();
    }

    safePlay(key) {
        if (this.cache.audio.exists(key)) {
            this.sound.play(key);
        }
    }

    showFullText() {
        if (this.typeTimer) this.typeTimer.remove();
        this.descText.setText(this.steps[this.currentStep].text);
        this.isTyping = false;
        this.guide.play('guide_idle');
    }

    speak(text) {
        if (this.isMuted) return;
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v =>
            v.lang.includes('es') && (v.name.includes('Google') || v.name.includes('Premium'))
        ) || voices.find(v => v.lang.includes('es'));

        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        utterance.lang = 'es-ES';
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    }

    updateStep() {
        const step = this.steps[this.currentStep];
        const { width, height } = this.cameras.main;

        this.titleText.setText(step.title);
        this.subtitleText.setText(step.subtitle || '');
        this.bg.setTexture(step.image);

        // Show/Hide Article Button
        if (step.article) {
            this.articleBtn.setAlpha(1);
        } else {
            this.articleBtn.setAlpha(0);
        }

        // Show/Hide previous button
        this.prevBtnContainer.setAlpha(this.currentStep > 0 ? 1 : 0.3);

        // Update progress bar
        const progress = (this.currentStep) / (this.steps.length - 1);
        const barWidth = width - 400;
        this.progressBarFill.clear();
        this.progressBarFill.fillStyle(0x3b82f6, 1);
        this.progressBarFill.fillRoundedRect(100, height - 115, Math.max(14, barWidth * progress), 14, 7);
        this.progressText.setText(`${this.currentStep + 1} / ${this.steps.length}`);

        // Update button text on last step
        if (this.currentStep === this.steps.length - 1) {
            this.nextBtnText.setText('¡EMPEZAR!');
            this.btnBg.clear();
            this.btnBg.fillStyle(0x10b981, 1);
            this.btnBg.fillRoundedRect(-80, -22, 160, 44, 10);
        } else {
            this.nextBtnText.setText('SIGUIENTE >');
            this.btnBg.clear();
            this.btnBg.fillStyle(0x3b82f6, 1);
            this.btnBg.fillRoundedRect(-80, -22, 160, 44, 10);
        }

        this.speak(step.text);

        // Typing effect
        this.isTyping = true;
        this.descText.setText('');
        this.guide.play('guide_talk');

        let charIndex = 0;

        if (this.typeTimer) this.typeTimer.remove();

        this.typeTimer = this.time.addEvent({
            delay: 20,
            repeat: step.text.length - 1,
            callback: () => {
                this.descText.setText(step.text.substr(0, charIndex + 1));
                charIndex++;
                if (charIndex === step.text.length) {
                    this.isTyping = false;
                    this.guide.play('guide_idle');
                }
            }
        });
    }

    showArticle(num) {
        if (!this.lexicon) this.lexicon = new ConstitutionalLexicon(this);
        this.lexicon.show(num);
    }

    hideArticle() {
        if (this.lexicon) this.lexicon.hide();
    }
}
