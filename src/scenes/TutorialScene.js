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
            // ==========================================
            // TÍTULO IX: DE LAS ELECCIONES Y DE LA ORGANIZACIÓN ELECTORAL
            // ==========================================

            258: "Artículo 258. El voto es un derecho y un deber ciudadano. El Estado velará porque se ejerza sin coacciones y de forma secreta por los ciudadanos en cubículos individuales instalados en cada mesa de votación, sin perjuicio del uso de medios electrónicos o informáticos. En las elecciones de candidatos podrán emplearse tarjetas electorales numeradas e impresas en papel que ofrezca seguridad, las cuales serán entregadas a los electores en el mismo puesto de votación para que en ellas marquen el candidato o la lista de su preferencia. La organización electoral suministrará igualitariamente a los votantes instrumentos en los cuales aparezcan identificados con claridad y en iguales condiciones los movimientos y partidos políticos con personería jurídica y los candidatos. La ley podrá implantar mecanismos de votación que otorguen más y mejores garantías para el libre ejercicio del sentido del voto de los ciudadanos. PARÁGRAFO 1o. Deberá repetirse por una sola vez la votación para elegir miembros de una Corporación Pública, Gobernador, Alcalde o la primera vuelta en las elecciones presidenciales, cuando los votos en blanco constituyan mayoría absoluta en relación con los votos válidos. Tratándose de elecciones unipersonales no podrán presentarse los mismos candidatos, mientras que en las de Corporaciones Públicas no se podrán presentar las listas que no hayan alcanzado el umbral. PARÁGRAFO 2o. Se podrá limitar el derecho al voto a los ciudadanos que no hayan cumplido con el servicio militar obligatorio o que se encuentren en mora en el pago de multas judiciales o de policía.",

            259: "Artículo 259. Quienes elijan gobernadores y alcaldes imponen por mandato al elegido el programa que haya presentado al inscribirse como candidato. La ley reglamentará el ejercicio del voto programático.",

            260: "Artículo 260. Los ciudadanos eligen en forma directa Presidente y Vicepresidente de la República, Senadores, Representantes, Gobernadores, Diputados, Alcaldes, Concejales municipales y distritales, miembros de las juntas administradoras locales, y en su oportunidad, los miembros de la Asamblea Constituyente y las demás autoridades que la Constitución determine.",

            261: "Artículo 261. Las faltas absolutas o temporales de los miembros de las corporaciones públicas serán suplidas por los candidatos que, según el orden de inscripción o votación obtenida, sigan en las correspondientes listas. Son faltas absolutas: la muerte; la renuncia aceptada; la pérdida de la investidura; la incapacidad física permanente y la sentencia judicial en firme dictada por autoridad competente. No habrá faltas temporales, excepto las que determine la ley por razones de enfermedad, de licencia de maternidad y de privación de la libertad.",

            262: "Artículo 262. Los partidos y movimientos políticos con personería jurídica que sumados hayan obtenido una votación de hasta el quince por ciento (15%) de los votos válidos de la respectiva circunscripción, podrán presentar listas candidatas en coalición para corporaciones públicas. Para elecciones de cargos unipersonales, los partidos y movimientos políticos con personería jurídica podrán presentar candidatos en coalición. La ley reglamentará la materia.",

            263: "Artículo 263. Para todos los procesos de elección popular, los partidos y movimientos políticos con personería jurídica presentarán listas únicas y, para la asignación de curules, se utilizará el sistema de cifra repartidora. El sistema de cifra repartidora resulta de dividir sucesivamente por uno, dos, tres o más el número de votos por cada lista, y de ordenar los cocientes obtenidos de mayor a menor hasta completar el número de curules a proveer. Cada lista obtendrá tantas curules como veces esté su votación en el umbral, el cual será el cincuenta por ciento (50%) del cociente electoral para las corporaciones con menos de diez (10) curules y el cien por ciento (100%) para las demás. En ningún caso el umbral será inferior al tres por ciento (3%) de los votos válidos.",

            264: "Artículo 264. El Consejo Nacional Electoral se compondrá de nueve (9) miembros elegidos por el Congreso de la República en pleno, para un período institucional de cuatro (4) años, mediante el sistema de cifra repartidora, previa postulación de los partidos o movimientos políticos con personería jurídica o por coaliciones entre ellos. Sus miembros serán servidores públicos de dedicación exclusiva, tendrán las mismas calidades, inhabilidades, incompatibilidades y derechos de los magistrados de la Corte Suprema de Justicia y no podrán ser reelegidos.",

            265: "Artículo 265. El Consejo Nacional Electoral tendrá, de conformidad con la ley, las siguientes atribuciones especiales: 1. Ejercer la suprema inspección, vigilancia y control de la organización electoral. 2. Dar posesión de su cargo al Registrador Nacional del Estado Civil. 3. Conocer y decidir definitivamente los recursos que se interpongan contra las decisiones de sus delegados sobre escrutinios generales y en tales casos hacer la declaratoria de elección y expedir las credenciales correspondientes. 4. Servir de cuerpo consultivo del Gobierno en materias de su competencia, presentar proyectos de acto legislativo y de ley, y recomendar proyectos de decreto. 5. Velar por el cumplimiento de las normas sobre partidos y movimientos políticos y de las disposiciones sobre publicidad y encuestas de opinión política; por los derechos de la oposición y de las minorías, y por el desarrollo de los procesos electorales en condiciones de plenas garantías. 6. Distribuir los aportes que para el financiamiento de las campañas electorales y para asegurar el derecho de participación política de los ciudadanos, establezca la ley. 7. Efectuar el escrutinio general de toda votación nacional, hacer la declaratoria de elección y expedir las credenciales a que haya lugar. 8. Reconocer y revocar la personería jurídica de los partidos y movimientos políticos. 9. Reglamentar la participación de los partidos y movimientos políticos en los medios de comunicación social del Estado. 10. Colaborar para la realización de consultas de los partidos y movimientos para la escogencia de sus candidatos. 11. Decidir la revocatoria de la inscripción de candidatos a corporaciones públicas o cargos uninominales de la administración cuando exista plena prueba de que están incursos en causal de inhabilidad prevista en la Constitución y la ley. 12. Las demás que le confiera la ley.",

            266: "Artículo 266. El Registrador Nacional del Estado Civil será escogido por los Presidentes de la Corte Constitucional, la Corte Suprema de Justicia y el Consejo de Estado, mediante concurso de méritos organizado por la ley. Su período será de cuatro (4) años, deberá reunir las mismas calidades que exige la Constitución para ser Magistrado de la Corte Suprema de Justicia y no haber ejercido funciones en cargos directivos en partidos o movimientos políticos dentro del año inmediatamente anterior a su elección. Podrá ser reelegido por una sola vez. El Registrador Nacional ejercerá las funciones que establezca la ley, incluida la dirección y organización de las elecciones, el registro civil y la identificación de las personas, así como la de celebrar contratos en nombre de la Nación, en los casos que aquella disponga.",

            // ==========================================
            // TÍTULO X: DE LOS ORGANISMOS DE CONTROL
            // ==========================================

            267: "Artículo 267. La vigilancia y el control fiscal son una función pública que ejercerá la Contraloría General de la República, la cual vigila la gestión fiscal de la administración y de los particulares o entidades que manejen fondos o bienes de la Nación, en todos los niveles administrativos y respecto de todo tipo de recursos públicos. La ley reglamentará el ejercicio de las competencias entre niveles de control. El control fiscal se ejercerá en forma posterior y selectiva, y además podrá ser preventivo y concomitante, según lo establezca la ley. La vigilancia de la gestión fiscal del Estado incluye el ejercicio de un control financiero, de gestión y de resultados, fundado en la eficiencia, la economía, la equidad, el desarrollo sostenible y la valoración de los costos ambientales. La Contraloría General de la República es una entidad de carácter técnico con autonomía administrativa y presupuestal. No tendrá funciones administrativas distintas de las inherentes a su propia organización y al cumplimiento de su misión constitucional.",

            268: "Artículo 268. El Contralor General de la República tendrá las siguientes atribuciones: 1. Prescribir los métodos y la forma de rendir cuentas los responsables del manejo de fondos o bienes de la Nación e indicar los criterios de evaluación financiera, operativa y de resultados que deberán seguirse. 2. Revisar y fenecer las cuentas que deben llevar los responsables del erario y determinar el grado de eficiencia, eficacia y economía con que hayan obrado. 3. Exigir informes sobre su gestión fiscal a los empleados públicos de cualquier orden y a toda persona o entidad pública o privada que administre fondos o bienes de la Nación. 4. Definir la responsabilidad que se derive de la gestión fiscal, imponer las sanciones pecuniarias que sean del caso, recaudar su monto y ejercer la jurisdicción coactiva sobre los alcances deducidos de la misma. 5. Conceptuar sobre la calidad y eficiencia del control fiscal interno de las entidades y organismos del Estado. 6. Presentar al Congreso de la República un informe anual sobre el estado de los recursos naturales y del ambiente. 7. Promover ante las autoridades competentes, aportando las pruebas respectivas, investigaciones penales o disciplinarias contra quienes hayan causado perjuicio a los intereses patrimoniales del Estado. La Contraloría, bajo su responsabilidad, podrá exigir, verdad sabida y buena fe guardada, la suspensión inmediata de funcionarios mientras culminan las investigaciones o los respectivos procesos penales o disciplinarios. 8. Presentar proyectos de ley relativos al régimen del control fiscal y a la organización y funcionamiento de la Contraloría General. 9. Proveer mediante concurso público los empleos de su dependencia que haya creado la ley. Esta técnica no se aplicará a los cargos de libre nombramiento y remoción. 10. Presentar informes al Congreso y al Presidente de la República sobre el cumplimiento de sus funciones y certificación sobre la situación de las finanzas del Estado, de acuerdo con la ley. 11. Dictar normas generales para armonizar los sistemas de control fiscal de todas las entidades públicas del orden nacional y territorial. 12. Ejercer la vigilancia y el control fiscal de manera preferente sobre cualquier entidad territorial, sin perjuicio de la competencia de las contralorías territoriales.",

            269: "Artículo 269. En las entidades públicas, las autoridades correspondientes están obligadas a diseñar y aplicar, según la naturaleza de sus funciones, métodos y procedimientos de control interno, de conformidad con lo que disponga la ley, la cual podrá establecer excepciones y autorizar la contratación de dichos servicios con empresas privadas colombianas.",

            270: "Artículo 270. La ley organizará las formas y los sistemas de participación ciudadana que permitan vigilar la gestión pública que se cumpla en los diversos niveles administrativos y sus resultados.",

            271: "Artículo 271. Los resultados de las indagaciones preliminares adelantadas por la Contraloría tendrán valor probatorio ante la Fiscalía General de la Nación y el juez competente.",

            272: "Artículo 272. La vigilancia de la gestión fiscal de los departamentos, distritos y municipios donde haya contralorías, corresponde a estas y se ejercerá en forma posterior y selectiva. La vigilancia de los municipios incumbe a las contralorías departamentales, salvo lo que la ley determine respecto de contralorías municipales. Los Contralores departamentales, distritales y municipales serán elegidos por las Asambleas Departamentales, Concejos Distritales y Municipales, mediante convocatoria pública, para un período de cuatro años que coincida con el de la corporación respectiva. Ningún contralor podrá ser reelegido para el período inmediato.",

            273: "Artículo 273. A solicitud de cualquiera de los proponentes, la Contraloría General de la República y demás autoridades de control fiscal territorial vigilarán el curso de los procesos de licitación pública, desde su iniciación hasta la adjudicación, con el fin de asegurar que esta se ajuste a la ley.",

            274: "Artículo 274. La vigilancia de la gestión fiscal de la Contraloría General de la República se ejercerá por un Auditor elegido para un período de cuatro años por el Consejo de Estado, de terna enviada por la Corte Suprema de Justicia.",

            275: "Artículo 275. El Procurador General de la Nación es el supremo director del Ministerio Público.",

            276: "Artículo 276. El Procurador General de la Nación será elegido por el Senado, para un período de cuatro años, de terna integrada por candidatos presentados por el Presidente de la República, la Corte Suprema de Justicia y el Consejo de Estado.",

            277: "Artículo 277. El Procurador General de la Nación, por sí o por medio de sus delegados y agentes, tendrá las siguientes funciones: 1. Vigilar el cumplimiento de la Constitución, las leyes, las decisiones judiciales y los actos administrativos. 2. Proteger los derechos humanos y asegurar su efectividad, con el auxilio del Defensor del Pueblo. 3. Defender los intereses de la sociedad. 4. Defender los intereses colectivos, en especial el ambiente. 5. Velar por el ejercicio diligente y eficiente de las funciones administrativas. 6. Ejercer vigilancia superior de la conducta oficial de quienes desempeñen funciones públicas, inclusive las de elección popular; ejercer preferentemente el poder disciplinario; adelantar las investigaciones correspondientes, e imponer las respectivas sanciones conforme a la ley. 7. Intervenir en los procesos y ante las autoridades judiciales o administrativas, cuando sea necesario en defensa del orden jurídico, del patrimonio público, o de los derechos y garantías fundamentales. 8. Rendir anualmente informe de su gestión al Congreso. 9. Exigir a los funcionarios públicos y a los particulares la información que considere necesaria. 10. Las demás que determine la ley. Para el cumplimiento de sus funciones la Procuraduría tendrá atribuciones de policía judicial, y podrá interponer las acciones que considere necesarias.",

            278: "Artículo 278. El Procurador General de la Nación ejercerá directamente las siguientes funciones: 1. Desvincular del cargo, previa audiencia y mediante decisión motivada, al funcionario público que incurra en alguna de las siguientes faltas: infringir de manera manifiesta la Constitución o la ley; derivar evidente e indebido provecho patrimonial en el ejercicio de su cargo o de sus funciones; obstaculizar en forma grave las investigaciones que realice la Procuraduría o una autoridad administrativa o jurisdiccional; obrar con manifiesta negligencia en la investigación y sanción de las faltas disciplinarias de los empleados de su dependencia, o en la denuncia de los hechos punibles de que tenga conocimiento en razón del ejercicio de su cargo. 2. Emitir conceptos en los procesos de control de constitucionalidad. 3. Presentar proyectos de ley relativos a asuntos de su competencia. 4. Exhortar al Congreso para que expida las leyes que aseguren la promoción, el ejercicio y la protección de los derechos humanos, y exigir su cumplimiento a las autoridades competentes. 5. Rendir concepto en los procesos de despojo de investidura de los miembros de las corporaciones públicas. 6. Nombrar y remover, de conformidad con la ley, los funcionarios y empleados de su dependencia.",

            279: "Artículo 279. La ley determinará lo relativo a la estructura y al funcionamiento de la Procuraduría General de la Nación, regulará lo atinente al ingreso y concurso de méritos y al retiro del servicio, a las inhabilidades, incompatibilidades, denominación, calidades, remuneración y régimen disciplinario de todos los funcionarios y empleados de dicho organismo.",

            280: "Artículo 280. Los agentes del Ministerio Público tendrán las mismas calidades, categoría, remuneración, derechos y prestaciones de los magistrados y jueces de mayor jerarquía ante quienes ejerzan el cargo.",

            281: "Artículo 281. El Defensor del Pueblo ejercerá sus funciones de manera autónoma. Será elegido por la Cámara de Representantes para un período de cuatro años de terna elaborada por el Presidente de la República.",

            282: "Artículo 282. El Defensor del Pueblo velará por la promoción, el ejercicio y la divulgación de los derechos humanos, para lo cual ejercerá las siguientes funciones: 1. Orientar e instruir a los habitantes del territorio nacional y a los colombianos en el exterior en el ejercicio y defensa de sus derechos ante las instituciones competentes o entidades de carácter privado. 2. Divulgar los derechos humanos y recomendar las políticas para su enseñanza. 3. Invocar el derecho de Habeas Corpus e interponer las acciones de tutela, sin perjuicio del derecho que asiste a los interesados. 4. Organizar y dirigir la defensoría pública en los términos que señale la ley. 5. Interponer acciones populares en asuntos relacionados con su competencia. 6. Presentar proyectos de ley sobre materias relativas a su competencia. 7. Rendir informes al Congreso sobre el cumplimiento de sus funciones. 8. Las demás que determine la ley.",

            283: "Artículo 283. La ley determinará lo relativo a la organización y funcionamiento de la Defensoría del Pueblo.",

            284: "Artículo 284. El Procurador General de la Nación y el Defensor del Pueblo podrán requerir de las autoridades las informaciones necesarias para el ejercicio de sus funciones, sin que pueda oponérseles reserva alguna, salvo en los casos previstos en la Constitución y la ley.",

            // ==========================================
            // TÍTULO XI: DE LA ORGANIZACIÓN TERRITORIAL
            // ==========================================

            285: "Artículo 285. Fuera de la división general del territorio, habrá las que determine la ley para el cumplimiento de las funciones y servicios a cargo del Estado.",

            286: "Artículo 286. Son entidades territoriales los departamentos, los distritos, los municipios y los territorios indígenas. La ley podrá darles el carácter de entidades territoriales a las regiones y provincias que se constituyan en los términos de la Constitución y de la ley.",

            287: "Artículo 287. Las entidades territoriales gozan de autonomía para la gestión de sus intereses, y dentro de los límites de la Constitución y la ley. En tal virtud tendrán los siguientes derechos: 1. Gobernarse por autoridades propias. 2. Ejercer las competencias que les correspondan. 3. Administrar los recursos y establecer los tributos necesarios para el cumplimiento de sus funciones. 4. Participar en las rentas nacionales.",

            288: "Artículo 288. La ley orgánica de ordenamiento territorial establecerá la distribución de competencias entre la Nación y las entidades territoriales. Las competencias atribuidas a los distintos niveles territoriales serán ejercidas conforme a los principios de coordinación, concurrencia y subsidiariedad en los términos que establezca la ley.",

            289: "Artículo 289. Bajo la dirección del Gobierno Nacional, los departamentos y municipios limítrofes con países vecinos podrán adelantar directamente con la entidad territorial limítrofe del país vecino, de igual nivel, programas de cooperación e integración, dirigidos a fomentar el desarrollo comunitario, la prestación de servicios públicos y la preservación del ambiente.",

            290: "Artículo 290. Con el cumplimiento de los requisitos y formalidades que señale la ley, y en los casos que esta determine, se realizarán exámenes periódicos de los límites de las entidades territoriales y se publicará el mapa oficial de la República.",

            291: "Artículo 291. Los alumnos de planteles educativos presentarán el servicio social obligatorio que la ley determine para la protección y defensa del ambiente y la promoción de la cultura, en las instituciones oficiales y privadas conforme a los criterios que para el efecto fije el Gobierno Nacional.",

            292: "Artículo 292. Los diputados y concejales no tendrán la calidad de funcionarios públicos. Su régimen de honorarios será fijado por la ley.",

            293: "Artículo 293. Sin perjuicio de lo establecido en la Constitución, la ley determinará las calidades, inhabilidades, incompatibilidades, fecha de posesión, períodos de sesiones, causas de extinción del mandato, y formas de proveer las vacantes de los ciudadanos que sean elegidos por voto popular para el desempeño de funciones públicas en las entidades territoriales.",

            294: "Artículo 294. La ley no podrá conceder exenciones ni tratamientos preferenciales en relación con los tributos de propiedad de las entidades territoriales. Tampoco podrá imponer recargos sobre sus impuestos salvo lo dispuesto en el artículo 317.",

            295: "Artículo 295. Las entidades territoriales podrán emitir títulos y bonos de deuda pública y contratar crédito externo, de acuerdo con la ley que regule la materia.",

            296: "Artículo 296. Para la conservación del orden público o para su restablecimiento donde fuere turbado, los actos y órdenes del Presidente de la República se aplicarán de manera inmediata y de preferencia sobre los de los gobernadores; los actos y órdenes de los gobernadores se aplicarán de igual manera y con los mismos efectos en relación con los de los alcaldes.",

            297: "Artículo 297. El Congreso Nacional puede decretar la formación de nuevos departamentos, siempre que se cumplan los requisitos exigidos en la Ley Orgánica de Ordenamiento Territorial y verificados los procedimientos, estudios y consulta popular.",

            298: "Artículo 298. Los departamentos tienen autonomía para la administración de los asuntos seccionales y la planificación y promoción del desarrollo económico y social dentro de su territorio en los términos establecidos por la Constitución. Los departamentos ejercen funciones administrativas, de coordinación, de complementariedad de la acción municipal, de intermediación entre la Nación y los Municipios y de prestación de los servicios que determinen la Constitución y las leyes. La ley reglamentará lo pertinente a la autonomía de los departamentos.",

            299: "Artículo 299. En cada departamento habrá una corporación administrativo-política de elección popular que se denominará Asamblea Departamental, la cual estará integrada por no menos de once miembros ni más de treinta y uno. Dicha corporación gozará de autonomía administrativa y presupuesto propio, y podrá ejercer control político sobre la administración departamental. El régimen de inhabilidades e incompatibilidades de los diputados será fijado por la ley.",

            300: "Artículo 300. Corresponde a las Asambleas Departamentales, por medio de ordenanzas: 1. Reglamentar el ejercicio de las funciones y la prestación de los servicios a cargo del departamento. 2. Expedir las disposiciones relacionadas con la planeación, el desarrollo económico y social, el apoyo financiero y crediticio a los municipios, el turismo, el transporte, el ambiente, las obras públicas, las vías de comunicación y el desarrollo de sus zonas de frontera. 3. Adoptar de acuerdo con la ley los planes y programas de desarrollo económico y social y los de obras públicas, con la determinación de las inversiones y medidas que se consideren necesarias para impulsar su ejecución y asegurar su cumplimiento. 4. Decretar, conforme a la ley, los tributos y contribuciones necesarios para el cumplimiento de las funciones departamentales. 5. Expedir las normas orgánicas del presupuesto departamental y el presupuesto anual de rentas y gastos. 6. Con arreglo a la ley, establecer las escalas de remuneración correspondientes a las distintas categorías de empleos de la administración departamental. 7. Determinar la estructura de la Administración Departamental, las funciones de sus dependencias, crear los establecimientos públicos y las empresas industriales o comerciales del departamento y autorizar la formación de sociedades de economía mixta. 8. Dictar normas de policía en todo aquello que no sea materia de disposición legal. 9. Autorizar al Gobernador del Departamento para celebrar contratos, negociar empréstitos, enajenar bienes y ejercer, pro tempore, precisas funciones de las que corresponden a las Asambleas Departamentales. 10. Regular, en concurrencia con el municipio, el deporte, la educación y la salud en los términos que establezca la ley. 11. Solicitar informes sobre el ejercicio de sus funciones al Contralor General del Departamento, Gabinete Departamental, Directores de Institutos Descentralizados y Jefes de Departamentos Administrativos del orden departamental. 12. Cumplir las demás funciones que le asignen la Constitución y la ley.",

            301: "Artículo 301. La ley señalará los casos en los cuales los asambleístas tengan derecho a honorarios y seguros.",

            302: "Artículo 302. La ley podrá establecer para uno o varios Departamentos diversas capacidades y competencias de gestión administrativa y fiscal distintas a las señaladas para ellos en la Constitución, en atención a la necesidad de mejorar la administración o la prestación de los servicios públicos de acuerdo con su población, recursos económicos y naturales y circunstancias sociales, culturales y ecológicas. En desarrollo de lo anterior, la ley podrá delegar, a uno o varios Departamentos, atribuciones propias de los organismos o entidades públicas nacionales.",

            303: "Artículo 303. En cada uno de los departamentos habrá un Gobernador que será jefe de la administración seccional y representante legal del departamento; el gobernador será agente del Presidente de la República para el mantenimiento del orden público y para la ejecución de la política económica general, así como para aquellos asuntos que mediante convenios la Nación acuerde con el departamento. Los gobernadores serán elegidos popularmente para períodos institucionales de cuatro (4) años y no podrán ser reelegidos para el período siguiente. La ley fijará las calidades, requisitos, inhabilidades e incompatibilidades de los gobernadores; reglamentará su elección; determinará sus faltas absolutas y temporales; y la forma de llenar estas últimas y dictará las demás disposiciones necesarias para el normal desempeño de sus cargos.",

            304: "Artículo 304. El Presidente de la República, en los casos taxativamente señalados por la ley, suspenderá o destituirá a los gobernadores. Su régimen de inhabilidades e incompatibilidades no será menos estricto que el establecido para el Presidente de la República.",

            305: "Artículo 305. Son atribuciones del gobernador: 1. Cumplir y hacer cumplir la Constitución, las leyes, los decretos del Gobierno y las ordenanzas de las Asambleas Departamentales. 2. Dirigir y coordinar la acción administrativa del departamento y actuar en su nombre como gestor y promotor del desarrollo integral de su territorio, de conformidad con la Constitución y las leyes. 3. Dirigir y coordinar los servicios nacionales en las condiciones de la delegación que le confiera el Presidente de la República. 4. Presentar oportunamente a la asamblea departamental los proyectos de ordenanza sobre planes y programas de desarrollo económico y social, obras públicas y presupuesto anual de rentas y gastos. 5. Nombrar y remover libremente a los gerentes o directores de los establecimientos públicos y de las empresas industriales o comerciales del Departamento. Los representantes del departamento en las juntas directivas de tales organismos y los directores o gerentes de los mismos son agentes del gobernador. 6. Fomentar de acuerdo con los planes y programas generales, las empresas, industrias y actividades convenientes al desarrollo cultural, social y económico del departamento que no correspondan a la Nación y a los municipios. 7. Crear, suprimir y fusionar los empleos de sus dependencias, señalar sus funciones especiales y fijar sus emolumentos con sujeción a la ley y a las ordenanzas respectivas. 8. Suprimir o fusionar las entidades departamentales de conformidad con las ordenanzas. 9. Objetar por motivos de inconstitucionalidad, ilegalidad o inconveniencia, los proyectos de ordenanza, o sancionarlos y promulgarlos. 10. Revisar los actos de los concejos municipales y de los alcaldes y, por motivos de inconstitucionalidad o ilegalidad, remitirlos al Tribunal competente para que decida sobre su validez. 11. Velar por la exacta recaudación de las rentas departamentales, de las entidades descentralizadas y las que sean objeto de transferencias por la Nación. 12. Convocar a la asamblea departamental a sesiones extraordinarias en las que sólo se ocupará de los temas y materias para lo cual fue convocada. 13. Escoger de las ternas enviadas por el jefe nacional respectivo, los gerentes o jefes seccionales de los establecimientos públicos del orden nacional que operen en el departamento, de acuerdo con la ley. 14. Ejercer las funciones administrativas que le delegue el Presidente de la República. 15. Las demás que le señale la Constitución, las leyes y las ordenanzas.",

            306: "Artículo 306. Dos o más departamentos podrán constituirse en regiones administrativas y de planificación, con personería jurídica, autonomía y patrimonio propio. Su objeto principal será el desarrollo económico y social del respectivo territorio.",

            307: "Artículo 307. La respectiva ley orgánica, previo concepto de la Comisión de Ordenamiento Territorial, establecerá las condiciones para solicitar la conversión de la Región en entidad territorial. La decisión tomada por el Congreso se someterá en cada caso a referendo de los ciudadanos de los departamentos interesados. La misma ley establecerá las atribuciones, los órganos de administración, y los recursos de las regiones y su participación en el manejo de los ingresos provenientes del Fondo Nacional de Regalías. Igualmente definirá los principios para la adopción del estatuto especial de cada región.",

            308: "Artículo 308. La ley podrá limitar las apropiaciones departamentales destinadas a honorarios de los diputados y a gastos de funcionamiento de las asambleas y de las contralorías departamentales.",

            309: "Artículo 309. Erígense en departamento las Intendencias de Arauca, Casanare, Putumayo, el Archipiélago de San Andrés, Providencia y Santa Catalina, y las Comisarías del Amazonas, Guaviare, Guainía, Vaupés y Vichada. Los bienes y derechos que a cualquier título pertenecían a las intendencias y comisarías continuarán siendo de propiedad de los respectivos departamentos.",

            310: "Artículo 310. El Departamento Archipiélago de San Andrés, Providencia y Santa Catalina se regirá, además de las normas previstas en la Constitución y las leyes para los otros departamentos, por las normas especiales que en materia administrativa, de inmigración, fiscal, de comercio exterior, de cambios, financiera y de fomento económico establezca el legislador. Mediante ley aprobada por la mayoría de los miembros de cada cámara se podrá limitar el ejercicio de los derechos de circulación y residencia, establecer controles a la densidad de la población, regular el uso del suelo y someter a condiciones especiales la enajenación de bienes inmuebles con el fin de proteger la identidad cultural de las comunidades nativas y preservar el ambiente y los recursos naturales del Archipiélago. Mediante la creación de los municipios a que hubiere lugar, la Asamblea Departamental garantizará la expresión institucional de las comunidades raizales de San Andrés. El municipio de Providencia tendrá en las rentas departamentales una participación no inferior del 20% del valor total de dichas rentas.",

            311: "Artículo 311. Al municipio como entidad fundamental de la división político-administrativa del Estado le corresponde prestar los servicios públicos que determine la ley, construir las obras que demande el progreso local, ordenar el desarrollo de su territorio, promover la participación comunitaria, el mejoramiento social y cultural de sus habitantes y cumplir las demás funciones que le asignen la Constitución y las leyes.",

            312: "Artículo 312. En cada municipio habrá una corporación político-administrativa elegida popularmente para períodos de cuatro (4) años que se denominará concejo municipal, integrado por no menos de 7, ni más de 21 miembros según lo determine la ley de acuerdo con la población respectiva. Esta corporación podrá ejercer control político sobre la administración municipal. La ley determinará las calidades, inhabilidades, e incompatibilidades de los concejales y la época de sesiones ordinarias de los concejos. Los concejales no tendrán la calidad de empleados públicos. La ley podrá determinar los casos en que tengan derecho a honorarios por su asistencia a sesiones. Su aceptación de cualquier empleo público constituye falta absoluta.",

            313: "Artículo 313. Corresponde a los concejos: 1. Reglamentar las funciones y la eficiente prestación de los servicios a cargo del municipio. 2. Adoptar los correspondientes planes y programas de desarrollo económico y social y de obras públicas. 3. Autorizar al alcalde para celebrar contratos y ejercer pro tempore precisas funciones de las que corresponden al Concejo. 4. Votar de conformidad con la Constitución y la ley los tributos y los gastos locales. 5. Dictar las normas orgánicas del presupuesto y expedir anualmente el presupuesto de rentas y gastos. 6. Determinar la estructura de la administración municipal y las funciones de sus dependencias; las escalas de remuneración correspondientes a las distintas categorías de empleos; crear, a iniciativa del alcalde, establecimientos públicos y empresas industriales o comerciales y autorizar la constitución de sociedades de economía mixta. 7. Reglamentar los usos del suelo y, dentro de los límites que fije la ley, vigilar y controlar las actividades relacionadas con la construcción y enajenación de inmuebles destinados a vivienda. 8. Elegir Personero para el período que fije la ley y los demás funcionarios que ésta determine. 9. Dictar las normas necesarias para el control, la preservación y defensa del patrimonio ecológico y cultural del municipio. 10. Las demás que la Constitución y la ley le asignen.",

            314: "Artículo 314. En cada municipio habrá un alcalde, jefe de la administración local y representante legal del municipio, que será elegido popularmente para períodos institucionales de cuatro (4) años, y no podrá ser reelegido para el período siguiente. Siempre que se presente falta absoluta a más de dieciocho (18) meses de la terminación del período, se elegirá alcalde para el tiempo que reste. En caso de que faltare menos de dieciocho (18) meses, el gobernador designará un alcalde para lo que reste del período, respetando el partido, grupo político o coalición por el cual fue inscrito el alcalde elegido. El presidente y los gobernadores, en los casos taxativamente señalados por la ley, suspenderán o destituirán a los alcaldes.",

            315: "Artículo 315. Son atribuciones del alcalde: 1. Cumplir y hacer cumplir la Constitución, la ley, los decretos del gobierno, las ordenanzas, y los acuerdos del concejo. 2. Conservar el orden público en el municipio, de conformidad con la ley y las instrucciones y órdenes que reciba del Presidente de la República y del respectivo gobernador. El alcalde es la primera autoridad de policía del municipio. La Policía Nacional cumplirá con prontitud y diligencia las órdenes que le imparta el alcalde por conducto del respectivo comandante. 3. Dirigir la acción administrativa del municipio; asegurar el cumplimiento de las funciones y la prestación de los servicios a su cargo; representarlo judicial y extrajudicialmente; y nombrar y remover a los funcionarios bajo su dependencia y a los gerentes o directores de los establecimientos públicos y las empresas industriales o comerciales de carácter local, de acuerdo con las disposiciones pertinentes. 4. Suprimir o fusionar entidades y dependencias municipales, de conformidad con los acuerdos respectivos. 5. Presentar oportunamente al Concejo los proyectos de acuerdo sobre planes y programas de desarrollo económico y social, obras públicas, presupuesto anual de rentas y gastos y los demás que estime convenientes para la buena marcha del municipio. 6. Sancionar y promulgar los acuerdos que hubiere aprobado el Concejo y objetar los que considere inconvenientes o contrarios al ordenamiento jurídico. 7. Crear, suprimir o fusionar los empleos de sus dependencias, señalarles funciones especiales y fijar sus emolumentos con arreglo a los acuerdos correspondientes. No podrá crear obligaciones que excedan el monto global fijado para gastos de personal en el presupuesto inicialmente aprobado. 8. Colaborar con el Concejo para el buen desempeño de sus funciones, presentarle informes generales sobre su administración y convocarlo a sesiones extraordinarias, en las que sólo se ocupará de los temas y materias para los cuales fue citado. 9. Ordenar los gastos municipales de acuerdo con el plan de inversión y el presupuesto. 10. Las demás que la Constitución y la ley le señalen.",

            316: "Artículo 316. En las votaciones que se realicen para la elección de autoridades locales y para la decisión de asuntos del mismo carácter, sólo podrán participar los ciudadanos residentes en el respectivo municipio.",

            317: "Artículo 317. Solo los municipios podrán gravar la propiedad inmueble. Lo anterior no obsta para que otras entidades impongan contribución de valorización. La ley destinará un porcentaje de estos tributos, que no podrá exceder del promedio de las sobretasas existentes, a las entidades encargadas del manejo y conservación del ambiente y de los recursos naturales renovables, de acuerdo con los planes de desarrollo de los municipios del área de su jurisdicción.",

            318: "Artículo 318. Con el fin de mejorar la prestación de los servicios y asegurar la participación de la ciudadanía en el manejo de los asuntos públicos de carácter local, los concejos podrán dividir sus municipios en comunas cuando se trate de áreas urbanas, y en corregimientos en el caso de las zonas rurales. En cada una de las comunas o corregimientos habrá una junta administradora local de elección popular, integrada por el número de miembros que determine la ley, que tendrá las siguientes funciones: 1. Participar en la elaboración de los planes y programas municipales de desarrollo económico y social y de obras públicas. 2. Vigilar y controlar la prestación de los servicios municipales en su comuna o corregimiento y las inversiones que se realicen con recursos públicos. 3. Formular propuestas de inversión ante las autoridades nacionales, departamentales y municipales encargadas de la elaboración de los respectivos planes de inversión. 4. Distribuir las partidas globales que les asigne el presupuesto municipal. 5. Ejercer las funciones que les deleguen el concejo y otras autoridades locales.",

            319: "Artículo 319. Cuando dos o más municipios tengan relaciones económicas, sociales y físicas, que den al conjunto características de un área metropolitana, podrán organizarse como entidad administrativa encargada de programar y coordinar el desarrollo armónico e integrado del territorio colocado bajo su autoridad; racionalizar la prestación de los servicios públicos a cargo de quienes la integran y, si es el caso, prestar en común algunos de ellos; y ejecutar obras de interés metropolitano. La ley de ordenamiento territorial adoptará para las áreas metropolitanas un régimen administrativo y fiscal de carácter especial; garantizará que en sus órganos de administración tengan adecuada participación las respectivas autoridades municipales; y señalará la forma de convocar y realizar las consultas populares que decidan la vinculación de los municipios.",

            320: "Artículo 320. La ley podrá establecer categorías de municipios de acuerdo con su población, recursos fiscales, importancia económica y situación geográfica, y señalar distinto régimen para su organización, gobierno y administración.",

            321: "Artículo 321. Las provincias se constituyen con municipios o territorios indígenas circunvecinos, pertenecientes a un mismo departamento. La ley dictará el estatuto básico y fijará el régimen administrativo de las provincias que podrán organizarse para el cumplimiento de las funciones que les deleguen entidades nacionales o departamentales y que les asignen la ley y los municipios que las integran. Las provincias serán creadas por ordenanza, a iniciativa del gobernador, de los alcaldes de los respectivos municipios o del número de ciudadanos que determine la ley.",

            322: "Artículo 322. Bogotá, Capital de la República y del departamento de Cundinamarca, se organiza como Distrito Capital. Su régimen político, fiscal y administrativo será el que determinen la Constitución, las leyes especiales que para el mismo se dicten y las disposiciones vigentes para los municipios. Con base en las normas generales que establezca la ley, el concejo a iniciativa del alcalde, dividirá el territorio distrital en localidades, de acuerdo con las características sociales de sus habitantes, y hará el correspondiente reparto de competencias y funciones administrativas.",

            323: "Artículo 323. El Concejo Distrital se compondrá de cuarenta y cinco (45) concejales. En cada una de las localidades habrá una junta administradora elegida popularmente para períodos de cuatro (4) años que estará integrada por no menos de siete ediles, según lo determine el Concejo Distrital, atendida la población respectiva. El Alcalde Mayor será elegido para un período de cuatro años, por el 40 por ciento de los votos que, de manera secreta y directa, depositen los ciudadanos con las formalidades que determine la ley, siempre que sobrepase al segundo candidato más votado por 10 puntos porcentuales. Si ningún candidato obtiene dicha mayoría, se celebrará una nueva votación que tendrá lugar tres semanas más tarde, en la que solo participarán los dos candidatos que hubieren obtenido las más altas votaciones. Será declarado Alcalde Mayor quien obtenga el mayor número de votos, en la segunda vuelta.",

            324: "Artículo 324. Las juntas administradoras locales distribuirán y apropiarán las partidas globales que en el presupuesto anual del Distrito se asignen a las localidades teniendo en cuenta las necesidades básicas insatisfechas de su población. Sobre las rentas departamentales que se causen en Bogotá, la ley determinará la participación que le corresponda a la capital de la República.",

            325: "Artículo 325. Créase la Región Metropolitana Bogotá-Cundinamarca como entidad administrativa de asociatividad regional de régimen especial, con el objeto de garantizar la ejecución de planes y programas de desarrollo sostenible y la prestación oportuna y eficiente de los servicios a su cargo. El Distrito Capital, la Gobernación de Cundinamarca y los municipios de Cundinamarca podrán asociarse a esta región cuando compartan dinámicas territoriales, ambientales, sociales o económicas.",

            326: "Artículo 326. Los municipios circunvecinos podrán incorporarse al Distrito Capital si así lo determinan los ciudadanos que residan en ellos mediante votación que tendrá lugar cuando el concejo distrital haya manifestado su acuerdo con esta vinculación.",

            327: "Artículo 327. En las elecciones de Gobernador y de diputados a la Asamblea Departamental de Cundinamarca no participarán los ciudadanos inscritos en el censo electoral del Distrito Capital.",

            328: "Artículo 328. El Distrito Turístico y Cultural de Cartagena de Indias, el Distrito Turístico, Cultural e Histórico de Santa Marta y Barranquilla conservarán su régimen y carácter, y se organiza a Buenaventura y Tumaco como Distrito Especial, Industrial, Portuario, Biodiverso y Ecoturístico. La ciudad de Barrancabermeja se organiza como Distrito Especial Portuario, Biodiverso, Industrial y Turístico. La ciudad de Medellín se organiza como Distrito Especial de Ciencia, Tecnología e Innovación.",

            329: "Artículo 329. La conformación de las entidades territoriales indígenas se hará con sujeción a lo dispuesto en la Ley Orgánica de Ordenamiento Territorial, y su delimitación se hará por el Gobierno Nacional, con participación de los representantes de las comunidades indígenas, previo concepto de la Comisión de Ordenamiento Territorial. Los resguardos son de propiedad colectiva y no enajenable.",

            330: "Artículo 330. De conformidad con la Constitución y las leyes, los territorios indígenas estarán gobernados por consejos conformados y reglamentados según los usos y costumbres de sus comunidades y ejercerán las siguientes funciones: 1. Velar por la aplicación de las normas legales sobre usos del suelo y poblamiento de sus territorios. 2. Diseñar las políticas y los planes y programas de desarrollo económico y social dentro de su territorio, en armonía con el Plan Nacional de Desarrollo. 3. Promover las inversiones públicas en sus territorios y velar por su debida ejecución. 4. Percibir y distribuir sus recursos. 5. Velar por la preservación de los recursos naturales. 6. Coordinar los programas y proyectos promovidos por las diferentes comunidades en su territorio. 7. Colaborar con el mantenimiento del orden público dentro de su territorio de acuerdo con las instrucciones y disposiciones del Gobierno Nacional. 8. Representar a los territorios ante el Gobierno Nacional y las demás entidades a las cuales se integren; y 9. Las que les señalen la Constitución y la ley.",

            331: "Artículo 331. Créase la Corporación Autónoma Regional del Río Grande de la Magdalena encargada de la recuperación de la navegación, de la actividad portuaria, la adecuación y la conservación de tierras, la generación y distribución de energía y el aprovechamiento y preservación del ambiente, los recursos ictiológicos y demás recursos naturales renovables. La ley determinará su organización y fuentes de financiación, y definirá en favor de los municipios ribereños un tratamiento especial en la asignación de regalías y en la participación que les corresponda en los ingresos corrientes de la Nación."
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
