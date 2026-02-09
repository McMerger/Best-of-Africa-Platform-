import React from 'react';
import { NavBar } from './NavBar';
import { Footer } from './Footer';
import { Breadcrumbs } from './Breadcrumbs';

import { Sidebar } from './Sidebar';
import { useDensity } from '@/context/DensityContext';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    const { density } = useDensity();
    const isCompact = density === 'compact';

    return (
        <div className="flex min-h-screen supports-[min-height:100dvh]:min-h-[100dvh] bg-background text-foreground">
            {/* Sidebar (Desktop Only) */}
            <Sidebar />

            <div className="flex-1 flex flex-col min-h-screen">
                <NavBar />
                <Breadcrumbs />
                <main className={`flex-1 transition-all duration-300 ${isCompact ? 'pt-4' : 'pt-10'}`}>
                    {children}
                </main>
                <Footer />
            </div>
        </div>
    );
};
