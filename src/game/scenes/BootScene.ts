import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        // No assets to load for this procedural game — jump straight to battle
        this.scene.start('BattleScene');
    }
}
