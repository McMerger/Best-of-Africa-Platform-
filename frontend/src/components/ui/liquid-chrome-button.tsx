import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface LiquidChromeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    text?: string;
    children?: React.ReactNode;
}

export const LiquidChromeButton: React.FC<LiquidChromeButtonProps> = ({ className, text, children, ...props }) => {
    const [hovered, setHover] = useState(false);

    return (
        <div
            className={cn("relative inline-block group", className)}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            {/* Shimmer border glow */}
            <div
                className="absolute -inset-[2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"
                style={{
                    background: 'linear-gradient(90deg, #D4AF37, #f0f0f0, #D4AF37, #f0f0f0)',
                    backgroundSize: '300% 100%',
                    animation: hovered ? 'chrome-shimmer 2s linear infinite' : 'none',
                }}
            />

            {/* Chrome border ring */}
            <div
                className="absolute -inset-[1px] rounded-full transition-all duration-500"
                style={{
                    background: hovered
                        ? 'linear-gradient(135deg, rgba(212,175,55,0.6), rgba(240,240,240,0.4), rgba(212,175,55,0.6))'
                        : 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(240,240,240,0.1), rgba(212,175,55,0.15))',
                    backgroundSize: '200% 200%',
                    animation: hovered ? 'chrome-flow 3s ease infinite' : 'none',
                }}
            />

            {/* Main button */}
            <button
                className="relative z-10 w-full h-full flex items-center justify-center bg-secondary text-secondary-foreground rounded-full font-bold uppercase tracking-widest text-sm transition-all duration-300 group-hover:bg-secondary/90 shadow-lg group-hover:shadow-xl group-hover:shadow-accent/10"
                {...props}
            >
                {text || children}
            </button>

            {/* CSS keyframes */}
            <style>{`
                @keyframes chrome-shimmer {
                    0% { background-position: 100% 50%; }
                    100% { background-position: -100% 50%; }
                }
                @keyframes chrome-flow {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
            `}</style>
        </div>
    );
};
