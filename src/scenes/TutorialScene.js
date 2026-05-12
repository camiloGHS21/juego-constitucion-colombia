import Phaser from 'phaser';
import ConstitutionalLexicon from '../components/ConstitutionalLexicon';

export default class TutorialScene extends Phaser.Scene {
    constructor() {
        super('TutorialScene');
        this.currentStep = 0;
        this.isTyping = false;
        this.isMuted = false;
        this.steps = [
            {
                title: '¡BIENVENIDO, ALCALDE!',
                text: 'Soy tu asesora constitucional. Liderar la Alcaldía de Risaralda no es solo hacer obras, es cumplir la ley. Para ganar, debes dominar los Títulos IX, X y XI de nuestra Constitución.',
                image: 'town'
            },
            {
                article: 311,
                title: 'TÍTULO XI: TERRITORIO',
                text: 'El municipio es la base del Estado (Art. 311). Como alcalde, diriges la administración y prestas servicios. ¡Tu autonomía está protegida por el Art. 287!',
                image: 'town'
            },
            {
                article: 313,
                title: 'TÍTULO XI: EL CONCEJO',
                text: 'El Concejo Municipal (Art. 313) es tu coequipero legislativo. Ellos reglamentan el suelo y aprueban tus proyectos. ¡Sin ellos no hay Plan de Desarrollo!',
                image: 'town'
            },
            {
                article: 267,
                title: 'TÍTULO X: CONTROL FISCAL',
                text: 'La Contraloría (Art. 267) vigila cada peso. El control fiscal es posterior y selectivo, pero implacable. ¡Rinde cuentas con transparencia!',
                image: 'office'
            },
            {
                article: 277,
                title: 'TÍTULO X: MINISTERIO PÚBLICO',
                text: 'La Procuraduría (Art. 277) vigila tu conducta oficial. La Defensoría (Art. 282) protege los derechos de los ciudadanos. ¡La ética es tu mejor escudo!',
                image: 'office'
            },
            {
                article: 258,
                title: 'TÍTULO IX: ELECCIONES',
                text: 'El voto es un derecho y un deber (Art. 258). Tu mandato se rige por el Voto Programático (Art. 259): debes cumplir el programa que prometiste.',
                image: 'town'
            },
            {
                title: 'REGLAS DE ORO',
                text: 'Tienes 4 años de mandato. Si tu Popularidad o Transparencia bajan del 40%, ¡perderás el cargo! El presupuesto es limitado, úsalo con integridad.',
                image: 'town'
            }
        ];
    }

    create() {
        const { width, height } = this.cameras.main;
        const clickSound = this.cache.audio.exists('click') ? this.sound.add('click', { volume: 0.5 }) : null;
        this.bg = this.add.image(width / 2, height / 2, 'town').setDisplaySize(width, height).setAlpha(0.2);

        // Guide character (now an animated sprite)
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



        this.contentBox = this.add.graphics();
        this.contentBox.fillStyle(0x0f172a, 0.9);
        this.contentBox.fillRoundedRect(100, 100, width - 400, height - 200, 20);
        this.contentBox.lineStyle(4, 0x3b82f6, 1);
        this.contentBox.strokeRoundedRect(100, 100, width - 400, height - 200, 20);

        this.titleText = this.add.text(150, 180, '', {
            font: 'bold 42px Outfit',
            fill: '#3b82f6'
        });

        this.descText = this.add.text(150, 280, '', {
            font: '24px Outfit',
            fill: '#ffffff',
            wordWrap: { width: width - 500 },
            lineSpacing: 12
        });

        // Speaker Icon / Mute Toggle
        this.muteBtn = this.add.text(width - 150, 130, '🔊 Voz: ON', {
            font: '18px Outfit',
            fill: '#ffffff'
        }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

        this.muteBtn.on('pointerdown', () => {
            this.isMuted = !this.isMuted;
            this.muteBtn.setText(this.isMuted ? '🔇 Voz: OFF' : '🔊 Voz: ON');
            if (this.isMuted) window.speechSynthesis.cancel();
        });

        // Buttons
        this.btnContainer = this.add.container(width / 2 - 100, height - 180);
        this.btnBg = this.add.graphics();
        this.btnBg.fillStyle(0x3b82f6, 1);
        this.btnBg.fillRoundedRect(-150, -30, 300, 60, 10);

        this.nextBtnText = this.add.text(0, 0, 'SIGUIENTE >', {
            font: 'bold 24px Outfit',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.btnContainer.add([this.btnBg, this.nextBtnText]);

        const hitArea = new Phaser.Geom.Rectangle(-150, -30, 300, 60);
        this.btnContainer.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
        this.btnContainer.on('pointerdown', () => {
            if (clickSound) clickSound.play();
            this.handleNext();
        });
        this.btnContainer.on('pointerover', () => this.btnContainer.setScale(1.05));
        this.btnContainer.on('pointerout', () => this.btnContainer.setScale(1));

        this.skipBtn = this.add.text(250, height - 180, 'SALTAR TOUR', {
            font: '20px Outfit',
            fill: '#94a3b8'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.skipBtn.on('pointerdown', () => {
            if (clickSound) clickSound.play();
            window.speechSynthesis.cancel();
            this.scene.start('GameScene');
        });



        // Ver Artículo Button
        this.articleBtn = this.add.text(150, height - 180, '📖 VER ARTÍCULO', {
            font: 'bold 20px Outfit',
            fill: '#ffffff',
            backgroundColor: '#3b82f6',
            padding: { x: 12, y: 8 }
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

        // Find a more human voice (Google voices are usually better)
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v =>
            v.lang.includes('es') && (v.name.includes('Google') || v.name.includes('Premium'))
        ) || voices.find(v => v.lang.includes('es'));

        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        utterance.lang = 'es-ES';
        utterance.rate = 0.9; // Slightly slower for better clarity
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    }

    updateStep() {
        const step = this.steps[this.currentStep];
        this.titleText.setText(step.title);
        this.bg.setTexture(step.image);

        // Show/Hide Article Button
        if (step.article) {
            this.articleBtn.setAlpha(1);
        } else {
            this.articleBtn.setAlpha(0);
        }

        if (this.currentStep === this.steps.length - 1) {
            this.nextBtnText.setText('¡EMPEZAR MANDATO!');
            this.btnBg.clear();
            this.btnBg.fillStyle(0x10b981, 1);
            this.btnBg.fillRoundedRect(-150, -30, 300, 60, 10);
        }

        this.speak(step.text);

        // Typing effect
        this.isTyping = true;
        this.descText.setText('');
        this.guide.play('guide_talk');

        let charIndex = 0;

        if (this.typeTimer) this.typeTimer.remove();

        this.typeTimer = this.time.addEvent({
            delay: 25,
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
