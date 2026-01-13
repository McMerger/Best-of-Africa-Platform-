import React from 'react';
import { Loader2 } from 'lucide-react';

export const CinematicLoader: React.FC = () => {
    return (
        <div className="flex h-[60vh] flex-col items-center justify-center p-8">
            <div className="relative mb-8">
                <div className="absolute inset-0 animate-ping rounded-full bg-primary/20 duration-1000"></div>
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-background border-2 border-primary shadow-2xl">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
            <h2 className="mb-2 text-xl font-black uppercase tracking-[0.2em] text-foreground animate-pulse">
                Initializing Intelligence
            </h2>
            <p className="text-sm font-bold text-muted-foreground">
                Decryption Handshake...
            </p>
        </div>
    );
};
