import Phaser from 'phaser';
import {
    GAME_WIDTH,
    GAME_HEIGHT,
    GRAVITY,
    JUMP_FORCE,
    MOVE_SPEED,
    PROJECTILE_SPEED,
    MAX_HEALTH,
    DAMAGE,
    BLOCK_SIZE,
    MATCH_DURATION,
    PLATFORMS,
} from '../config';
import { ELEMENTS, ELEMENT_KEYS, STARTING_INVENTORY } from '../data/elements';

// ─── Interfaces ───────────────────────────────────────────────
interface CharacterState {
    x: number;
    y: number;
    velX: number;
    velY: number;
    width: number;
    height: number;
    health: number;
    onGround: boolean;
    crouching: boolean;
    facingRight: boolean;
    side: 'left' | 'right';
    animFrame: number;
    animTimer: number;
    inventory: Record<string, number>;
    aiTimer: number;
    aiShootTimer: number;
}

interface ProjectileState {
    x: number;
    y: number;
    velX: number;
    velY: number;
    isPlayerProjectile: boolean;
    active: boolean;
    trail: { x: number; y: number; alpha: number }[];
}

interface BlockState {
    x: number;
    y: number;
    element: string;
    hp: number;
    maxHp: number;
    side: 'left' | 'right';
}

interface ParticleState {
    x: number;
    y: number;
    velX: number;
    velY: number;
    color: number;
    size: number;
    life: number;
    decay: number;
}

// ─── BattleScene ──────────────────────────────────────────────
export class BattleScene extends Phaser.Scene {
    private player!: CharacterState;
    private ai!: CharacterState;
    private projectiles: ProjectileState[] = [];
    private blocks: BlockState[] = [];
    private particles: ParticleState[] = [];

    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private keyA!: Phaser.Input.Keyboard.Key;
    private keyD!: Phaser.Input.Keyboard.Key;
    private keyW!: Phaser.Input.Keyboard.Key;
    private keyS!: Phaser.Input.Keyboard.Key;
    private keyQ!: Phaser.Input.Keyboard.Key;
    private keyE!: Phaser.Input.Keyboard.Key;
    private keyF!: Phaser.Input.Keyboard.Key;
    private keyR!: Phaser.Input.Keyboard.Key;
    private keyB!: Phaser.Input.Keyboard.Key;
    private keyUp!: Phaser.Input.Keyboard.Key;
    private keyDown!: Phaser.Input.Keyboard.Key;
    private keyLeft!: Phaser.Input.Keyboard.Key;
    private keyRight!: Phaser.Input.Keyboard.Key;

    private angleInput = '';
    private selectedElement = 'C';

    // Block cursor
    private buildMode = false;
    private cursorGridX = 4; // grid column (0-11 for 400px / 32px)
    private cursorGridY = 15; // grid row
    private cursorBlink = 0;

    private gameOver = false;
    private winner = '';
    private matchTimer = MATCH_DURATION;

    private cameraShakeX = 0;
    private cameraShakeY = 0;
    private cameraShakeIntensity = 0;

    private aiLastPlayerX = 0;
    private aiLastPlayerY = 0;
    private playerVelocityHistory: { vx: number; vy: number }[] = [];

    // Phaser Graphics objects
    private gfx!: Phaser.GameObjects.Graphics;
    private uiTexts: Map<string, Phaser.GameObjects.Text> = new Map();

    public onGameOver?: (winner: string, playerHp: number, aiHp: number) => void;

    constructor() {
        super({ key: 'BattleScene' });
    }

    init(data: { onGameOver?: (winner: string, playerHp: number, aiHp: number) => void }) {
        if (data.onGameOver) {
            this.onGameOver = data.onGameOver;
        }
    }

