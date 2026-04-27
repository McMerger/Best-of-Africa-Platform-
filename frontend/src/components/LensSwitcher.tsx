import React from 'react';
import { useLens } from '../context/LensContext';
import type { IntelligenceLens } from '../types';

const LENS_CONFIG: Record<IntelligenceLens, {
    icon: string;
    label: string;
    activeClasses: string;
    activeTextClass: string;
}> = {
    investor: {
        icon: '📊',
        label: 'Investor',
        activeClasses: 'bg-emerald-500/15 outline outline-1 outline-emerald-500/40',
        activeTextClass: 'text-emerald-500',
    },
    government: {
        icon: '🏛️',
        label: 'Government',
        activeClasses: 'bg-indigo-500/15 outline outline-1 outline-indigo-500/40',
        activeTextClass: 'text-indigo-500',
    },
    explorer: {
        icon: '🧭',
        label: 'Explorer',
        activeClasses: 'bg-amber-500/15 outline outline-1 outline-amber-500/40',
        activeTextClass: 'text-amber-500',
    },
};

export const LensSwitcher: React.FC = () => {
    const { lens, setLens } = useLens();

    return (
        <div className="flex gap-0.5 bg-muted/50 rounded-[10px] p-0.5 border border-border/30">
            {(Object.keys(LENS_CONFIG) as IntelligenceLens[]).map((key) => {
                const config = LENS_CONFIG[key];
                const isActive = lens === key;
                return (
                    <button
                        key={key}
                        onClick={() => setLens(key)}
                        aria-label={`Switch to ${config.label} lens`}
                        aria-pressed={isActive}
                        className={[
                            'flex items-center gap-1.5 px-2.5 py-1 rounded-lg border-none cursor-pointer text-xs transition-all duration-200 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            isActive
                                ? `${config.activeClasses} ${config.activeTextClass} font-semibold`
                                : 'bg-transparent text-muted-foreground hover:text-foreground font-normal',
                        ].join(' ')}
                    >
                        <span className="text-sm" aria-hidden="true">{config.icon}</span>
                        <span>{config.label}</span>
                    </button>
                );
            })}
        </div>
    );
};
