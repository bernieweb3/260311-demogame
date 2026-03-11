import { useState, useCallback } from 'react';
import { MainMenu } from './components/MainMenu';
import { GameCanvas } from './components/GameCanvas';
import { GameOverScreen } from './components/GameOverScreen';
import './App.css';

type Screen = 'menu' | 'game' | 'gameover';

interface GameResult {
    winner: string;
    playerHp: number;
    aiHp: number;
}

function App() {
    const [screen, setScreen] = useState<Screen>('menu');
    const [gameResult, setGameResult] = useState<GameResult | null>(null);
    const [gameKey, setGameKey] = useState(0);

    const handleStartGame = useCallback(() => {
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

    return (
        <div className="app-root">
            {screen === 'menu' && <MainMenu onStartGame={handleStartGame} />}
            {screen === 'game' && (
                <div className="game-container">
                    <GameCanvas key={gameKey} onGameOver={handleGameOver} />
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
