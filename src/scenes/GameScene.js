import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.lives = 1;
        this.popularity = 50;
        this.transparency = 50;
        this.budget = 1000;
        this.prevBudget = 1000;
        this.scenarioIndex = 0;
    }

    showFloatingText(text, x, y, color = '#22c55e') {
        const floating = this.add.text(x, y, text, {
            font: 'bold 24px Outfit',
            fill: color,
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(100);

        this.tweens.add({
            targets: floating,
            y: y - 80,
            alpha: 0,
            duration: 2000,
            ease: 'Cubic.easeOut',
            onComplete: () => floating.destroy()
        });
    }

    create() {
        const { width, height } = this.cameras.main;
        this.cameras.main.fadeIn(500, 0, 0, 0);

        this.currentYear = 1;
        this.scenarioIndex = 0;
        this.scenarios = this.getScenarios();

        const introSpeech = this.sound.add('intro_speech', { volume: 1 });

        // Background - Static office
        this.bg = this.add.image(width / 2, height / 2, 'office_closed').setDisplaySize(width, height);
        this.bg.setDepth(0);

        // Character Layer - Only Federico moves
        this.character = this.add.image(width / 2, height / 2, 'office_closed').setDisplaySize(width, height);
        this.character.setDepth(2);
        // Optimized crop to capture full character body while avoiding flag/window jitter
        this.character.setCrop(716, 550, 200, 254);


        // Contralor - STATIC image
        this.contralorImage = this.add.image(width * 0.18, height * 0.55, 'contralor');
        this.contralorImage.setOrigin(0.5, 0.5);
        this.contralorImage.setScale(0.4);
        this.contralorImage.setAlpha(0);
        this.contralorImage.setDepth(1);

        // Stats panel (top-left, compact)
        this.uiPanel = this.add.graphics();
        this.uiPanel.fillStyle(0x0f172a, 0.9);
        this.uiPanel.fillRoundedRect(10, 10, 260, 160, 12);
        this.uiPanel.lineStyle(2, 0x3b82f6, 1);
        this.uiPanel.strokeRoundedRect(10, 10, 260, 160, 12);
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


        // Intro Skip Button
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
        this.federicoTalk('intro_speech', onIntroFinish);

        skipBtn.on('pointerdown', () => {
            if (this.currentSpeech) this.currentSpeech.stop();
            // federicoTalk completion will trigger onIntroFinish via the speech.on('complete')
            // but we need to force it if we stopped it manually or if it was already finishing
            onIntroFinish();
        });

        skipBtn.on('pointerover', () => skipBtn.setStyle({ fill: '#000000', backgroundColor: '#ffffff' }));
        skipBtn.on('pointerout', () => skipBtn.setStyle({ fill: '#ffffff', backgroundColor: '#ef4444' }));
    }

    updateStats() {
        if (!this.statsText) return;

        this.statsText.setText(
            `📊 ESTADO DE LA GESTIÓN\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `😊 POPULARIDAD: ${Math.max(0, this.popularity)}%\n` +
            `🔍 TRANSPARENCIA: ${Math.max(0, this.transparency)}%\n` +
            `💰 PRESUPUESTO: $${this.budget}M\n` +
            `   VIDA DEL ALCALDE: `
        );
        this.updateLives();
    }

    showStatChange(popDiff, transDiff, budgetDiff) {
        let delay = 0;

        if (budgetDiff !== 0) {
            const color = budgetDiff > 0 ? '#22c55e' : '#ef4444';
            const prefix = budgetDiff > 0 ? '+$' : '-$';
            this.showFloatingText(`${prefix}${Math.abs(budgetDiff)}M`, 220, 100, color);
            delay += 250;
        }

        if (popDiff !== 0) {
            this.time.delayedCall(delay, () => {
                const color = popDiff > 0 ? '#22c55e' : '#ef4444';
                const prefix = popDiff > 0 ? '+' : '';
                this.showFloatingText(`${prefix}${popDiff}% POP`, 140, 50, color);
            });
            delay += 250;
        }

        if (transDiff !== 0) {
            this.time.delayedCall(delay, () => {
                const color = transDiff > 0 ? '#60a5fa' : '#f59e0b';
                const prefix = transDiff > 0 ? '+' : '';
                this.showFloatingText(`${prefix}${transDiff}% TRANS`, 140, 80, color);
            });
        }
    }

    updateLives() {
        this.livesGroup.clear(true, true);
        const startX = 180; // Adjusted to follow "VIDA DEL ALCALDE: "
        const startY = 148; // Significantly lowered to center with the last line
        for (let i = 0; i < this.lives; i++) {
            const heart = this.add.image(startX + (i * 28), startY, 'heart').setDisplaySize(20, 20).setOrigin(0, 0.5); // Using 0.5 origin for easier vertical centering
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
                    { text: 'Cobrar predial justo y destinarlo al ambiente', action: () => { this.popularity += 5; this.transparency += 15; this.budget += 400; return 'Ejerces la potestad tributaria municipal con responsabilidad (Art. 317). Recaudas $400M.'; } },
                    { text: 'Exonerar a terratenientes aliados de campaña', action: () => { this.transparency -= 40; this.budget -= 400; return 'Pierdes recursos y la Contraloría detecta favorecimiento ilegal.'; } },
                    { text: 'Subir el predial al máximo para recaudar más', action: () => { this.popularity -= 30; this.budget += 1000; return 'Recaudas $1000M, pero el pueblo protesta por la carga fiscal excesiva.'; } }
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
            this.character.setTexture('office_closed');
            // Smoothly fade in contralor
            this.tweens.add({ targets: this.contralorImage, alpha: 1, duration: 800 });
            this.time.delayedCall(3000, () => {
                this.character.setTexture('office_closed');
            });
        } else {
            // Normal event - Federico talks briefly, then goes back to writing
            this.character.setTexture('office_closed');
            // Always ensure contralor is hidden for non-Título X events
            this.tweens.add({ targets: this.contralorImage, alpha: 0, duration: 300 });
            this.time.delayedCall(1000, () => {
                this.character.setTexture('office_closed');
                this.time.delayedCall(600, () => {
                    this.character.setTexture('office_writing');
                });
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

        // ── Thought Bubble from Federico's head ──
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

        // Character animation for feedback: Open mouth while showing message, then close and write
        this.character.setTexture('office_open');
        this.time.delayedCall(2500, () => {
            this.character.setTexture('office_closed');
            this.time.delayedCall(600, () => {
                this.character.setTexture('office_writing');
            });
        });

        // Hide article button during feedback
        this.articleBtn.setAlpha(0);
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
        const artText = articles[num] || `Artículo ${num}: Referencia constitucional no disponible.`;

        this.titleText.setText(`ARTÍCULO ${num}`);
        this.mainText.setText(artText);
        this.redrawDialogBox();
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

    federicoTalk(audioKey, onComplete = null) {
        if (!this.cache.audio.exists(audioKey)) {
            if (onComplete) onComplete();
            return;
        }

        this.currentSpeech = this.sound.add(audioKey, { volume: 1 });
        this.currentSpeech.play();

        this.character.setTexture('office_closed');
        const frames = ['office_closed', 'office_semi', 'office_open', 'office_semi'];
        let frameIdx = 0;

        // Animation timer: alternate textures every 120ms for a more natural rhythm
        const talkEvent = this.time.addEvent({
            delay: 120,
            callback: () => {
                frameIdx = (frameIdx + 1) % frames.length;
                this.character.setTexture(frames[frameIdx]);
            },
            repeat: -1
        });

        this.currentSpeech.on('complete', () => {
            talkEvent.remove();
            this.character.setTexture('office_closed');
            this.time.delayedCall(600, () => {
                this.character.setTexture('office_writing');
                if (onComplete) onComplete();
            });
            this.currentSpeech = null;
        });

        this.currentSpeech.on('stop', () => {
            talkEvent.remove();
            this.character.setTexture('office_closed');
            this.time.delayedCall(400, () => {
                this.character.setTexture('office_writing');
            });
            this.currentSpeech = null;
        });
    }
}
