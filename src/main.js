import Phaser from 'phaser';
import '../style.css';
import BootScene from './scenes/BootScene';
import MenuScene from './scenes/MenuScene';
import TutorialScene from './scenes/TutorialScene';
import GameScene from './scenes/GameScene';

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    parent: 'game-container',
    dom: {
        createContainer: true
    },
    backgroundColor: '#0f172a',
    scene: [BootScene, MenuScene, TutorialScene, GameScene],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    }
};

const game = new Phaser.Game(config);
