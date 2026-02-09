import React from 'react';
import { useDensity } from '@/context/DensityContext';
import { Button } from '@/components/ui/button';
import { PaddingIcon, TextAlignJustifyIcon } from '@radix-ui/react-icons';

export const DensityToggle: React.FC = () => {
    const { density, toggleDensity } = useDensity();

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleDensity}
            className="w-9 h-9 rounded-full text-muted-foreground hover:text-foreground"
            title={`Current Density: ${density}`}
        >
            {density === 'comfortable' ? (
                <PaddingIcon className="h-4 w-4" />
            ) : (
                <TextAlignJustifyIcon className="h-4 w-4" />
            )}
        </Button>
    );
};
