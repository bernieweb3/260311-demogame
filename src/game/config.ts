// Game constants
export const GAME_WIDTH = 1200;
export const GAME_HEIGHT = 700;

export const GRAVITY = 800;
export const JUMP_FORCE = -450;
export const MOVE_SPEED = 200;
export const PROJECTILE_SPEED = 550;
export const MAX_HEALTH = 100;
export const DAMAGE = 15;
export const BLOCK_SIZE = 32;
export const MATCH_DURATION = 300; // 5 minutes in seconds

export const TEAM_COLORS = {
    A: { primary: 0x4caf50, dark: 0x388e3c, hex: '#4CAF50' },
    B: { primary: 0xf44336, dark: 0xc62828, hex: '#f44336' },
};

// Platform definitions
export interface PlatformDef {
    x: number;
    y: number;
    width: number;
    height: number;
    side: 'left' | 'right';
}

export const PLATFORMS: PlatformDef[] = [
    // Left island ground
    { x: 0, y: 550, width: 400, height: 150, side: 'left' },
    // Left floating platforms
    { x: 50, y: 450, width: 100, height: 20, side: 'left' },
    { x: 200, y: 380, width: 120, height: 20, side: 'left' },
    { x: 80, y: 300, width: 100, height: 20, side: 'left' },
    { x: 250, y: 230, width: 100, height: 20, side: 'left' },

    // Right island ground
    { x: 800, y: 550, width: 400, height: 150, side: 'right' },
    // Right floating platforms
    { x: 1050, y: 450, width: 100, height: 20, side: 'right' },
    { x: 880, y: 380, width: 120, height: 20, side: 'right' },
    { x: 1020, y: 300, width: 100, height: 20, side: 'right' },
    { x: 850, y: 230, width: 100, height: 20, side: 'right' },
];
