import React, { createContext, useContext, useEffect, useState } from 'react';

// Supported Languages
export type LanguageCode = 'en' | 'fr' | 'de' | 'ar' | 'hi' | 'zh' | 'pt';

export const SUPPORTED_LANGUAGES: { code: LanguageCode; name: string; dir: 'ltr' | 'rtl' }[] = [
    { code: 'en', name: 'English', dir: 'ltr' },
    { code: 'fr', name: 'Français', dir: 'ltr' },
    { code: 'de', name: 'Deutsch', dir: 'ltr' },
    { code: 'ar', name: 'العربية', dir: 'rtl' },
    { code: 'hi', name: 'हिन्दी', dir: 'ltr' },
    { code: 'zh', name: '中文', dir: 'ltr' },
    { code: 'pt', name: 'Português', dir: 'ltr' },
];

interface LanguageContextType {
    language: LanguageCode;
    setLanguage: (lang: LanguageCode) => void;
    dir: 'ltr' | 'rtl';
    t: (key: string, fallback?: string) => string; // Simple translation helper
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    // 1. Initialize from URL or LocalStorage or Default
    const [language, setLanguageState] = useState<LanguageCode>('en');

    useEffect(() => {
        // Check URL path first (e.g., /fr/...) - implemented via Router usually, 
        // but here we sync global state.
        // For now, let's check localStorage or default
        const stored = localStorage.getItem('boa_lang') as LanguageCode;
        if (stored && SUPPORTED_LANGUAGES.find(l => l.code === stored)) {
            setLanguageState(stored);
        }
    }, []);

    const setLanguage = (lang: LanguageCode) => {
        setLanguageState(lang);
        localStorage.setItem('boa_lang', lang);

        // Update HTML dir attribute for global CSS support
        const dir = SUPPORTED_LANGUAGES.find(l => l.code === lang)?.dir || 'ltr';
        document.documentElement.dir = dir;
        document.documentElement.lang = lang;
    };

    const dir = SUPPORTED_LANGUAGES.find(l => l.code === language)?.dir || 'ltr';

    // Simple translation helper (placeholder for real i18n lib if needed later)
    const t = (key: string, fallback?: string) => {
        return fallback || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, dir, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
