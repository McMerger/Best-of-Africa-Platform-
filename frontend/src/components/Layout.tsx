import React from 'react';
import { NavBar } from './NavBar';
import { Footer } from './Footer';
import { Breadcrumbs } from './Breadcrumbs';
import { InterfaceTranslator } from './InterfaceTranslator';
import { MEMBER_PREVIEW_MODE } from '../config/flags';




interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="flex min-h-screen supports-[min-height:100dvh]:min-h-[100dvh] bg-background text-foreground overflow-x-hidden">
            <InterfaceTranslator />
            <div className="flex-1 flex flex-col min-h-screen min-w-0">
                <NavBar />
                {MEMBER_PREVIEW_MODE && (
                    <div className="border-b border-accent/30 bg-accent/10 px-4 py-2 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-accent-ink">
                        Member preview mode — all subscription content is temporarily open
                    </div>
                )}
                <Breadcrumbs />
                <main className={`flex-1 transition-all duration-300`}>
                    {children}
                </main>
                <Footer />
            </div>
        </div>
    );
};
