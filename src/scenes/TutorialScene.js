import Phaser from 'phaser';

export default class TutorialScene extends Phaser.Scene {
    constructor() {
        super('TutorialScene');
        this.currentStep = 0;
        this.isTyping = false;
        this.isMuted = false;
        this.steps = [
            {
                title: '¡BIENVENIDO, ALCALDE!',
                text: 'Soy tu asesora constitucional. Gobernar Risaralda no es solo hacer obras, es cumplir la ley. Para ganar, debes dominar los Títulos IX, X y XI de nuestra Constitución.',
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
        this.btnContainer.on('pointerdown', () => this.handleNext());
        this.btnContainer.on('pointerover', () => this.btnContainer.setScale(1.05));
        this.btnContainer.on('pointerout', () => this.btnContainer.setScale(1));

        this.skipBtn = this.add.text(250, height - 180, 'SALTAR TOUR', {
            font: '20px Outfit',
            fill: '#94a3b8'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.skipBtn.on('pointerdown', () => {
            window.speechSynthesis.cancel();
            this.scene.start('GameScene');
        });

        // Article Viewer (Overlay)
        this.articleOverlay = this.add.graphics();
        this.articleOverlay.setDepth(100);
        this.articleOverlay.setAlpha(0);
        this.articleTitle = this.add.text(width / 2, 150, '', { font: 'bold 32px Outfit', fill: '#60a5fa' }).setOrigin(0.5).setDepth(101).setAlpha(0);
        this.articleContent = this.add.text(width / 2, 220, '', { font: '20px Outfit', fill: '#ffffff', wordWrap: { width: width - 300 }, lineSpacing: 10 }).setOrigin(0.5, 0).setDepth(101).setAlpha(0);
        this.closeArtBtn = this.add.text(width / 2, height - 150, '[ CERRAR ]', { font: 'bold 24px Outfit', fill: '#94a3b8' }).setOrigin(0.5).setDepth(101).setAlpha(0).setInteractive({ useHandCursor: true });
        
        this.closeArtBtn.on('pointerdown', () => this.hideArticle());

        // Ver Artículo Button
        this.articleBtn = this.add.text(150, height - 180, '📖 VER ARTÍCULO', {
            font: 'bold 20px Outfit',
            fill: '#ffffff',
            backgroundColor: '#3b82f6',
            padding: { x: 12, y: 8 }
        }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true }).setDepth(30).setAlpha(0);

        this.articleBtn.on('pointerdown', () => {
            const step = this.steps[this.currentStep];
            if (step.article) this.showArticle(step.article);
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
        const articles = {
            // TÍTULO IX - ELECCIONES
            258: "El voto es un derecho y un deber ciudadano. El Estado garantizará que se ejerza de forma secreta en cubículos individuales, con tarjetas electorales numeradas y seguridad.",
            259: "VOTO PROGRAMÁTICO: Quienes elijan gobernadores y alcaldes, imponen por mandato al elegido el programa que presentó al inscribirse. La ley reglamentará su ejercicio.",
            260: "Los ciudadanos eligen directamente a Presidente, Senadores, Representantes, Gobernadores, Diputados, Alcaldes, Concejales y Ediles.",
            261: "Ningún cargo de elección popular tendrá suplente. Las vacancias serán ocupadas por los candidatos no elegidos en la misma lista en orden sucesivo.",
            262: "La elección de Presidente y Vicepresidente no coincidirá con otra. La de Congreso se hará en fecha separada de la de autoridades locales.",
            263: "Para asegurar la representación proporcional se empleará el sistema de cifra repartidora o cuociente electoral en elecciones de corporaciones públicas.",
            264: "El Consejo Nacional Electoral (CNE) se compondrá de miembros elegidos por el Congreso para un periodo de 4 años, reflejando la composición política.",
            265: "Funciones del CNE: Inspección y vigilancia electoral, elegir al Registrador, decidir recursos sobre escrutinios y velar por los derechos de la oposición.",
            266: "El Registrador Nacional organiza las elecciones, el registro civil y la identificación de las personas. Es elegido por las Altas Cortes para 4 años.",
            
            // TÍTULO X - ORGANISMOS DE CONTROL
            267: "El control fiscal vigila la gestión de fondos públicos. Es una función técnica y autónoma de la Contraloría. Se ejerce de forma posterior y selectiva.",
            268: "Atribuciones del Contralor: Prescribir métodos de cuentas, revisar el erario, exigir informes, imponer sanciones y presentar informes al Congreso.",
            269: "Las entidades públicas están obligadas a diseñar y aplicar métodos de control interno según la ley.",
            270: "La ley organizará sistemas de participación ciudadana para vigilar la gestión pública y sus resultados.",
            272: "Contralorías Territoriales: Los departamentos y municipios tienen sus propias contralorías para vigilar la gestión fiscal local con autonomía.",
            275: "El Procurador General es el supremo director del Ministerio Público.",
            277: "Funciones del Procurador: Vigilar el cumplimiento de la Constitución, proteger derechos humanos, defender intereses sociales y ejercer poder disciplinario.",
            281: "El Defensor del Pueblo forma parte del Ministerio Público y actúa bajo dirección del Procurador.",
            282: "Funciones del Defensor: Orientar a los habitantes en la defensa de sus derechos, divulgar derechos humanos e interponer acciones de tutela y populares.",
            
            // TÍTULO XI - ORGANIZACIÓN TERRITORIAL
            285: "La ley determinará las divisiones del territorio para el cumplimiento de funciones y servicios del Estado.",
            286: "Son entidades territoriales: Departamentos, distritos, municipios y territorios indígenas.",
            287: "AUTONOMÍA: Las entidades territoriales gozan de autonomía para gestionar sus intereses: gobernarse, ejercer competencias y administrar recursos.",
            288: "La ley orgánica de ordenamiento territorial distribuirá competencias entre Nación y territorios bajo principios de coordinación y concurrencia.",
            300: "Corresponde a las Asambleas Departamentales: Reglamentar servicios, adoptar planes de desarrollo, decretar tributos y autorizar al Gobernador.",
            303: "En cada departamento habrá un Gobernador, jefe de la administración seccional y agente del Presidente para el orden público.",
            305: "Atribuciones del Gobernador: Cumplir la Constitución, dirigir la acción administrativa departamental y nombrar gerentes de entidades descentralizadas.",
            306: "Regiones Administrativas: Departamentos pueden asociarse para el desarrollo económico y social del territorio.",
            311: "EL MUNICIPIO: Entidad fundamental que presta servicios públicos, construye obras locales, ordena el territorio y promueve la participación comunitaria.",
            312: "CONCEJO MUNICIPAL: Corporación administrativa elegida por el pueblo. Sus miembros no son empleados públicos pero pueden recibir honorarios.",
            313: "Funciones del Concejo: Adoptar planes de desarrollo, autorizar contratos al alcalde, reglamentar usos del suelo y votar tributos locales.",
            314: "EL ALCALDE: Jefe de la administración local y representante legal. Es elegido para 3 años y no es reelegible para el periodo siguiente.",
            315: "Atribuciones del Alcalde: Conservar el orden público, dirigir la administración, presentar proyectos de acuerdo y ordenar gastos municipales.",
            317: "Solo los municipios podrán gravar la propiedad inmueble (Impuesto Predial).",
            318: "Juntas Administradoras Locales (JAL): Dividen municipios en comunas o corregimientos para mejorar la participación y vigilancia local.",
            319: "ÁREAS METROPOLITANAS: Municipios con fuertes vínculos pueden organizarse para coordinar desarrollo, servicios públicos y obras comunes.",
            320: "La ley puede establecer categorías de municipios según población, recursos y situación geográfica para definir su régimen.",
            322: "BOGOTÁ D.C.: Tiene un régimen especial como Distrito Capital. Se divide en localidades con sus propias autoridades locales."
        };

        const { width, height } = this.cameras.main;
        this.articleTitle.setText(`CONSTITUCIÓN POLÍTICA`);
        this.articleContent.setText(articles[num] || 'Cargando contenido oficial...');
        
        this.articleOverlay.clear();
        this.articleOverlay.fillStyle(0x0f172a, 0.98);
        this.articleOverlay.fillRect(0, 0, width, height);
        this.articleOverlay.lineStyle(4, 0x3b82f6, 1);
        this.articleOverlay.strokeRect(50, 50, width - 100, height - 100);

        this.tweens.add({
            targets: [this.articleOverlay, this.articleTitle, this.articleContent, this.closeArtBtn],
            alpha: 1,
            duration: 300
        });
    }

    hideArticle() {
        this.tweens.add({
            targets: [this.articleOverlay, this.articleTitle, this.articleContent, this.closeArtBtn],
            alpha: 0,
            duration: 200
        });
    }

}
