// Game constants
export const GAME_WIDTH = 1600;
export const GAME_HEIGHT = 900;

export const LEFT_ZONE_WIDTH = 520;
export const CENTER_GAP_WIDTH = 560;
export const RIGHT_ZONE_START = LEFT_ZONE_WIDTH + CENTER_GAP_WIDTH;
export const GROUND_Y = 700;
export const GROUND_HEIGHT = 200;

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
    { x: 0, y: GROUND_Y, width: LEFT_ZONE_WIDTH, height: GROUND_HEIGHT, side: 'left' },
    // Left floating platforms
    { x: 70, y: 580, width: 130, height: 22, side: 'left' },
    { x: 240, y: 500, width: 150, height: 22, side: 'left' },
    { x: 100, y: 410, width: 130, height: 22, side: 'left' },
    { x: 300, y: 320, width: 130, height: 22, side: 'left' },

    // Right island ground
    { x: RIGHT_ZONE_START, y: GROUND_Y, width: LEFT_ZONE_WIDTH, height: GROUND_HEIGHT, side: 'right' },
    // Right floating platforms
    { x: 1410, y: 580, width: 130, height: 22, side: 'right' },
    { x: 1210, y: 500, width: 150, height: 22, side: 'right' },
    { x: 1370, y: 410, width: 130, height: 22, side: 'right' },
    { x: 1170, y: 320, width: 130, height: 22, side: 'right' },
];
