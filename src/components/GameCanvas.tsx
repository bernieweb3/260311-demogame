import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../game/config';
import { BootScene } from '../game/scenes/BootScene';
import { BattleScene } from '../game/scenes/BattleScene';

interface GameCanvasProps {
    onGameOver: (winner: string, playerHp: number, aiHp: number) => void;
    selectedElements: string[];
    selectedElementImageUrls: Record<string, string>;
    fullViewport?: boolean;
}

export function GameCanvas({ onGameOver, selectedElements, selectedElementImageUrls, fullViewport = false }: GameCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const gameRef = useRef<Phaser.Game | null>(null);

    useEffect(() => {
        if (!containerRef.current || gameRef.current) return;

        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.CANVAS,
            width: GAME_WIDTH,
            height: GAME_HEIGHT,
            parent: containerRef.current,
            backgroundColor: '#0d0d1a',
            scene: [BootScene, BattleScene],
            physics: {
                default: 'arcade',
                arcade: { gravity: { x: 0, y: 0 }, debug: false },
            },
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH,
            },
            callbacks: {
                preBoot: (game) => {
                    game.registry.set('selectedElements', selectedElements);
                    game.registry.set('selectedElementImageUrls', selectedElementImageUrls);
                },
            },
        };

        const game = new Phaser.Game(config);
        gameRef.current = game;

        // Pass the onGameOver callback to the BattleScene
        game.events.once('ready', () => {
            const battleScene = game.scene.getScene('BattleScene') as BattleScene;
            if (battleScene) {
                // We'll pass the callback via scene data when it starts
            }
        });

        // Override the boot scene to pass data
        game.scene.start('BootScene');

        // Listen for scene start to pass callback
        game.events.on('step', () => {
            const battle = game.scene.getScene('BattleScene');
            if (battle && battle.scene.isActive()) {
                (battle as any).onGameOver = onGameOver;
            }
        });

        return () => {
            gameRef.current?.destroy(true);
            gameRef.current = null;
        };
    }, [onGameOver, selectedElements, selectedElementImageUrls]);

    return (
        <div
            ref={containerRef}
            style={{
                width: '100%',
                maxWidth: fullViewport ? '100vw' : GAME_WIDTH,
                height: fullViewport ? '100vh' : 'auto',
                aspectRatio: fullViewport ? undefined : `${GAME_WIDTH}/${GAME_HEIGHT}`,
                margin: '0 auto',
                borderRadius: fullViewport ? '0' : '12px',
                overflow: 'hidden',
                boxShadow: '0 0 40px rgba(76, 175, 80, 0.15), 0 0 80px rgba(0,0,0,0.6)',
                border: fullViewport ? '0' : '2px solid rgba(76, 175, 80, 0.2)',
            }}
        />
    );
}
