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
            <main style={{ flex: 1, paddingTop: '40px' }}>
                {children}
            </main>
            <Footer />
        </div>
    );
};
