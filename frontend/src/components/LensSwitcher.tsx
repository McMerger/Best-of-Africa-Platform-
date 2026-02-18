import React from 'react';
import { useLens, type IntelligenceLens } from '../context/LensContext';

const LENS_CONFIG: Record<IntelligenceLens, { icon: string; label: string; color: string }> = {
    investor: { icon: '📊', label: 'Investor', color: '#10b981' },
    government: { icon: '🏛️', label: 'Government', color: '#6366f1' },
    explorer: { icon: '🧭', label: 'Explorer', color: '#f59e0b' },
};

export const LensSwitcher: React.FC = () => {
    const { lens, setLens } = useLens();

    return (
        <div style={{
            display: 'flex',
            gap: '2px',
            background: 'rgba(255,255,255,0.06)',
            borderRadius: '10px',
            padding: '3px',
            border: '1px solid rgba(255,255,255,0.08)',
        }}>
            {(Object.keys(LENS_CONFIG) as IntelligenceLens[]).map((key) => {
                const config = LENS_CONFIG[key];
                const isActive = lens === key;
                return (
                    <button
                        key={key}
                        onClick={() => setLens(key)}
                        title={`Switch to ${config.label} lens`}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '5px 10px',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: isActive ? 600 : 400,
                            background: isActive ? `${config.color}20` : 'transparent',
                            color: isActive ? config.color : 'rgba(255,255,255,0.5)',
                            transition: 'all 0.2s ease',
                            whiteSpace: 'nowrap',
                            outline: isActive ? `1px solid ${config.color}40` : 'none',
                        }}
                    >
                        <span style={{ fontSize: '14px' }}>{config.icon}</span>
                        <span>{config.label}</span>
                    </button>
                );
            })}
        </div>
    );
};
