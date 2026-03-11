interface MainMenuProps {
    onStartGame: () => void;
}

export function MainMenu({ onStartGame }: MainMenuProps) {
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
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Background particles */}
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: 'radial-gradient(circle at 30% 20%, rgba(76,175,80,0.05) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(244,67,54,0.05) 0%, transparent 50%)',
            }} />

            {/* Title */}
            <h1 style={{
                fontSize: '120px',
                fontWeight: 900,
                letterSpacing: '20px',
                margin: 0,
                background: 'linear-gradient(135deg, #4CAF50, #8BC34A, #4CAF50)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: 'none',
                filter: 'drop-shadow(0 0 30px rgba(76,175,80,0.3))',
                animation: 'pulse 3s ease-in-out infinite',
            }}>
                BIT
            </h1>

            <p style={{
                fontSize: '16px',
                color: '#888',
                letterSpacing: '8px',
                textTransform: 'uppercase',
                marginTop: '-10px',
                marginBottom: '50px',
            }}>
                Tactical Shooter
            </p>

            {/* Mode Selection */}
            <div style={{
                display: 'flex',
                gap: '16px',
                marginBottom: '40px',
            }}>
                {[
                    { label: '1 vs 1', active: true },
                    { label: '2 vs 2', active: false },
                    { label: '3 vs 3', active: false },
                ].map((mode) => (
                    <button
                        key={mode.label}
                        disabled={!mode.active}
                        style={{
                            padding: '12px 24px',
                            fontSize: '14px',
                            fontFamily: '"Courier New", monospace',
                            fontWeight: 'bold',
                            border: mode.active ? '2px solid #4CAF50' : '2px solid #333',
                            borderRadius: '8px',
                            background: mode.active ? 'rgba(76,175,80,0.15)' : 'rgba(255,255,255,0.03)',
                            color: mode.active ? '#4CAF50' : '#555',
                            cursor: mode.active ? 'pointer' : 'not-allowed',
                            transition: 'all 0.3s ease',
                            letterSpacing: '2px',
                        }}
                    >
                        {mode.label}
                        {!mode.active && <span style={{ display: 'block', fontSize: '9px', color: '#444', marginTop: '4px' }}>COMING SOON</span>}
                    </button>
                ))}
            </div>

            {/* Start Button */}
            <button
                onClick={onStartGame}
                style={{
                    padding: '18px 60px',
                    fontSize: '20px',
                    fontFamily: '"Courier New", monospace',
                    fontWeight: 'bold',
                    border: '2px solid #4CAF50',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(76,175,80,0.2), rgba(76,175,80,0.05))',
                    color: '#4CAF50',
                    cursor: 'pointer',
                    letterSpacing: '6px',
                    textTransform: 'uppercase',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 0 20px rgba(76,175,80,0.15)',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(76,175,80,0.3)';
                    e.currentTarget.style.boxShadow = '0 0 40px rgba(76,175,80,0.3)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(76,175,80,0.2), rgba(76,175,80,0.05))';
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(76,175,80,0.15)';
                    e.currentTarget.style.transform = 'scale(1)';
                }}
            >
                START BATTLE
            </button>

            {/* Feature highlights */}
            <div style={{
                display: 'flex',
                gap: '40px',
                marginTop: '60px',
                opacity: 0.5,
                fontSize: '11px',
                letterSpacing: '2px',
                textTransform: 'uppercase',
            }}>
                <span>⚛ Element Blocks</span>
                <span>🎯 Arc Physics</span>
                <span>🛡 Tactical Defense</span>
                <span>⏱ 5 Min Rounds</span>
            </div>

            <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
      `}</style>
        </div>
    );
}
