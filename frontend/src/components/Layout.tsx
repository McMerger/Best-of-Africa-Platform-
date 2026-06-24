import React from 'react';
import { NavBar } from './NavBar';
import { Footer } from './Footer';
import { Breadcrumbs } from './Breadcrumbs';
import { WorldCupBanner } from './WorldCupBanner';




interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="flex min-h-screen supports-[min-height:100dvh]:min-h-[100dvh] bg-background text-foreground overflow-x-hidden">
            <div className="flex-1 flex flex-col min-h-screen min-w-0">
                <WorldCupBanner />
                <NavBar />
                <Breadcrumbs />
                <main className={`flex-1 transition-all duration-300`}>
                    {children}
                </main>
                <Footer />
            </div>
        </div>
    );
};
