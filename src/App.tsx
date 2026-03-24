import { useState, useCallback, useEffect } from 'react';
import { MainMenu } from './components/MainMenu';
import { GameCanvas } from './components/GameCanvas';
import { GameOverScreen } from './components/GameOverScreen';
import { ElementLoadoutScreen } from './components/ElementLoadoutScreen.tsx';
import type { SelectedLoadoutItem } from './components/ElementLoadoutScreen.tsx';
import './App.css';

type Screen = 'menu' | 'loadout' | 'game' | 'gameover';

interface GameResult {
    winner: string;
    playerHp: number;
    aiHp: number;
}

function App() {
    const [screen, setScreen] = useState<Screen>('menu');
    const [gameResult, setGameResult] = useState<GameResult | null>(null);
    const [gameKey, setGameKey] = useState(0);
    const [selectedElements, setSelectedElements] = useState<string[]>(['K', 'Fe', 'Br']);
    const [selectedElementImageUrls, setSelectedElementImageUrls] = useState<Record<string, string>>({});
    const [isFullscreen, setIsFullscreen] = useState(false);

    const handleStartGame = useCallback(() => {
        setScreen('loadout');
    }, []);

    const handleStartWithLoadout = useCallback((elements: SelectedLoadoutItem[]) => {
        setSelectedElements(elements.map((item) => item.symbol));
        setSelectedElementImageUrls(
            elements.reduce<Record<string, string>>((acc, item) => {
                if (item.imageUrl) {
                    acc[item.symbol] = item.imageUrl;
                }
                return acc;
            }, {})
        );
        setGameKey((k) => k + 1);
        setScreen('game');
    }, []);

    const handleGameOver = useCallback((winner: string, playerHp: number, aiHp: number) => {
        setGameResult({ winner, playerHp, aiHp });
        // Short delay before showing game over screen
        setTimeout(() => setScreen('gameover'), 1500);
    }, []);

    const handlePlayAgain = useCallback(() => {
        setGameKey((k) => k + 1);
        setScreen('game');
    }, []);

    const handleMainMenu = useCallback(() => {
        setScreen('menu');
    }, []);

    const handleToggleFullscreen = useCallback(async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
                setIsFullscreen(true);
            } else {
                await document.exitFullscreen();
                setIsFullscreen(false);
            }
        } catch {
            // Ignore fullscreen errors on unsupported/blocked contexts.
        }
    }, []);

    const handleExitGame = useCallback(() => {
        setScreen('menu');
    }, []);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(Boolean(document.fullscreenElement));
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    return (
        <div className="app-root">
            {screen === 'menu' && <MainMenu onStartGame={handleStartGame} />}
            {screen === 'loadout' && (
                <ElementLoadoutScreen
                    onStartGame={handleStartWithLoadout}
                    onBack={() => setScreen('menu')}
                />
            )}
            {screen === 'game' && (
                <div className="game-container full-viewport">
                    <div className="game-controls">
                        <button className="game-control-btn" onClick={handleToggleFullscreen}>
                            {isFullscreen ? 'Thoat toan man hinh' : 'Toan man hinh'}
                        </button>
                        <button className="game-control-btn exit" onClick={handleExitGame}>
                            Thoat game
                        </button>
                    </div>
                    <GameCanvas
                        key={gameKey}
                        onGameOver={handleGameOver}
                        selectedElements={selectedElements}
                        selectedElementImageUrls={selectedElementImageUrls}
                        fullViewport
                    />
                </div>
            )}
            {screen === 'gameover' && gameResult && (
                <GameOverScreen
                    winner={gameResult.winner}
                    playerHp={gameResult.playerHp}
                    aiHp={gameResult.aiHp}
                    onPlayAgain={handlePlayAgain}
                    onMainMenu={handleMainMenu}
                />
            )}
        </div>
    );
}

export default App;
