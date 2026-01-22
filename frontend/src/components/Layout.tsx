import React from 'react';
import { NavBar } from './NavBar';
import { Footer } from './Footer';
import { Breadcrumbs } from './Breadcrumbs';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
            <NavBar />
            <Breadcrumbs />
            <main className="flex-1 pt-10">
                {children}
            </main>
            <Footer />
        </div>
    );
};
