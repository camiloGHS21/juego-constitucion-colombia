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
            258: "Artículo 258. El voto es un derecho y un deber ciudadano. En todas las elecciones los ciudadanos votarán secretamente en cubículos individuales instalados en cada mesa de votación, con tarjetas electorales numeradas e impresas en papel que ofrezca seguridad, las cuales serán distribuidas oficialmente.",
            259: "Artículo 259. Quienes elijan gobernadores y alcaldes, imponen por mandato al elegido el programa que presentó al inscribirse como candidato. La ley reglamentará el ejercicio del voto programático.",
            260: "Artículo 260. Los ciudadanos eligen en forma directa Presidente y Vicepresidente de la República, Senadores, Representantes, Gobernadores, Diputados, Alcaldes, Concejales municipales y distritales, miembros de las juntas administradoras locales.",
            261: "Artículo 261. Ningún cargo de elección popular en corporaciones públicas tendrá suplente. Las vacancias absolutas serán ocupadas por los candidatos no elegidos en la misma lista, en orden de inscripción, sucesivo y descendente.",
            262: "Artículo 262. La elección del Presidente y Vicepresidente no podrá coincidir con otra elección. La de Congreso se hará en fecha separada de la elección de autoridades departamentales y municipales.",
            263: "Artículo 263. Para asegurar la representación proporcional de los partidos, cuando se vote por dos o más individuos en elección popular o en una corporación pública, se empleará el sistema de cuociente electoral.",
            264: "Artículo 264. El Consejo Nacional Electoral se compondrá del número de miembros que determine la ley, que no debe ser menor de siete. Serán elegidos por el Consejo de Estado para un período de cuatro años, de ternas elaboradas por los partidos y movimientos políticos con personería jurídica.",
            265: "Artículo 265. El Consejo Nacional Electoral tendrá, de conformidad con la ley, las siguientes atribuciones: 1. Ejercer la suprema inspección y vigilancia de la organización electoral... 8. Reconocer la personería jurídica de los partidos y movimientos políticos.",
            266: "Artículo 266. El Registrador Nacional del Estado Civil será elegido por el Consejo Nacional Electoral para un período de cinco años... ejercerá las funciones que establezca la ley, incluida la dirección y organización de las elecciones.",

            // TÍTULO X - ORGANISMOS DE CONTROL
            267: "Artículo 267. El control fiscal es una función pública que ejercerá la Contraloría General de la República, la cual vigila la gestión fiscal de la administración y de los particulares o entidades que manejen fondos o bienes de la Nación.",
            268: "Artículo 268. Atribuciones del Contralor: 1. Prescribir los métodos y la forma de rendir cuentas los responsables del manejo de fondos o bienes de la Nación... 2. Revisar y fenecer las cuentas...",
            269: "Artículo 269. En las entidades públicas, las autoridades correspondientes están obligadas a diseñar y aplicar, según la naturaleza de sus funciones, métodos y procedimientos de control interno, de conformidad con lo que disponga la ley.",
            270: "Artículo 270. La ley organizará las formas y los sistemas de participación ciudadana que permitan vigilar la gestión pública que se cumpla en los diversos niveles administrativos y sus resultados.",
            272: "Artículo 272. La vigilancia de la gestión fiscal de los departamentos, distritos y municipios donde haya contralorías, corresponde a éstas y se ejercerá en forma posterior y selectiva.",
            275: "Artículo 275. El Procurador General de la Nación es el supremo director del Ministerio Público.",
            277: "Artículo 277. Funciones del Procurador: 1. Vigilar el cumplimiento de la Constitución, las leyes, las decisiones judiciales y los actos administrativos... 2. Proteger los derechos humanos...",
            281: "Artículo 281. El Defensor del Pueblo formará parte del Ministerio Público y ejercerá sus funciones bajo la suprema dirección del Procurador General de la Nación.",
            282: "Artículo 282. Funciones del Defensor: 1. Orientar e instruir a los habitantes... en el ejercicio y defensa de sus derechos... 3. Invocar el derecho de Habeas Corpus e interponer las acciones de tutela...",

            // TÍTULO XI - ORGANIZACIÓN TERRITORIAL
            285: "Artículo 285. Fuera de la división general del territorio, habrá las que determine la ley para el cumplimiento de las funciones y servicios a cargo del Estado.",
            286: "Artículo 286. Son entidades territoriales los departamentos, los distritos, los municipios y los territorios indígenas.",
            287: "Artículo 287. Las entidades territoriales gozan de autonomía para la gestión de sus intereses... tendrán los siguientes derechos: 1. Gobernarse por autoridades propias. 2. Ejercer las competencias que les correspondan.",
            288: "Artículo 288. La ley orgánica de ordenamiento territorial establecerá la distribución de competencias entre la Nación y las entidades territoriales.",
            300: "Artículo 300. Corresponde a las Asambleas Departamentales: 1. Reglamentar el ejercicio de las funciones y la prestación de los servicios a cargo del departamento... 3. Adoptar los planes y programas de desarrollo económico y social.",
            303: "Artículo 303. En cada uno de los departamentos habrá un gobernador que será jefe de la administración seccional y representante legal del Departamento; el gobernador será agente del Presidente de la República.",
            305: "Artículo 305. Atribuciones del gobernador: 1. Cumplir y hacer cumplir la Constitución, las leyes, los decretos del Gobierno y las ordenanzas... 2. Dirigir y coordinar la acción administrativa del departamento.",
            306: "Artículo 306. Dos o más departamentos podrán constituirse en regiones administrativas y de planificación, con personería jurídica, autonomía y patrimonio propio.",
            311: "Artículo 311. Al municipio como entidad fundamental de la división político-administrativa del Estado le corresponde prestar los servicios públicos que determine la ley, construir las obras que demande el progreso local.",
            312: "Artículo 312. En cada municipio habrá una corporación administrativa elegida popularmente para períodos de tres años que se denominará concejo municipal... Los concejales no tendrán la calidad de empleados públicos.",
            313: "Artículo 313. Corresponde a los concejos: 1. Reglamentar las funciones y la eficiente prestación de los servicios a cargo del municipio... 2. Adoptar los correspondientes planes y programas de desarrollo.",
            314: "Artículo 314. En cada municipio habrá un alcalde, jefe de la administración local y representante legal del municipio, que será elegido popularmente para períodos de tres años, no reelegible para el período siguiente.",
            315: "Artículo 315. Atribuciones del alcalde: 1. Cumplir y hacer cumplir la Constitución, la ley, los decretos del gobierno, las ordenanzas, y los acuerdos del concejo.",
            317: "Artículo 317. Sólo los municipios podrán gravar la propiedad inmueble. Lo anterior no obsta para que otras entidades impongan contribución de valorización.",
            318: "Artículo 318. Con el fin de mejorar la prestación de los servicios y asegurar la participación de la ciudadanía... los concejos podrán dividir sus municipios en comunas cuando se trate de áreas urbanas.",
            319: "Artículo 319. Cuando dos o más municipios tengan relaciones económicas, sociales y físicas, que den al conjunto características de un área metropolitana, podrán organizarse como entidad administrativa.",
            320: "Artículo 320. La ley podrá establecer categorías de municipios de acuerdo con su población, recursos fiscales, importancia económica y situación geográfica.",
            322: "Artículo 322. Santa Fe de Bogotá, capital de la República y del Departamento de Cundinamarca, se organiza como Distrito Capital."
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
