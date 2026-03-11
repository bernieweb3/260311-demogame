interface GameOverScreenProps {
    winner: string;
    playerHp: number;
    aiHp: number;
    onPlayAgain: () => void;
    onMainMenu: () => void;
}

export function GameOverScreen({ winner, playerHp, aiHp, onPlayAgain, onMainMenu }: GameOverScreenProps) {
    const isWin = winner.includes('PLAYER');
    const isDraw = winner === 'DRAW';
    const accentColor = isWin ? '#4CAF50' : isDraw ? '#ffeb3b' : '#f44336';

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0d0d1a 0%, #131336 40%, #0a1628 100%)',
            color: '#fff',
            fontFamily: '"Courier New", monospace',
        }}>
            <h1 style={{
                fontSize: '72px',
                fontWeight: 900,
                color: accentColor,
                letterSpacing: '8px',
                marginBottom: '10px',
                textShadow: `0 0 40px ${accentColor}44`,
            }}>
                {isWin ? 'VICTORY' : isDraw ? 'DRAW' : 'DEFEAT'}
            </h1>

            <p style={{ fontSize: '18px', color: '#888', marginBottom: '40px', letterSpacing: '4px' }}>
                {isWin ? 'You dominated the battlefield!' : isDraw ? 'An even match!' : 'Better luck next time!'}
            </p>

            {/* Score Panel */}
            <div style={{
                display: 'flex',
                gap: '60px',
                marginBottom: '50px',
                padding: '30px 50px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.08)',
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#4CAF50', letterSpacing: '3px', marginBottom: '8px' }}>PLAYER</div>
                    <div style={{ fontSize: '48px', fontWeight: 900, color: '#4CAF50' }}>{playerHp}</div>
                    <div style={{ fontSize: '11px', color: '#666' }}>HP REMAINING</div>
                </div>
                <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#f44336', letterSpacing: '3px', marginBottom: '8px' }}>AI</div>
                    <div style={{ fontSize: '48px', fontWeight: 900, color: '#f44336' }}>{aiHp}</div>
                    <div style={{ fontSize: '11px', color: '#666' }}>HP REMAINING</div>
                </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '20px' }}>
                <button
                    onClick={onPlayAgain}
                    style={{
                        padding: '14px 40px',
                        fontSize: '16px',
                        fontFamily: '"Courier New", monospace',
                        fontWeight: 'bold',
                        border: `2px solid ${accentColor}`,
                        borderRadius: '8px',
                        background: `${accentColor}22`,
                        color: accentColor,
                        cursor: 'pointer',
                        letterSpacing: '4px',
                        textTransform: 'uppercase',
                        transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = `${accentColor}44`;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = `${accentColor}22`;
                    }}
                >
                    PLAY AGAIN
                </button>
                <button
                    onClick={onMainMenu}
                    style={{
                        padding: '14px 40px',
                        fontSize: '16px',
                        fontFamily: '"Courier New", monospace',
                        fontWeight: 'bold',
                        border: '2px solid #555',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.03)',
                        color: '#888',
                        cursor: 'pointer',
                        letterSpacing: '4px',
                        textTransform: 'uppercase',
                        transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    }}
                >
                    MAIN MENU
                </button>
            </div>
        </div>
    );
}
