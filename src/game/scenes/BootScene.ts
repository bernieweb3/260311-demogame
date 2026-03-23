import Phaser from 'phaser';
import idle1Url from '../../../img/dungim1.png';
import idle2Url from '../../../img/dungim2.png';

const IDLE_1_KEY = 'scientist_idle_1';
const IDLE_2_KEY = 'scientist_idle_2';
const IDLE_ANIM_KEY = 'scientist_idle';

export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        this.load.image(IDLE_1_KEY, idle1Url);
        this.load.image(IDLE_2_KEY, idle2Url);
    }

    create() {
        this.createCharacterAnimation();
        const selectedElements = this.registry.get('selectedElements') as string[] | undefined;
        this.scene.start('BattleScene', { selectedElements });
    }

    private createCharacterAnimation() {
        if (!this.anims.exists(IDLE_ANIM_KEY)) {
            this.anims.create({
                key: IDLE_ANIM_KEY,
                frames: [{ key: IDLE_1_KEY }, { key: IDLE_2_KEY }],
                frameRate: 3,
                repeat: -1,
            });
        }
    }
}
