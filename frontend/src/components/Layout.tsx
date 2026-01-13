import React from 'react';
import { NavBar } from './NavBar';
import { Footer } from './Footer';
import { Breadcrumbs } from './Breadcrumbs';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <NavBar />
            <Breadcrumbs />
            <main style={{ flex: 1, paddingTop: '40px', animation: 'fadeInPage 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                {children}
            </main>
            <style>{`
                @keyframes fadeInPage {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
            <Footer />
        </div>
    );
};