    create() {
        this.gameOver = false;
        this.winner = '';
        this.matchTimer = MATCH_DURATION;
        this.projectiles = [];
        this.blocks = [];
        this.particles = [];
        this.angleInput = '';
        this.selectedElement = 'C';
        this.cameraShakeIntensity = 0;
        this.cameraShakeX = 0;
        this.cameraShakeY = 0;

        // Characters
        this.player = this.createChar(150, 400, 'left');
        this.ai = this.createChar(1000, 400, 'right');
        this.aiLastPlayerX = this.player.x;
        this.aiLastPlayerY = this.player.y;
        this.playerVelocityHistory = [];

        // Graphics
        this.gfx = this.add.graphics();

        // Input keys
        this.keyA = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyD = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keyW = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyS = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keyQ = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
        this.keyE = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.keyF = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.F);
        this.keyR = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        this.keyB = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.B);
        this.keyUp = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
        this.keyDown = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
        this.keyLeft = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
        this.keyRight = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);

        // Text input for angle
        this.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
            if (this.gameOver) {
                if (event.key === 'r' || event.key === 'R') {
                    this.scene.restart();
                }
                return;
            }
            if (event.key >= '0' && event.key <= '9') {
                if (this.angleInput.length < 3) this.angleInput += event.key;
            }
            if (event.key === 'Backspace') {
                this.angleInput = this.angleInput.slice(0, -1);
            }
            if (event.key === 'Enter' && this.angleInput.length > 0) {
                const angle = parseInt(this.angleInput);
                if (angle >= 0 && angle <= 90) {
                    this.shootProjectile(this.player, angle, true);
                }
                this.angleInput = '';
            }
        });

        // Element cycling (on just pressed)
        this.keyQ.on('down', () => {
            if (this.gameOver) return;
            const idx = ELEMENT_KEYS.indexOf(this.selectedElement);
            this.selectedElement = ELEMENT_KEYS[(idx - 1 + ELEMENT_KEYS.length) % ELEMENT_KEYS.length];
        });
        this.keyE.on('down', () => {
            if (this.gameOver) return;
            const idx = ELEMENT_KEYS.indexOf(this.selectedElement);
            this.selectedElement = ELEMENT_KEYS[(idx + 1) % ELEMENT_KEYS.length];
        });
        this.keyF.on('down', () => {
            if (this.gameOver) return;
            this.placeBlock();
        });
        this.keyB.on('down', () => {
            if (this.gameOver) return;
            this.buildMode = !this.buildMode;
            if (this.buildMode) {
                // Initialize cursor near player
                this.cursorGridX = Math.floor((this.player.x + this.player.width / 2) / BLOCK_SIZE);
                this.cursorGridY = Math.floor((this.player.y + this.player.height - BLOCK_SIZE) / BLOCK_SIZE);
            }
        });
        this.keyUp.on('down', () => {
            if (!this.buildMode || this.gameOver) return;
            this.cursorGridY = Math.max(0, this.cursorGridY - 1);
        });
        this.keyDown.on('down', () => {
            if (!this.buildMode || this.gameOver) return;
            this.cursorGridY = Math.min(Math.floor((GAME_HEIGHT - 1) / BLOCK_SIZE), this.cursorGridY + 1);
        });
        this.keyLeft.on('down', () => {
            if (!this.buildMode || this.gameOver) return;
            this.cursorGridX = Math.max(0, this.cursorGridX - 1);
        });
        this.keyRight.on('down', () => {
            if (!this.buildMode || this.gameOver) return;
            this.cursorGridX = Math.min(Math.floor(400 / BLOCK_SIZE) - 1, this.cursorGridX + 1);
        });

        // Timer
        this.time.addEvent({
            delay: 1000,
            callback: () => {
                if (!this.gameOver) {
                    this.matchTimer--;
                    if (this.matchTimer <= 0) this.endByTimer();
                }
            },
            loop: true,
        });

        // Create persistent UI text objects
        this.createUITexts();
    }

    private createChar(x: number, y: number, side: 'left' | 'right'): CharacterState {
        return {
            x, y, velX: 0, velY: 0, width: 40, height: 60,
            health: MAX_HEALTH, onGround: false, crouching: false,
            facingRight: side === 'left', side,
            animFrame: 0, animTimer: 0,
            inventory: { ...STARTING_INVENTORY },
            aiTimer: 0, aiShootTimer: 0,
        };
    }

    private createUITexts() {
        const style = { fontFamily: '"Courier New", monospace', fontSize: '12px', color: '#ffffff' };
        const boldStyle = { ...style, fontStyle: 'bold' };

        this.uiTexts.set('playerLabel', this.add.text(25, 23, 'PLAYER', { ...boldStyle }).setDepth(100));
        this.uiTexts.set('playerHp', this.add.text(150, 23, '', { ...boldStyle }).setDepth(100));
        this.uiTexts.set('aiLabel', this.add.text(GAME_WIDTH - 215, 23, 'AI', { ...boldStyle }).setDepth(100));
        this.uiTexts.set('aiHp', this.add.text(GAME_WIDTH - 55, 23, '', { ...boldStyle }).setDepth(100));

        this.uiTexts.set('timer', this.add.text(GAME_WIDTH / 2, 30, '', {
            ...boldStyle, fontSize: '18px',
        }).setOrigin(0.5).setDepth(100));

        this.uiTexts.set('angleLabel', this.add.text(GAME_WIDTH / 2, 55, 'ANGLE (0-90):', {
            fontFamily: '"Courier New", monospace', fontSize: '10px', color: '#aaaaaa',
        }).setOrigin(0.5).setDepth(100));

        this.uiTexts.set('angleValue', this.add.text(GAME_WIDTH / 2, 75, '', {
            ...boldStyle, fontSize: '18px', color: '#4CAF50',
        }).setOrigin(0.5).setDepth(100));

        // Instructions
        const instStyle = { fontFamily: '"Courier New", monospace', fontSize: '10px', color: '#bbbbbb' };
        this.uiTexts.set('inst1', this.add.text(22, GAME_HEIGHT - 82, 'WASD — Move / Jump / Crouch', instStyle).setDepth(100));
        this.uiTexts.set('inst2', this.add.text(22, GAME_HEIGHT - 68, '0-9 + ENTER — Set angle & Shoot', instStyle).setDepth(100));
        this.uiTexts.set('inst3', this.add.text(22, GAME_HEIGHT - 54, 'Q/E — Cycle element | F — Place block', instStyle).setDepth(100));
        this.uiTexts.set('inst4', this.add.text(22, GAME_HEIGHT - 40, 'B — Build mode | ↑↓←→ — Move cursor', instStyle).setDepth(100));

        // Element labels
        ELEMENT_KEYS.forEach((key, i) => {
            const elem = ELEMENTS[key];
            const ex = GAME_WIDTH - 275 + i * 65;
            const ey = GAME_HEIGHT - 55;
            this.uiTexts.set(`elem_${key}`, this.add.text(ex + 5, ey + 5, elem.symbol, {
                fontFamily: '"Courier New", monospace', fontSize: '12px', fontStyle: 'bold', color: '#aaaaaa',
            }).setDepth(100));
            this.uiTexts.set(`elemCount_${key}`, this.add.text(ex + 28, ey + 5, '', {
                fontFamily: '"Courier New", monospace', fontSize: '10px', color: '#cccccc',
            }).setDepth(100));
            this.uiTexts.set(`elemHp_${key}`, this.add.text(ex + 5, ey + 20, `HP:${elem.hp}`, {
                fontFamily: '"Courier New", monospace', fontSize: '8px', color: '#888888',
            }).setDepth(100));
        });

        // Element panel title
        this.uiTexts.set('elemTitle', this.add.text(GAME_WIDTH - 275, GAME_HEIGHT - 73, 'ELEMENTS [Q/E cycle, F place]', {
            fontFamily: '"Courier New", monospace', fontSize: '9px', color: '#888888',
        }).setDepth(100));

        // Game over texts (hidden initially)
        this.uiTexts.set('goTitle', this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, '', {
            fontFamily: '"Courier New", monospace', fontSize: '56px', fontStyle: 'bold', color: '#4CAF50',
        }).setOrigin(0.5).setDepth(200).setVisible(false));

        this.uiTexts.set('goScore', this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 15, '', {
            fontFamily: '"Courier New", monospace', fontSize: '16px', color: '#aaaaaa',
        }).setOrigin(0.5).setDepth(200).setVisible(false));

        this.uiTexts.set('goRestart', this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, 'Press R to restart', {
            fontFamily: '"Courier New", monospace', fontSize: '16px', color: '#888888',
        }).setOrigin(0.5).setDepth(200).setVisible(false));
    }

    // ═══════════════════════════════════════════════════════════
    // UPDATE
    // ═══════════════════════════════════════════════════════════
    update(_time: number, delta: number) {
        const dt = delta / 1000;
        this.gfx.clear();

        // Draw world
        this.drawBackground();
        this.drawPlatforms();
        this.drawBlocks();

        if (!this.gameOver) {
            this.handleInput();
            this.updateChar(this.player, dt);
            this.updateAI(dt);
            this.updateChar(this.ai, dt);
            this.updateProjectiles(dt);
            this.updateParticles(dt);
            this.updateCameraShake();
        }

        this.drawCharacter(this.player, true);
        this.drawCharacter(this.ai, false);
        this.drawProjectiles();
        this.drawParticles();
        this.drawTrajectoryPreview();
        this.drawBlockCursor();
        this.updateUITexts();
    }

    // ─── Input ───────────────────────────────────────────────
    private handleInput() {
        if (this.keyA.isDown) { this.player.velX = -MOVE_SPEED; this.player.facingRight = false; }
        if (this.keyD.isDown) { this.player.velX = MOVE_SPEED; this.player.facingRight = true; }
        if (this.keyW.isDown && this.player.onGround) { this.player.velY = JUMP_FORCE; }
        this.player.crouching = this.keyS.isDown;
    }

    // ─── Character Physics ──────────────────────────────────
    private updateChar(c: CharacterState, dt: number) {
        c.velY += GRAVITY * dt;
        c.x += c.velX * dt;
        c.y += c.velY * dt;

        c.onGround = false;
        for (const p of PLATFORMS) {
            if (p.side === c.side || p.height > 50) {
                if (c.x < p.x + p.width && c.x + c.width > p.x &&
                    c.y + c.height >= p.y && c.y + c.height <= p.y + p.height + c.velY * dt + 5) {
                    if (c.velY > 0) { c.y = p.y - c.height; c.velY = 0; c.onGround = true; }
                }
            }
        }
        for (const b of this.blocks) {
            if (c.x < b.x + BLOCK_SIZE && c.x + c.width > b.x &&
                c.y + c.height >= b.y && c.y + c.height <= b.y + BLOCK_SIZE + c.velY * dt + 5) {
                if (c.velY > 0) { c.y = b.y - c.height; c.velY = 0; c.onGround = true; }
            }
        }

        if (c.side === 'left') {
            if (c.x < 0) c.x = 0;
            if (c.x + c.width > 400) c.x = 400 - c.width;
        } else {
            if (c.x < 800) c.x = 800;
            if (c.x + c.width > GAME_WIDTH) c.x = GAME_WIDTH - c.width;
        }

        c.velX *= 0.85;
        c.animTimer++;
        if (c.animTimer > 8) { c.animTimer = 0; c.animFrame = (c.animFrame + 1) % 4; }
    }

    // ─── Shooting ───────────────────────────────────────────
    private shootProjectile(c: CharacterState, angle: number, isPlayer: boolean) {
        const rad = (angle * Math.PI) / 180;
        const dir = isPlayer ? 1 : -1;
        this.projectiles.push({
            x: c.x + (isPlayer ? c.width : 0),
            y: c.y + c.height / 3,
            velX: Math.cos(rad) * PROJECTILE_SPEED * dir,
            velY: -Math.sin(rad) * PROJECTILE_SPEED,
            isPlayerProjectile: isPlayer,
            active: true,
            trail: [],
        });
    }

    private updateProjectiles(dt: number) {
        for (const p of this.projectiles) {
            if (!p.active) continue;
            p.trail.push({ x: p.x, y: p.y, alpha: 1 });
            if (p.trail.length > 15) p.trail.shift();
            p.trail.forEach((t, i) => { t.alpha = i / p.trail.length; });

            p.velY += GRAVITY * 0.5 * dt;
            p.x += p.velX * dt;
            p.y += p.velY * dt;

            if (p.x < -50 || p.x > GAME_WIDTH + 50 || p.y > GAME_HEIGHT + 50) { p.active = false; continue; }

            // Platform collision
            for (const plat of PLATFORMS) {
                if (p.x > plat.x && p.x < plat.x + plat.width && p.y > plat.y && p.y < plat.y + plat.height) {
                    p.active = false; this.spawnParticles(p.x, p.y, 0xffeb3b); break;
                }
            }
            if (!p.active) continue;

            // Block collision
            for (let i = this.blocks.length - 1; i >= 0; i--) {
                const b = this.blocks[i];
                if (p.x > b.x && p.x < b.x + BLOCK_SIZE && p.y > b.y && p.y < b.y + BLOCK_SIZE) {
                    p.active = false;
                    b.hp -= DAMAGE;
                    this.spawnParticles(p.x, p.y, ELEMENTS[b.element].color);
                    if (b.hp <= 0) {
                        if (ELEMENTS[b.element].special === 'explode') this.createExplosion(b.x + BLOCK_SIZE / 2, b.y + BLOCK_SIZE / 2);
                        this.blocks.splice(i, 1);
                    }
                    break;
                }
            }
            if (!p.active) continue;

            // Character collision
            const target = p.isPlayerProjectile ? this.ai : this.player;
            if (p.x > target.x && p.x < target.x + target.width && p.y > target.y && p.y < target.y + target.height) {
                this.takeDamage(target, DAMAGE); p.active = false;
            }
        }
        this.projectiles = this.projectiles.filter(pp => pp.active);
    }

    // ─── Block Placement ───────────────────────────────────
    private placeBlock() {
        const elem = ELEMENTS[this.selectedElement];
        if (this.player.inventory[this.selectedElement] <= 0) return;

        let bx: number, by: number;
        if (this.buildMode) {
            // Use cursor position
            bx = this.cursorGridX * BLOCK_SIZE;
            by = this.cursorGridY * BLOCK_SIZE;
        } else {
            // Legacy: place in front of player
            bx = this.player.facingRight
                ? Math.floor((this.player.x + this.player.width) / BLOCK_SIZE) * BLOCK_SIZE
                : Math.floor((this.player.x - BLOCK_SIZE) / BLOCK_SIZE) * BLOCK_SIZE;
            by = Math.floor((this.player.y + this.player.height - BLOCK_SIZE) / BLOCK_SIZE) * BLOCK_SIZE;
        }

        if (bx < 0 || bx > 400 - BLOCK_SIZE) return;
        if (by < 0 || by > GAME_HEIGHT - BLOCK_SIZE) return;
        for (const b of this.blocks) { if (b.x === bx && b.y === by) return; }
        this.blocks.push({ x: bx, y: by, element: this.selectedElement, hp: elem.hp, maxHp: elem.hp, side: 'left' });
        this.player.inventory[this.selectedElement]--;
    }

    // ─── Damage ─────────────────────────────────────────────
    private takeDamage(c: CharacterState, amount: number) {
        c.health -= amount;
        if (c.health <= 0) {
            c.health = 0;
            this.gameOver = true;
            this.winner = c.side === 'left' ? 'AI WINS' : 'PLAYER WINS';
            this.onGameOver?.(this.winner, this.player.health, this.ai.health);
        }
        this.cameraShakeIntensity = 8;
        this.spawnParticles(c.x + c.width / 2, c.y + c.height / 2, c.side === 'left' ? 0x4caf50 : 0xf44336);
    }

    private createExplosion(cx: number, cy: number) {
        const radius = 80;
        for (const c of [this.player, this.ai]) {
            const dx = (c.x + c.width / 2) - cx;
            const dy = (c.y + c.height / 2) - cy;
            if (Math.sqrt(dx * dx + dy * dy) < radius) this.takeDamage(c, 20);
        }
        for (let i = 0; i < 40; i++) {
            this.particles.push({
                x: cx, y: cy,
                velX: (Math.random() - 0.5) * 600, velY: (Math.random() - 0.5) * 600,
                color: Math.random() > 0.5 ? 0x44cc44 : 0xffeb3b,
                size: Math.random() * 8 + 3, life: 1, decay: Math.random() * 0.02 + 0.015,
            });
        }
    }

    private endByTimer() {
        this.gameOver = true;
        if (this.player.health > this.ai.health) this.winner = 'PLAYER WINS';
        else if (this.ai.health > this.player.health) this.winner = 'AI WINS';
        else this.winner = 'DRAW';
        this.onGameOver?.(this.winner, this.player.health, this.ai.health);
    }

    // ─── Particles ──────────────────────────────────────────
    private spawnParticles(x: number, y: number, color: number) {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x, y,
                velX: (Math.random() - 0.5) * 300, velY: (Math.random() - 0.5) * 300,
                color, size: Math.random() * 5 + 2, life: 1, decay: Math.random() * 0.03 + 0.02,
            });
        }
    }

    private updateParticles(dt: number) {
        for (const p of this.particles) {
            p.x += p.velX * dt;
            p.y += p.velY * dt;
            p.velY += GRAVITY * 0.3 * dt;
            p.life -= p.decay;
        }
        this.particles = this.particles.filter(p => p.life > 0);
    }

    // ─── Camera Shake ──────────────────────────────────────
    private updateCameraShake() {
        if (this.cameraShakeIntensity > 0) {
            this.cameraShakeX = (Math.random() - 0.5) * this.cameraShakeIntensity;
            this.cameraShakeY = (Math.random() - 0.5) * this.cameraShakeIntensity;
            this.cameraShakeIntensity *= 0.9;
            if (this.cameraShakeIntensity < 0.5) {
                this.cameraShakeIntensity = 0;
                this.cameraShakeX = 0;
                this.cameraShakeY = 0;
            }
        }
        this.cameras.main.setScroll(-this.cameraShakeX, -this.cameraShakeY);
    }

    // ─── AI ─────────────────────────────────────────────────
    private updateAI(dt: number) {
        if (this.gameOver) return;
        const a = this.ai;
        a.aiTimer++;
        a.aiShootTimer++;

        const cvx = this.player.x - this.aiLastPlayerX;
        this.playerVelocityHistory.push({ vx: cvx, vy: this.player.y - this.aiLastPlayerY });
        if (this.playerVelocityHistory.length > 30) this.playerVelocityHistory.shift();
        let avgVx = 0;
        for (const v of this.playerVelocityHistory) avgVx += v.vx;
        avgVx /= this.playerVelocityHistory.length;
        this.aiLastPlayerX = this.player.x;
        this.aiLastPlayerY = this.player.y;

        const hr = a.health / Math.max(this.player.health, 1);
        const cd = hr < 0.5 ? 50 : hr < 0.8 ? 80 : 110;

        if (a.aiShootTimer > cd) {
            let bestAngle = 45, bestScore = -Infinity, foundHit = false;
            const preds = [
                { x: this.player.x, y: this.player.y },
                { x: this.player.x + avgVx * 12, y: Math.min(this.player.y, 490) },
            ];
            for (let ang = 15; ang <= 75; ang += 2) {
                for (const pr of preds) {
                    const px = Math.max(0, Math.min(360, pr.x));
                    const py = Math.max(100, Math.min(490, pr.y));
                    const r = this.simShot(a.x, a.y + a.height / 3, ang, px, py, this.player.width, this.player.height);
                    if (r.hit) {
                        const s = 1000 - r.frame;
                        if (s > bestScore) { bestScore = s; bestAngle = ang; foundHit = true; }
                    } else if (!foundHit) {
                        const s = -r.dist;
                        if (s > bestScore) { bestScore = s; bestAngle = ang; }
                    }
                }
            }
            this.shootProjectile(a, bestAngle + (Math.random() - 0.5) * 15, false);
            a.aiShootTimer = 0;
        }

        if (a.aiTimer > 50) {
            a.aiTimer = 0;
            const r = Math.random();
            if (r < 0.4) a.velX = MOVE_SPEED * 0.7;
            else if (r < 0.8) a.velX = -MOVE_SPEED * 0.7;
            else a.velX = 0;
            if (a.onGround && Math.random() < 0.15) a.velY = JUMP_FORCE;
        }
        if (a.x < 820) a.velX = MOVE_SPEED * 0.7;
        else if (a.x > 1130) a.velX = -MOVE_SPEED * 0.7;
        a.facingRight = false;
    }

    private simShot(sx: number, sy: number, angle: number, tx: number, ty: number, tw: number, th: number) {
        const rad = (angle * Math.PI) / 180;
        const step = 1 / 60;
        let x = sx, y = sy;
        let vx = -Math.cos(rad) * PROJECTILE_SPEED * step;
        let vy = -Math.sin(rad) * PROJECTILE_SPEED * step;
        const g = GRAVITY * 0.5 * step * step;
        let best = Infinity, bf = -1;

        for (let f = 0; f < 120; f++) {
            vy += g; x += vx; y += vy;
            if (x >= tx && x <= tx + tw && y >= ty && y <= ty + th) return { hit: true, frame: f, dist: 0 };
            const d = Math.sqrt((x - tx - tw / 2) ** 2 + (y - ty - th / 2) ** 2);
            if (d < best) { best = d; bf = f; }
            if (y > 560 || x < -50) return { hit: false, dist: best, frame: bf };
        }
        return { hit: false, dist: best, frame: bf };
    }

    // ═══════════════════════════════════════════════════════════
    // DRAWING (Phaser Graphics)
    // ═══════════════════════════════════════════════════════════

    private drawBackground() {
        const g = this.gfx;
        // Sky gradient (simulated with horizontal bands)
        const bands = 20;
        for (let i = 0; i < bands; i++) {
            const t = i / bands;
            const r = Math.floor(13 * (1 - t) + 10 * t);
            const gr = Math.floor(13 * (1 - t) + 22 * t);
            const b = Math.floor(26 * (1 - t) + 40 * t);
            const color = (r << 16) | (gr << 8) | b;
            g.fillStyle(color);
            g.fillRect(0, (i / bands) * GAME_HEIGHT, GAME_WIDTH, GAME_HEIGHT / bands + 1);
        }

        // Stars
        for (let i = 0; i < 60; i++) {
            const sx = (i * 73 + 11) % GAME_WIDTH;
            const sy = (i * 37 + 7) % 350;
            const sz = (i % 3) + 0.5;
            g.fillStyle(0xffffff, 0.2 + (i % 5) * 0.12);
            g.fillCircle(sx, sy, sz);
        }

        // Moon
        g.fillStyle(0xe8e8e8);
        g.fillCircle(1050, 80, 35);
        g.fillStyle(0xcccccc);
        g.fillCircle(1040, 75, 6);
        g.fillCircle(1058, 88, 4);
    }

    private drawPlatforms() {
        const g = this.gfx;
        for (const p of PLATFORMS) {
            if (p.height > 50) {
                g.fillStyle(0x2d3748);
                g.fillRect(p.x, p.y, p.width, p.height);
                g.fillStyle(0x48bb78);
                g.fillRect(p.x, p.y, p.width, 6);
            } else {
                g.fillStyle(0x5a6577);
                g.fillRect(p.x, p.y, p.width, p.height);
            }
            g.lineStyle(1, 0xa0aec0, 0.5);
            g.strokeRect(p.x, p.y, p.width, p.height);
        }

        // Gap
        g.fillStyle(0x060610);
        g.fillRect(400, 550, 400, 150);

        // Lava spikes
        for (let i = 0; i < 10; i++) {
            g.fillStyle(i % 2 === 0 ? 0xf44336 : 0xff9800);
            g.fillTriangle(400 + i * 40, 700, 420 + i * 40, 675, 440 + i * 40, 700);
        }
    }

    private drawBlocks() {
        const g = this.gfx;
        for (const b of this.blocks) {
            const elem = ELEMENTS[b.element];
            const hpR = b.hp / b.maxHp;
            g.fillStyle(elem.color, 0.5 + hpR * 0.5);
            g.fillRect(b.x, b.y, BLOCK_SIZE, BLOCK_SIZE);
            g.lineStyle(2, hpR > 0.5 ? 0xffffff : 0xff0000, hpR > 0.5 ? 0.25 : 0.5);
            g.strokeRect(b.x, b.y, BLOCK_SIZE, BLOCK_SIZE);
        }
        // Block element text rendered separately via dynamic text
        // (kept simple - blocks show via color)
    }

    private drawCharacter(c: CharacterState, isPlayer: boolean) {
        const g = this.gfx;
        const cx = c.x + c.width / 2;
        const h = c.crouching ? c.height * 0.6 : c.height;
        const baseY = c.y + c.height;
        const color = isPlayer ? 0x4caf50 : 0xf44336;
        const dark = isPlayer ? 0x388e3c : 0xc62828;

        // Head
        g.fillStyle(color);
        g.fillCircle(cx, baseY - h + 12, 12);
        g.lineStyle(2, dark);
        g.strokeCircle(cx, baseY - h + 12, 12);

        // Eyes
        const eo = c.facingRight ? 3 : -3;
        g.fillStyle(0xffffff);
        g.fillCircle(cx + eo, baseY - h + 10, 3);
        g.fillStyle(0x000000);
        g.fillCircle(cx + eo + (c.facingRight ? 1 : -1), baseY - h + 10, 1.5);

        // Body
        g.lineStyle(6, color);
        g.lineBetween(cx, baseY - h + 24, cx, baseY - 20);

        // Arms
        const aw = Math.abs(c.velX) > 10 ? Math.sin(c.animFrame * 0.8) * 5 : 0;
        g.lineBetween(cx - 15, baseY - h + 35 + aw, cx, baseY - h + 30);
        g.lineBetween(cx, baseY - h + 30, cx + 15, baseY - h + 35 - aw);

        // Legs
        const ls = Math.abs(c.velX) > 10 ? Math.sin(c.animFrame) * 8 : 0;
        g.lineBetween(cx, baseY - 20, cx - 10 - ls, baseY - 5);
        g.lineBetween(cx, baseY - 20, cx + 10 + ls, baseY - 5);
    }

    private drawProjectiles() {
        const g = this.gfx;
        for (const p of this.projectiles) {
            // Trail
            for (const t of p.trail) {
                g.fillStyle(p.isPlayerProjectile ? 0x4caf50 : 0xf44336, t.alpha * 0.5);
                g.fillCircle(t.x, t.y, 5 * t.alpha);
            }
            // Ball
            g.fillStyle(0xffffff);
            g.fillCircle(p.x, p.y, 4);
            g.fillStyle(p.isPlayerProjectile ? 0x4caf50 : 0xf44336);
            g.fillCircle(p.x, p.y, 7);
            g.fillStyle(0xffffff, 0.7);
            g.fillCircle(p.x - 2, p.y - 2, 2);
        }
    }

    private drawParticles() {
        const g = this.gfx;
        for (const p of this.particles) {
            g.fillStyle(p.color, Math.max(0, p.life));
            g.fillCircle(p.x, p.y, Math.max(0.1, p.size * p.life));
        }
    }

    private drawTrajectoryPreview() {
        if (this.angleInput.length === 0 || this.gameOver) return;
        const angle = parseInt(this.angleInput);
        if (isNaN(angle) || angle < 0 || angle > 90) return;

        const g = this.gfx;
        const startX = this.player.x + this.player.width;
        const startY = this.player.y + this.player.height / 3;
        const rad = (angle * Math.PI) / 180;
        const step = 1 / 60;
        let vx = Math.cos(rad) * PROJECTILE_SPEED * step;
        let vy = -Math.sin(rad) * PROJECTILE_SPEED * step;
        const grav = GRAVITY * 0.5 * step * step;

        let px = startX, py = startY;
        g.lineStyle(2, 0x4caf50, 0.3);

        for (let i = 0; i < 40; i++) {
            vy += grav;
            const nx = px + vx;
            const ny = py + vy;
            if (i % 2 === 0) g.lineBetween(px, py, nx, ny);
            px = nx; py = ny;
            if (py > GAME_HEIGHT) break;
        }

        // Endpoint dot
        g.fillStyle(0x4caf50, 0.5);
        g.fillCircle(px, py, 4);
    }

    // ─── Block Cursor Drawing ─────────────────────────────
    private drawBlockCursor() {
        if (!this.buildMode || this.gameOver) return;
        const g = this.gfx;
        const bx = this.cursorGridX * BLOCK_SIZE;
        const by = this.cursorGridY * BLOCK_SIZE;
        const elem = ELEMENTS[this.selectedElement];

        // Pulsing animation
        this.cursorBlink += 0.06;
        const alpha = 0.3 + Math.sin(this.cursorBlink) * 0.2;

        // Cursor fill
        g.fillStyle(elem.color, alpha);
        g.fillRect(bx, by, BLOCK_SIZE, BLOCK_SIZE);

        // Cursor border (bright pulsing)
        g.lineStyle(2, 0xffffff, 0.5 + Math.sin(this.cursorBlink) * 0.3);
        g.strokeRect(bx, by, BLOCK_SIZE, BLOCK_SIZE);

        // Crosshair lines
        g.lineStyle(1, 0xffffff, 0.2);
        g.lineBetween(bx + BLOCK_SIZE / 2, by, bx + BLOCK_SIZE / 2, by + BLOCK_SIZE);
        g.lineBetween(bx, by + BLOCK_SIZE / 2, bx + BLOCK_SIZE, by + BLOCK_SIZE / 2);

        // "BUILD MODE" indicator
        g.fillStyle(0x000000, 0.7);
        g.fillRect(GAME_WIDTH / 2 - 60, 92, 120, 22);
        g.lineStyle(1, 0xffeb3b, 0.8);
        g.strokeRect(GAME_WIDTH / 2 - 60, 92, 120, 22);
    }

    // ─── UI Updates ─────────────────────────────────────────
    private updateUITexts() {
        const g = this.gfx;

        // Player HP bar
        g.fillStyle(0x222222); g.fillRect(20, 18, 200, 22);
        g.fillStyle(0x4caf50); g.fillRect(22, 20, (this.player.health / MAX_HEALTH) * 196, 18);
        g.lineStyle(1, 0xaaaaaa); g.strokeRect(20, 18, 200, 22);

        // AI HP bar
        g.fillStyle(0x222222); g.fillRect(GAME_WIDTH - 220, 18, 200, 22);
        g.fillStyle(0xf44336); g.fillRect(GAME_WIDTH - 218, 20, (this.ai.health / MAX_HEALTH) * 196, 18);
        g.lineStyle(1, 0xaaaaaa); g.strokeRect(GAME_WIDTH - 220, 18, 200, 22);

        // Timer bg
        g.fillStyle(0x000000, 0.7); g.fillRect(GAME_WIDTH / 2 - 45, 10, 90, 30);
        g.lineStyle(2, this.matchTimer < 60 ? 0xf44336 : 0x4caf50);
        g.strokeRect(GAME_WIDTH / 2 - 45, 10, 90, 30);

        // Angle bg
        g.fillStyle(0x000000, 0.7); g.fillRect(GAME_WIDTH / 2 - 70, 46, 140, 40);
        g.lineStyle(1, 0x4caf50, 0.5); g.strokeRect(GAME_WIDTH / 2 - 70, 46, 140, 40);

        // Instructions bg
        g.fillStyle(0x000000, 0.6); g.fillRect(15, GAME_HEIGHT - 92, 280, 80);

        // Element panel bg
        g.fillStyle(0x000000, 0.7); g.fillRect(GAME_WIDTH - 280, GAME_HEIGHT - 78, 270, 60);

        // Element boxes
        ELEMENT_KEYS.forEach((key, i) => {
            const elem = ELEMENTS[key];
            const ex = GAME_WIDTH - 275 + i * 65;
            const ey = GAME_HEIGHT - 55;
            const isSel = key === this.selectedElement;
            g.fillStyle(isSel ? elem.color : 0x333333);
            g.fillRect(ex, ey, 55, 30);
            g.lineStyle(isSel ? 2 : 1, isSel ? 0xffffff : 0x555555);
            g.strokeRect(ex, ey, 55, 30);
        });

        // Update text content
        this.uiTexts.get('playerHp')!.setText(`${this.player.health}`);
        this.uiTexts.get('aiHp')!.setText(`${this.ai.health}`);

        const mins = Math.floor(this.matchTimer / 60);
        const secs = this.matchTimer % 60;
        const timerText = this.uiTexts.get('timer')!;
        timerText.setText(`${mins}:${secs.toString().padStart(2, '0')}`);
        timerText.setColor(this.matchTimer < 60 ? '#f44336' : '#ffffff');

        this.uiTexts.get('angleValue')!.setText(this.angleInput || '___');

        // Element counts
        ELEMENT_KEYS.forEach((key) => {
            this.uiTexts.get(`elemCount_${key}`)!.setText(`×${this.player.inventory[key]}`);
        });

        // Build mode text (created once, shown/hidden)
        if (!this.uiTexts.has('buildMode')) {
            this.uiTexts.set('buildMode', this.add.text(GAME_WIDTH / 2, 103, 'BUILD MODE', {
                fontFamily: '"Courier New", monospace', fontSize: '11px', fontStyle: 'bold', color: '#ffeb3b',
            }).setOrigin(0.5).setDepth(100));
        }
        this.uiTexts.get('buildMode')!.setVisible(this.buildMode && !this.gameOver);

        // Game over overlay
        if (this.gameOver) {
            g.fillStyle(0x000000, 0.8);
            g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

            const goTitle = this.uiTexts.get('goTitle')!;
            goTitle.setVisible(true);
            if (this.winner.includes('PLAYER')) {
                goTitle.setText('YOU WIN!').setColor('#4CAF50');
            } else if (this.winner === 'DRAW') {
                goTitle.setText('DRAW!').setColor('#ffeb3b');
            } else {
                goTitle.setText('GAME OVER').setColor('#f44336');
            }

            const goScore = this.uiTexts.get('goScore')!;
            goScore.setVisible(true).setText(`Player HP: ${this.player.health}  |  AI HP: ${this.ai.health}`);

            this.uiTexts.get('goRestart')!.setVisible(true);
        }
    }
}
