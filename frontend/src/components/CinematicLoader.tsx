import React from 'react';

export const CinematicLoader: React.FC<{ text?: string }> = ({ text = "LOADING..." }) => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '60vh',
            width: '100%',
            color: '#052962'
        }}>
            <div style={{ position: 'relative', width: '60px', height: '60px', marginBottom: '20px' }}>
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    border: '2px solid #e2e8f0',
                    borderRadius: '50%'
                }}></div>
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    border: '2px solid transparent',
                    borderTopColor: '#052962',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}></div>
                <div style={{
                    position: 'absolute',
                    top: '15px',
                    left: '15px',
                    right: '15px',
                    bottom: '15px',
                    background: '#052962',
                    borderRadius: '50%',
                    animation: 'pulse 1.5s ease-in-out infinite'
                }}></div>
            </div>
            <div style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                animation: 'blink 2s ease-in-out infinite'
            }}>
                {text}
            </div>
            <style>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @keyframes pulse { 0% { transform: scale(0.8); opacity: 0.5; } 50% { transform: scale(1); opacity: 1; } 100% { transform: scale(0.8); opacity: 0.5; } }
                @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
            `}</style>
        </div>
    );
};
