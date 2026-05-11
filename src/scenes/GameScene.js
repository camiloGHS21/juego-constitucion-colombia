import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.lives = 1;
        this.popularity = 50;
        this.transparency = 50;
        this.budget = 1000;
        this.scenarioIndex = 0;
    }

    create() {
        const { width, height } = this.cameras.main;
        this.cameras.main.fadeIn(500, 0, 0, 0);

        this.currentYear = 1;
        this.scenarioIndex = 0;
        this.scenarios = this.getScenarios();

        const introSpeech = this.sound.add('petro_intro', { volume: 1 });

        // Background - Petro at desk
        this.bg = this.add.image(width / 2, height / 2, 'office_closed').setDisplaySize(width, height);
        this.bg.setDepth(0);

        // Contralor - STATIC image, no animation, no jitter, completely hidden at start
        this.contralorImage = this.add.image(width * 0.18, height * 0.55, 'contralor');
        this.contralorImage.setOrigin(0.5, 0.5);
        this.contralorImage.setScale(0.4);
        this.contralorImage.setAlpha(0);
        this.contralorImage.setDepth(1);

        // Stats panel (top-left, compact)
        this.uiPanel = this.add.graphics();
        this.uiPanel.fillStyle(0x0f172a, 0.9);
        this.uiPanel.fillRoundedRect(10, 10, 260, 115, 12);
        this.uiPanel.lineStyle(2, 0x3b82f6, 1);
        this.uiPanel.strokeRoundedRect(10, 10, 260, 115, 12);
        this.uiPanel.setDepth(30);

        this.statsText = this.add.text(25, 20, '', {
            font: 'bold 15px Outfit',
            fill: '#ffffff',
            lineSpacing: 6
        });
        this.statsText.setDepth(31);

        this.livesGroup = this.add.group();
        this.updateStats();

        // Dynamic bottom text bar (redrawn each scenario to fit text)
        this.dialogBox = this.add.graphics();
        this.dialogBox.setDepth(30);
        this.dialogBox.setAlpha(0); // Hidden initially

        this.titleText = this.add.text(width / 2, 0, '', {
            font: 'bold 16px Outfit',
            fill: '#60a5fa'
        }).setOrigin(0.5, 0);
        this.titleText.setDepth(31);
        this.titleText.setAlpha(0); // Hidden initially

        this.mainText = this.add.text(width / 2, 0, '', {
            font: '18px Outfit',
            fill: '#ffffff',
            align: 'center',
            wordWrap: { width: width - 80 }
        }).setOrigin(0.5, 0);
        this.mainText.setDepth(31);
        this.mainText.setAlpha(0); // Hidden initially

        // Options container
        this.optionsContainer = this.add.container(0, 0);
        this.optionsContainer.setDepth(32);

        // Game Over overlay (hidden initially)
        this.gameOverOverlay = this.add.graphics();
        this.gameOverOverlay.setDepth(50);
        this.gameOverOverlay.setAlpha(0);

        this.gameOverTitle = this.add.text(width / 2, height / 2 - 80, '', {
            font: 'bold 48px Outfit',
            fill: '#ff4444',
            align: 'center'
        }).setOrigin(0.5).setDepth(51).setAlpha(0);

        this.gameOverText = this.add.text(width / 2, height / 2 + 20, '', {
            font: '22px Outfit',
            fill: '#ffffff',
            align: 'center',
            wordWrap: { width: width - 200 }
        }).setOrigin(0.5).setDepth(51).setAlpha(0);

        this.gameOverBtn = null;

        // Article Viewer Overlay (hidden initially)
        this.articleOverlay = this.add.graphics();
        this.articleOverlay.setDepth(60);
        this.articleOverlay.setAlpha(0);
        this.articleTitleText = this.add.text(width / 2, 120, '', { font: 'bold 28px Outfit', fill: '#60a5fa' }).setOrigin(0.5).setDepth(61).setAlpha(0);
        this.articleContentText = this.add.text(width / 2, 170, '', { font: '18px Outfit', fill: '#ffffff', wordWrap: { width: width - 200 }, lineSpacing: 8 }).setOrigin(0.5, 0).setDepth(61).setAlpha(0);
        this.closeArticleBtn = this.add.text(width / 2, height - 100, '[ CERRAR ]', { font: 'bold 22px Outfit', fill: '#94a3b8' }).setOrigin(0.5).setDepth(61).setAlpha(0).setInteractive({ useHandCursor: true });

        this.closeArticleBtn.on('pointerdown', () => this.hideArticle());

        // Article Button in UI
        this.articleBtn = this.add.text(width - 20, height - 120, '📖 VER ARTÍCULO', {
            font: 'bold 16px Outfit',
            fill: '#ffffff',
            backgroundColor: '#3b82f6',
            padding: { x: 12, y: 8 }
        }).setOrigin(1, 1).setDepth(35).setInteractive({ useHandCursor: true }).setAlpha(0);

        this.articleBtn.on('pointerdown', () => {
            const scenario = this.scenarios[this.scenarioIndex];
            if (scenario && scenario.article) {
                this.showArticle(scenario.article);
            }
        });


        // Background - Petro at desk
        const skipBtn = this.add.text(width - 20, 20, 'SALTAR INTRO ⏭', {
            font: 'bold 16px Outfit',
            fill: '#ffffff',
            backgroundColor: '#ef4444',
            padding: { x: 15, y: 8 }
        }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setDepth(100);

        const onIntroFinish = () => {
            if (skipBtn) skipBtn.destroy();
            this.tweens.add({
                targets: [this.dialogBox, this.titleText, this.mainText],
                alpha: 1,
                duration: 500
            });
            this.startNextScenario();
        };

        this.currentSpeech = null; // Store it to stop it if skipped
        this.petroTalk('petro_intro', onIntroFinish);

        skipBtn.on('pointerdown', () => {
            if (this.currentSpeech) this.currentSpeech.stop();
            // petroTalk completion will trigger onIntroFinish via the speech.on('complete')
            // but we need to force it if we stopped it manually or if it was already finishing
            onIntroFinish();
        });

        skipBtn.on('pointerover', () => skipBtn.setStyle({ fill: '#000000', backgroundColor: '#ffffff' }));
        skipBtn.on('pointerout', () => skipBtn.setStyle({ fill: '#ffffff', backgroundColor: '#ef4444' }));
    }

    updateLives() {
        this.livesGroup.clear(true, true);
        for (let i = 0; i < this.lives; i++) {
            const heart = this.add.image(25 + (i * 30), 140, 'heart').setDisplaySize(22, 22).setOrigin(0);
            heart.setDepth(31);
            this.livesGroup.add(heart);
        }
    }

    getScenarios() {
        return [
            // TÍTULO XI - ORGANIZACIÓN TERRITORIAL (285-331)
            {
                article: 311,
                title: 'Año 1 - Título XI: Autonomía Municipal',
                text: '(Art. 311) Al municipio le corresponde prestar los servicios públicos. Como alcalde, ¿cuál es tu prioridad?',
                options: [
                    { text: 'Invertir en agua potable y saneamiento', action: () => { this.popularity += 10; this.transparency += 10; this.budget -= 350; return 'Cumples con la prestación de servicios básicos (Art. 311).'; } },
                    { text: 'Construir un estadio de lujo (Popularismo)', action: () => { this.popularity += 15; this.transparency -= 15; this.budget -= 500; return 'Ganas votos, pero descuidas las necesidades básicas.'; } },
                    { text: 'Privatizar el agua para ahorrar presupuesto', action: () => { this.popularity -= 25; this.transparency += 5; this.budget += 200; return 'Ahorras dinero, pero el pueblo sufre por costos altos.'; } }
                ]
            },
            {
                article: 313,
                title: 'Año 1 - Título XI: El Concejo Municipal',
                text: '(Art. 313) El Concejo pide reglamentar el uso del suelo para proteger cuencas hídricas.',
                options: [
                    { text: 'Aprobar la protección ambiental estricta', action: () => { this.transparency += 10; this.budget -= 100; return 'Respetas la reglamentación del suelo que ordena el Art. 313.'; } },
                    { text: 'Permitir urbanizaciones en rondas de ríos', action: () => { this.transparency -= 30; this.budget += 400; return 'Violas la planeación territorial y pones en riesgo al pueblo.'; } },
                    { text: 'Aplazar la decisión para favorecer constructoras', action: () => { this.transparency -= 15; this.popularity -= 5; return 'La omisión legislativa genera inseguridad jurídica.'; } }
                ]
            },
            {
                article: 315,
                title: 'Año 1 - Título XI: Atribuciones del Alcalde',
                text: '(Art. 315) Debes presentar el Plan de Desarrollo Municipal al Concejo.',
                options: [
                    { text: 'Presentar un plan técnico y transparente', action: () => { this.popularity += 10; this.transparency += 5; this.budget -= 50; return 'Cumples con tu deber de jefe administrativo (Art. 315).'; } },
                    { text: 'Presentar un plan sin estudios de costos', action: () => { this.popularity -= 20; this.transparency -= 25; return 'Falta de planeación sancionable por el Concejo.'; } },
                    { text: 'Copiar el plan de otro municipio cercano', action: () => { this.popularity -= 10; this.transparency -= 30; return 'Falta de originalidad y rigor técnico (Art. 315).'; } }
                ]
            },
            // TÍTULO XI - RÉGIMEN MUNICIPAL
            {
                article: 317,
                title: 'Año 1 - Título XI: Impuesto Predial',
                text: '(Art. 317) Solo los municipios pueden gravar la propiedad inmueble. ¿Cómo manejas el impuesto predial?',
                options: [
                    { text: 'Cobrar predial justo y destinarlo al ambiente', action: () => { this.popularity += 5; this.transparency += 15; this.budget += 300; return 'Ejerces la potestad tributaria municipal con responsabilidad (Art. 317).'; } },
                    { text: 'Exonerar a terratenientes aliados de campaña', action: () => { this.transparency -= 40; this.budget -= 400; return 'Pierdes recursos y la Contraloría detecta favorecimiento ilegal.'; } },
                    { text: 'Subir el predial al máximo para recaudar más', action: () => { this.popularity -= 30; this.budget += 800; return 'Recaudas más pero el pueblo protesta por la carga fiscal excesiva.'; } }
                ]
            },
            // TÍTULO X - ORGANISMOS DE CONTROL (267-284)
            {
                article: 267,
                title: 'Año 2 - Título X: Control Fiscal',
                text: '(Art. 267) La Contraloría General vigila la gestión fiscal de tu municipio.',
                options: [
                    { text: 'Colaborar plenamente con la auditoría', action: () => { this.transparency += 20; this.popularity -= 5; this.budget -= 100; return 'La vigilancia fiscal es una función pública (Art. 267).'; } },
                    { text: 'Ocultar facturas de contratos de obras', action: () => { this.transparency -= 45; this.popularity -= 20; return 'Hallazgo fiscal grave con implicaciones penales.'; } },
                    { text: 'Contratar auditores externos para "maquillar"', action: () => { this.transparency -= 30; this.budget -= 150; return 'Intento de evasión detectado por el Título X.'; } }
                ]
            },
            {
                article: 277,
                title: 'Año 2 - Título X: Ministerio Público',
                text: '(Art. 277) El Procurador vigila tu conducta oficial y el cumplimiento de la ley.',
                options: [
                    { text: 'Sancionar a funcionarios corruptos detectados', action: () => { this.transparency += 15; this.popularity -= 15; return 'Respetas la vigilancia de la conducta oficial (Art. 277).'; } },
                    { text: 'Ignorar denuncias contra tus aliados políticos', action: () => { this.transparency -= 40; this.popularity += 5; return 'Omisión de deberes vigilada por la Procuraduría.'; } },
                    { text: 'Denunciar al Procurador por persecución', action: () => { this.popularity += 10; this.transparency -= 20; return 'Ganas apoyo popular pero pierdes solidez legal.'; } }
                ]
            },
            {
                article: 282,
                title: 'Año 2 - Título X: Defensoría del Pueblo',
                text: '(Art. 282) El Defensor advierte sobre la mala atención en el hospital municipal.',
                options: [
                    { text: 'Invertir en dotación médica inmediata', action: () => { this.popularity += 10; this.budget -= 600; return 'Promueves y proteges los derechos ciudadanos (Art. 282).'; } },
                    { text: 'Responder que "todo está bajo control"', action: () => { this.popularity -= 40; this.transparency -= 20; return 'La Defensoría denuncia tu negligencia administrativa.'; } },
                    { text: 'Culpar al Gobierno Nacional por falta de giros', action: () => { this.popularity += 5; this.transparency -= 10; return 'Ganas tiempo, pero no solucionas el problema de salud.'; } }
                ]
            },
            // TÍTULO IX - ELECCIONES Y ORGANIZACIÓN ELECTORAL (258-266)
            {
                article: 258,
                title: 'Año 3 - Título IX: El Voto Ciudadano',
                text: '(Art. 258) Se acercan elecciones y debes garantizar que el voto sea secreto y libre.',
                options: [
                    { text: 'Blindar los puestos de votación (Transparencia)', action: () => { this.transparency += 15; this.budget -= 300; return 'Garantizas que el voto sea un derecho libre (Art. 258).'; } },
                    { text: 'Favorecer el transporte solo para tus votantes', action: () => { this.transparency -= 45; this.popularity -= 20; return 'Delito electoral que mancha la organización (Título IX).'; } },
                    { text: 'Pedir apoyo a la Policía para vigilar las urnas', action: () => { this.popularity += 5; this.budget -= 150; return 'Orden público asegurado para el sufragio (Art. 258).'; } }
                ]
            },
            {
                article: 265,
                title: 'Año 3 - Título IX: El CNE',
                text: '(Art. 265) El Consejo Nacional Electoral regula la propaganda electoral.',
                options: [
                    { text: 'Retirar vallas ilegales de todos los partidos', action: () => { this.transparency += 15; this.budget -= 50; return 'Cumples con las normas de la organización electoral.'; } },
                    { text: 'Dejar solo las vallas de tus candidatos amigos', action: () => { this.transparency -= 35; return 'El CNE sanciona tu falta de imparcialidad (Art. 265).'; } },
                    { text: 'Multar a todos los partidos por igual (Duro)', action: () => { this.transparency += 25; this.popularity -= 20; this.budget += 100; return 'Mano dura electoral valorada por el CNE (Art. 265).'; } }
                ]
            },
            {
                article: 266,
                title: 'Año 3 - Título IX: Registraduría Nacional',
                text: '(Art. 266) La Registraduría organiza las votaciones y necesita locales públicos.',
                options: [
                    { text: 'Ceder las escuelas municipales para la jornada', action: () => { this.popularity += 5; this.budget -= 100; return 'Facilitas la dirección de las elecciones (Art. 266).'; } },
                    { text: 'Negar el uso de locales para entorpecer el proceso', action: () => { this.budget += 100; this.popularity -= 25; return 'Afectas la organización electoral básica (Título IX).'; } },
                    { text: 'Contratar personal de apoyo adicional (Integridad)', action: () => { this.transparency += 15; this.budget -= 250; return 'Garantizas una logística electoral impecable (Art. 266).'; } }
                ]
            },
            {
                article: 287,
                title: 'Año 3 - Título XI: Autonomía Territorial',
                text: '(Art. 287) Tu municipio goza de autonomía para gestionar sus intereses. El Gobierno Nacional quiere imponer un proyecto sin consultarte.',
                options: [
                    { text: 'Defender la autonomía municipal con argumentos legales', action: () => { this.popularity += 15; this.transparency += 10; this.budget -= 100; return 'Ejerces tu derecho a gobernarte por autoridades propias (Art. 287).'; } },
                    { text: 'Aceptar sin negociar para no perder apoyo del centro', action: () => { this.budget += 500; this.popularity -= 20; this.transparency -= 15; return 'Cedes la autonomía territorial que te garantiza la Constitución.'; } },
                    { text: 'Convocar cabildo abierto para decidir con la comunidad', action: () => { this.popularity += 20; this.budget -= 150; return 'Fortaleces la participación comunitaria y la autonomía (Art. 287).'; } }
                ]
            },
            // SEGUNDA RONDA DE TÍTULO XI - ENTIDADES TERRITORIALES
            {
                article: 306,
                title: 'Año 4 - Título XI: Regiones Administrativas',
                text: '(Art. 306) Se propone crear una Región Administrativa con departamentos vecinos.',
                options: [
                    { text: 'Apoyar para gestionar proyectos a gran escala', action: () => { this.popularity += 15; this.budget -= 800; return 'Promueves el desarrollo regional (Título XI).'; } },
                    { text: 'Oponerse por miedo a perder poder local', action: () => { this.popularity -= 10; return 'Te quedas atrás en la planeación territorial moderna.'; } },
                    { text: 'Pedir más dinero a la Nación para aceptar', action: () => { this.budget += 200; this.transparency -= 10; return 'Negociación fiscal oportunista detectada.'; } }
                ]
            },
            {
                article: 319,
                title: 'Año 4 - Título XI: Áreas Metropolitanas',
                text: '(Art. 319) Pereira y Dosquebradas buscan consolidar su Área Metropolitana.',
                options: [
                    { text: 'Integrar servicios de transporte y seguridad', action: () => { this.popularity += 15; this.transparency += 10; this.budget -= 100; return 'Mejoras la gestión de la entidad territorial (Art. 319).'; } },
                    { text: 'Cobrar peajes urbanos entre municipios', action: () => { this.popularity -= 30; this.budget += 200; return 'Fragmentas la unidad regional del Título XI.'; } },
                    { text: 'Fusionar ambas ciudades en una sola (Arriesgado)', action: () => { this.popularity -= 40; this.transparency += 20; return 'Visión de futuro que choca con la identidad local (Art. 319).'; } }
                ]
            },
            {
                article: 320,
                title: 'Año 4 - Título XI: Régimen de los Municipios',
                text: '(Art. 320) La ley permite categorizar municipios según población y recursos.',
                options: [
                    { text: 'Ajustar la planta de personal a la ley de cuotas', action: () => { this.transparency += 20; this.popularity += 5; return 'Respetas la eficiencia administrativa del Título XI.'; } },
                    { text: 'Crear cargos innecesarios para pagar favores', action: () => { this.transparency -= 50; this.popularity -= 20; return 'Destitución por mal manejo del régimen municipal.'; } },
                    { text: 'Subir los impuestos locales para subir de categoría', action: () => { this.popularity -= 35; this.budget += 600; return 'El pueblo castiga el exceso de carga fiscal.'; } }
                ]
            }
        ];
    }

    updateStats() {
        const budgetColor = this.budget < 0 ? '#ff4444' : '#ffffff';
        const budgetText = this.budget < 0 ? `Presupuesto: $${this.budget}M (Déficit)` : `Presupuesto: $${this.budget}M`;

        this.statsText.setText([
            `Año: ${this.currentYear} / 4`,
            `Popularidad: ${this.popularity}%`,
            `Transparencia: ${this.transparency}%`
        ]);

        // We use a separate text for budget to allow different color
        if (!this.budgetDisplay) {
            this.budgetDisplay = this.add.text(25, 84, '', {
                font: 'bold 15px Outfit',
                fill: '#ffffff'
            }).setDepth(31);
        }

        this.budgetDisplay.setText(budgetText);
        this.budgetDisplay.setColor(budgetColor);

        this.updateLives();
    }

    showStatChange(popDiff, transDiff, budDiff) {
        const startX = 280;
        let startY = 30;
        const spacing = 22;

        const createFloat = (val, prefix, color) => {
            if (val === 0) return;
            const text = val > 0 ? `+${val}${prefix}` : `${val}${prefix}`;
            const floatText = this.add.text(startX, startY, text, {
                font: 'bold 16px Outfit',
                fill: val > 0 ? '#22c55e' : '#ef4444'
            }).setDepth(100);

            this.tweens.add({
                targets: floatText,
                x: startX + 50,
                alpha: 0,
                duration: 2000,
                ease: 'Power2',
                onComplete: () => floatText.destroy()
            });
            startY += spacing;
        };

        createFloat(popDiff, '% Pop', '#22c55e');
        createFloat(transDiff, '% Trans', '#22c55e');
        createFloat(budDiff, 'M Budget', '#22c55e');
    }

    startNextScenario() {
        if (this.lives <= 0) {
            this.endGame();
            return;
        }

        if (this.scenarioIndex >= this.scenarios.length) {
            this.endGame();
            return;
        }

        const scenario = this.scenarios[this.scenarioIndex];
        this.currentYear = Math.ceil((this.scenarioIndex + 1) / 3);
        this.updateStats();

        this.titleText.setText(scenario.title);
        this.mainText.setText(scenario.text);
        this.redrawDialogBox();

        // Show the article button
        this.articleBtn.setAlpha(1);

        // Contralor ONLY appears during Título X events (Organismos de Control)
        // Use a more specific check so Título XI doesn't trigger it
        if (scenario.title.includes('Título X') && !scenario.title.includes('Título XI')) {
            this.bg.setTexture('office_talking');
            // Smoothly fade in contralor
            this.tweens.add({ targets: this.contralorImage, alpha: 1, duration: 800 });
        } else {
            // Normal event - Petro talks briefly, then goes back to writing
            this.bg.setTexture('office_talking');
            // Always ensure contralor is hidden for non-Título X events
            this.tweens.add({ targets: this.contralorImage, alpha: 0, duration: 300 });
            this.time.delayedCall(3000, () => {
                this.bg.setTexture('office_writing');
            });
        }

        this.createOptions(scenario.options.map(opt => ({
            text: opt.text,
            action: () => {
                this.safePlay('click');
                // Removed immediate hide here so he stays during the feedback!

                const oldTransparency = this.transparency;
                const oldPopularity = this.popularity;
                const feedback = opt.action();

                // Check for life loss (HARD MODE: 40% threshold)
                if (this.transparency < 40 || this.popularity < 40) {
                    if (this.transparency < oldTransparency || this.popularity < oldPopularity) {
                        this.lives--;
                        this.safePlay('error');
                        this.cameras.main.shake(300, 0.02);
                    } else {
                        this.safePlay('success');
                    }
                } else {
                    this.safePlay('success');
                }

                this.showMessage(feedback);
                // (Mouth animation removed as we use full background states)

                this.scenarioIndex++;

                // Check for year end bonus
                const nextYear = Math.ceil((this.scenarioIndex + 1) / 3);
                if (nextYear > this.currentYear && this.currentYear < 4) {
                    this.checkYearEnd();
                } else {
                    this.time.delayedCall(3000, () => this.startNextScenario());
                }
            }
        })));
    }

    checkYearEnd() {
        let bonus = 0;
        let reasons = [];

        if (this.transparency > 70) {
            bonus += 300;
            reasons.push('Excelencia en Transparencia: +$300M');
        }
        if (this.popularity > 70) {
            bonus += 200;
            reasons.push('Alta Aprobación Ciudadana: +$200M');
        }
        if (this.budget > 1000) {
            bonus += 150;
            reasons.push('Superávit Fiscal (Meta cumplida): +$150M');
        }

        if (bonus > 0) {
            this.budget += bonus;
            const msg = `🎉 CIERRE DE AÑO ${this.currentYear}\nRecibiste incentivos del Gobierno Nacional por tu buena gestión:\n${reasons.join('\n')}`;
            this.showMessage(msg);
            this.safePlay('success');
            this.showStatChange(0, 0, bonus);
        } else {
            this.showMessage(`📉 CIERRE DE AÑO ${this.currentYear}\nNo alcanzaste los objetivos de excelencia fiscal.\nSigue trabajando en tu transparencia y popularidad.`);
        }

        this.time.delayedCall(5000, () => this.startNextScenario());
    }

    safePlay(key) {
        if (this.cache.audio.exists(key)) {
            this.sound.play(key);
        }
    }

    endGame() {
        if (this.music) this.music.stop();
        const { width, height } = this.cameras.main;

        let title = '';
        let message = '';
        let titleColor = '#ff4444';
        let isVictory = false;

        if (this.lives <= 0) {
            title = '¡GAME OVER!';
            message = 'Has perdido toda tu credibilidad política.\nLa Procuraduría y el pueblo te han\nretirado del cargo por violar la Constitución.';
            this.safePlay('error');
        } else if (this.transparency < 40) {
            title = '¡DESTITUCIÓN!';
            message = 'La Procuraduría encontró irregularidades insalvables.\nHas sido inhabilitado para ejercer\ncargos públicos por 20 años.';
            this.safePlay('error');
        } else if (this.popularity > 70 && this.transparency > 60) {
            title = '¡LEYENDA POLÍTICA!';
            message = 'Terminaste tu mandato con honores.\nTu respeto por la Constitución te asegura\nun lugar en la historia de Risaralda.';
            titleColor = '#22c55e';
            isVictory = true;
            this.safePlay('success');
        } else if (this.budget < -500) {
            title = 'QUIEBRA MUNICIPAL';
            message = 'Tu municipio ha superado el límite de deuda permitido.\nEl Ministerio de Hacienda ha intervenido\nla alcaldía por inviabilidad financiera.';
            this.safePlay('error');
        } else {
            title = 'MISIÓN CUMPLIDA';
            message = 'Finalizaste tu mandato de acuerdo a la Constitución.\nDejaste un municipio estable.';
            titleColor = '#22c55e';
            isVictory = true;
            this.safePlay('success');
        }

        // Hide regular UI
        this.clearOptions();
        this.dialogBox.setAlpha(0);
        this.titleText.setAlpha(0);
        this.mainText.setAlpha(0);
        this.uiPanel.setAlpha(0);
        this.statsText.setAlpha(0);
        this.contralorImage.setAlpha(0);

        // Full screen Game Over overlay
        this.gameOverOverlay.clear();
        this.gameOverOverlay.fillStyle(isVictory ? 0x0a2e0a : 0x1a0000, 0.92);
        this.gameOverOverlay.fillRect(0, 0, width, height);
        this.tweens.add({ targets: this.gameOverOverlay, alpha: 1, duration: 800 });

        this.gameOverTitle.setText(title);
        this.gameOverTitle.setColor(titleColor);
        this.tweens.add({ targets: this.gameOverTitle, alpha: 1, duration: 1000, delay: 300 });

        this.gameOverText.setText(message);
        this.tweens.add({ targets: this.gameOverText, alpha: 1, duration: 1000, delay: 600 });

        // Restart button
        this.time.delayedCall(1200, () => {
            const btnBg = this.add.graphics();
            btnBg.fillStyle(0x3b82f6, 1);
            btnBg.fillRoundedRect(width / 2 - 180, height / 2 + 100, 360, 55, 12);
            btnBg.lineStyle(2, 0xffffff, 1);
            btnBg.strokeRoundedRect(width / 2 - 180, height / 2 + 100, 360, 55, 12);
            btnBg.setDepth(52);
            btnBg.setAlpha(0);

            const btnText = this.add.text(width / 2, height / 2 + 127, 'Volver a Gobernar', {
                font: 'bold 22px Outfit',
                fill: '#ffffff'
            }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(52).setAlpha(0);

            this.tweens.add({ targets: [btnBg, btnText], alpha: 1, duration: 500 });

            btnText.on('pointerover', () => {
                btnBg.clear();
                btnBg.fillStyle(0x60a5fa, 1);
                btnBg.fillRoundedRect(width / 2 - 180, height / 2 + 100, 360, 55, 12);
                btnBg.lineStyle(2, 0xffffff, 1);
                btnBg.strokeRoundedRect(width / 2 - 180, height / 2 + 100, 360, 55, 12);
            });

            btnText.on('pointerout', () => {
                btnBg.clear();
                btnBg.fillStyle(0x3b82f6, 1);
                btnBg.fillRoundedRect(width / 2 - 180, height / 2 + 100, 360, 55, 12);
                btnBg.lineStyle(2, 0xffffff, 1);
                btnBg.strokeRoundedRect(width / 2 - 180, height / 2 + 100, 360, 55, 12);
            });

            btnText.on('pointerdown', () => {
                this.lives = 1;
                this.popularity = 50;
                this.transparency = 50;
                this.budget = 1000;
                this.scenarioIndex = 0;
                this.scene.restart();
            });
        });
    }

    createOptions(options) {
        this.clearOptions();
        const { width, height } = this.cameras.main;

        // SHUFFLE OPTIONS to prevent "top-answer" cheating
        const shuffledOptions = [...options].sort(() => Math.random() - 0.5);

        // ── Thought Bubble from Petro's head ──
        const bubbleW = 340;
        const btnH = 48;
        const gap = 12;
        const totalBtnsH = shuffledOptions.length * btnH + (shuffledOptions.length - 1) * gap;
        const padding = 25;
        const bubbleH = totalBtnsH + padding * 2;

        // Bubble position: above Petro's head
        const bubbleX = width * 0.58;
        const bubbleY = Math.min(30, height - bubbleH - 180); // Ensure it doesn't overlap bottom bar too much

        // Draw the thought bubble background
        const bubbleGfx = this.add.graphics();
        bubbleGfx.fillStyle(0x0f172a, 0.95);
        bubbleGfx.fillRoundedRect(bubbleX - bubbleW / 2, bubbleY, bubbleW, bubbleH, 20);
        bubbleGfx.lineStyle(3, 0x3b82f6, 1);
        bubbleGfx.strokeRoundedRect(bubbleX - bubbleW / 2, bubbleY, bubbleW, bubbleH, 20);

        // Trailing thought circles
        const circleStartX = bubbleX + 10;
        const circleStartY = bubbleY + bubbleH + 8;
        bubbleGfx.fillStyle(0x0f172a, 0.9);
        bubbleGfx.lineStyle(2, 0x3b82f6, 1);
        bubbleGfx.fillCircle(circleStartX, circleStartY, 14);
        bubbleGfx.strokeCircle(circleStartX, circleStartY, 14);
        bubbleGfx.fillCircle(circleStartX + 12, circleStartY + 25, 9);
        bubbleGfx.strokeCircle(circleStartX + 12, circleStartY + 25, 9);
        bubbleGfx.fillCircle(circleStartX + 20, circleStartY + 45, 6);
        bubbleGfx.strokeCircle(circleStartX + 20, circleStartY + 45, 6);

        this.optionsContainer.add(bubbleGfx);

        // Add shuffled options
        shuffledOptions.forEach((opt, index) => {
            const x = bubbleX;
            const y = bubbleY + padding + index * (btnH + gap) + btnH / 2;

            const btnBg = this.add.graphics();
            btnBg.fillStyle(0x3b82f6, 1);
            btnBg.fillRoundedRect(x - (bubbleW - 40) / 2, y - btnH / 2, bubbleW - 40, btnH, 12);

            const text = this.add.text(x, y, opt.text, {
                font: 'bold 13px Outfit',
                fill: '#ffffff',
                wordWrap: { width: bubbleW - 70 },
                align: 'center'
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            text.on('pointerdown', () => {
                if (this.cache.audio.exists('click')) {
                    this.sound.play('click', { volume: 0.5 });
                }
                const oldPopularity = this.popularity;
                const oldTransparency = this.transparency;

                this.tweens.add({
                    targets: this.optionsContainer,
                    scale: 0.8,
                    alpha: 0,
                    duration: 200,
                    onComplete: () => {
                        const oldBudget = this.budget;
                        const resultMsg = opt.action();

                        this.showStatChange(
                            this.popularity - oldPopularity,
                            this.transparency - oldTransparency,
                            this.budget - oldBudget
                        );

                        // Sound feedback based on stats change
                        const isBad = (this.popularity < oldPopularity || this.transparency < oldTransparency || this.budget < oldBudget);
                        const soundKey = isBad ? 'error' : 'success';

                        if (this.cache.audio.exists(soundKey)) {
                            this.sound.play(soundKey, { volume: 0.4 });
                        }

                        this.showMessage(resultMsg);
                    }
                });
            });

            text.on('pointerover', () => {
                btnBg.clear();
                btnBg.fillStyle(0x2563eb, 1);
                btnBg.fillRoundedRect(x - (bubbleW - 40) / 2, y - btnH / 2, bubbleW - 40, btnH, 12);
                this.tweens.add({ targets: text, scale: 1.05, duration: 100 });
            });

            text.on('pointerout', () => {
                btnBg.clear();
                btnBg.fillStyle(0x3b82f6, 1);
                btnBg.fillRoundedRect(x - (bubbleW - 40) / 2, y - btnH / 2, bubbleW - 40, btnH, 12);
                this.tweens.add({ targets: text, scale: 1, duration: 100 });
            });

            this.optionsContainer.add([btnBg, text]);
        });

        // Appear effect for thought bubble
        this.optionsContainer.setScale(0.5).setAlpha(0);
        this.tweens.add({
            targets: this.optionsContainer,
            scale: 1,
            alpha: 1,
            duration: 500,
            ease: 'Back.easeOut'
        });

        this.updateStats();
    }

    clearOptions() {
        this.optionsContainer.removeAll(true);
    }

    showMessage(msg) {
        this.titleText.setText('CONSEJO CONSTITUCIONAL');
        this.mainText.setText(msg);
        this.redrawDialogBox();
        this.updateStats();
        // Hide article button during feedback
        this.articleBtn.setAlpha(0);
    }

    showArticle(num) {
        const articles = {
            // TÍTULO IX - ELECCIONES
            258: "El voto es un derecho y un deber ciudadano. El Estado garantizará que se ejerza de forma secreta en cubículos individuales, con tarjetas electorales numeradas y seguridad.",
            259: "VOTO PROGRAMÁTICO: Quienes elijan gobernadores y alcaldes, imponen por mandato al elegido el programa que presentó al inscribirse. La ley reglamentará su ejercicio.",
            260: "Los ciudadanos eligen directamente a Presidente, Senadores, Representantes, Gobernadores, Diputados, Alcaldes, Concejales y Ediles.",
            261: "Ningún cargo de elección popular tendrá suplente. Las vacancias serán ocupadas por los candidatos no elegidos en la misma lista en orden sucesivo.",
            262: "La elección de Presidente y Vicepresidente no coincidirá con otra. La de Congreso se hará en fecha separada de la de autoridades locales.",
            263: "Para asegurar la representación proporcional, cuando se vote por dos o más individuos en elección popular o en corporación pública, se empleará el sistema de cuociente electoral.",

            264: "El Consejo Nacional Electoral se compondrá del número de miembros que determine la ley, no menor de siete. Serán elegidos por el Consejo de Estado para un período de cuatro años, de ternas elaboradas por los partidos y movimientos políticos.",

            266: "El Registrador Nacional del Estado Civil será elegido por el Consejo Nacional Electoral para un período de cinco años. Dirige y organiza las elecciones, el registro civil y la identificación de las personas.",


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
            318: "Los concejos podrán dividir sus municipios en comunas o corregimientos. En cada una habrá una Junta Administradora Local de elección popular para promover la participación y vigilar asuntos locales.",
            319: "ÁREAS METROPOLITANAS: Municipios con fuertes vínculos pueden organizarse para coordinar desarrollo, servicios públicos y obras comunes.",
            320: "La ley puede establecer categorías de municipios según población, recursos y situación geográfica para definir su régimen.",
            322: "BOGOTÁ D.C.: Tiene un régimen especial como Distrito Capital. Se divide en localidades con sus propias autoridades locales."
        };

        const { width, height } = this.cameras.main;
        this.articleTitleText.setText(`ARTÍCULO ${num}`);
        this.articleContentText.setText(articles[num] || 'Contenido no disponible.');

        this.articleOverlay.clear();
        this.articleOverlay.fillStyle(0x0f172a, 0.95);
        this.articleOverlay.fillRect(0, 0, width, height);
        this.articleOverlay.lineStyle(4, 0x3b82f6, 1);
        this.articleOverlay.strokeRect(50, 50, width - 100, height - 100);

        this.tweens.add({
            targets: [this.articleOverlay, this.articleTitleText, this.articleContentText, this.closeArticleBtn],
            alpha: 1,
            duration: 300
        });
    }

    hideArticle() {
        this.tweens.add({
            targets: [this.articleOverlay, this.articleTitleText, this.articleContentText, this.closeArticleBtn],
            alpha: 0,
            duration: 200
        });
    }

    redrawDialogBox() {
        const { width, height } = this.cameras.main;

        // Set wordwrap width to ensure accurate height calculation
        this.mainText.setWordWrapWidth(width - 80);

        // Calculate required height based on text content
        const titleH = this.titleText.getBounds().height || 20;
        const textH = this.mainText.getBounds().height || 22;
        const pad = 20;
        const spacing = 10;
        const totalH = titleH + textH + (pad * 2) + spacing;

        const barH = Math.max(100, totalH);

        this.dialogBox.clear();
        this.dialogBox.fillStyle(0x0f172a, 0.9);
        this.dialogBox.fillRoundedRect(0, height - barH, width, barH, 0);
        this.dialogBox.lineStyle(3, 0x3b82f6, 1);
        this.dialogBox.strokeLineShape(new Phaser.Geom.Line(0, height - barH, width, height - barH));

        this.titleText.setY(height - barH + pad);
        this.mainText.setY(height - barH + pad + titleH + spacing);
    }

    petroTalk(audioKey, onComplete = null) {
        if (!this.cache.audio.exists(audioKey)) {
            if (onComplete) onComplete();
            return;
        }

        this.currentSpeech = this.sound.add(audioKey, { volume: 1 });
        this.currentSpeech.play();

        this.bg.setTexture('office_closed');
        const frames = ['office_closed', 'office_semi', 'office_open', 'office_semi'];
        let frameIdx = 0;

        // Animation timer: alternate textures every 120ms for a more natural rhythm
        const talkEvent = this.time.addEvent({
            delay: 120,
            callback: () => {
                frameIdx = (frameIdx + 1) % frames.length;
                this.bg.setTexture(frames[frameIdx]);
            },
            repeat: -1
        });

        this.currentSpeech.on('complete', () => {
            talkEvent.remove();
            this.bg.setTexture('office_writing');
            if (onComplete) onComplete();
            this.currentSpeech = null;
        });

        this.currentSpeech.on('stop', () => {
            talkEvent.remove();
            this.bg.setTexture('office_writing');
            this.currentSpeech = null;
        });
    }
}
