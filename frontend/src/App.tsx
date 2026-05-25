import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from './components/beta/PageTransition';
import { Toaster } from "@/components/ui/sonner"
import { CommandMenu } from '@/components/CommandMenu';

// Beta pages — always accessible
const BetaLanding = React.lazy(() => import('./pages/beta/BetaLanding').then(m => ({ default: m.BetaLanding })));
const BetaMembership = React.lazy(() => import('./pages/beta/BetaMembership').then(m => ({ default: m.BetaMembership })));
const BetaStories = React.lazy(() => import('./pages/beta/BetaStories').then(m => ({ default: m.BetaStories })));
const BetaArticle = React.lazy(() => import('./pages/beta/BetaArticle').then(m => ({ default: m.BetaArticle })));
const BetaCountryTeaser = React.lazy(() => import('./pages/beta/BetaCountryTeaser').then(m => ({ default: m.BetaCountryTeaser })));
const BetaCountryHub = React.lazy(() => import('./pages/beta/BetaCountryHub').then(m => ({ default: m.BetaCountryHub })));
const BetaMarketIntel = React.lazy(() => import('./pages/beta/BetaMarketIntel').then(m => ({ default: m.BetaMarketIntel })));
const BetaGallery = React.lazy(() => import('./pages/beta/BetaGallery').then(m => ({ default: m.BetaGallery })));
const BetaAbout = React.lazy(() => import('./pages/beta/BetaAbout').then(m => ({ default: m.BetaAbout })));
const BetaNewsletter = React.lazy(() => import('./pages/beta/BetaNewsletter').then(m => ({ default: m.BetaNewsletter })));
const BetaMemberAccess = React.lazy(() => import('./pages/beta/BetaMemberAccess').then(m => ({ default: m.BetaMemberAccess })));

// Core Utility Pages
const SettingsPage = React.lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const LoginPage = React.lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const AdminPage = React.lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })));
const PrivacyPage = React.lazy(() => import('./pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })));
const TermsPage = React.lazy(() => import('./pages/TermsPage').then(m => ({ default: m.TermsPage })));
const ContactPage = React.lazy(() => import('./pages/ContactPage').then(m => ({ default: m.ContactPage })));

import { TooltipProvider } from "@/components/ui/tooltip";
import { MissionProvider } from './context/MissionContext';
import { LensProvider } from './context/LensContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { MemberProvider } from './context/MemberContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from './components/ErrorBoundary';

const queryClient = new QueryClient();

// Minimal loading fallback for lazy-loaded routes
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const BetaThemeWrapper = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    document.body.classList.add('theme-beta');
    return () => document.body.classList.remove('theme-beta');
  }, []);
  return <div className="theme-beta min-h-screen">{children}</div>;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Core platform routes */}
        <Route path="/" element={<PageTransition><BetaThemeWrapper><BetaLanding /></BetaThemeWrapper></PageTransition>} />
        <Route path="/membership" element={<PageTransition><BetaThemeWrapper><BetaMembership /></BetaThemeWrapper></PageTransition>} />
        <Route path="/posts" element={<PageTransition><BetaThemeWrapper><BetaStories /></BetaThemeWrapper></PageTransition>} />
        <Route path="/posts/:slug" element={<PageTransition><BetaThemeWrapper><BetaArticle /></BetaThemeWrapper></PageTransition>} />
        <Route path="/countries" element={<PageTransition><BetaThemeWrapper><BetaCountryTeaser /></BetaThemeWrapper></PageTransition>} />
        <Route path="/countries/:code" element={<PageTransition><BetaThemeWrapper><BetaCountryHub /></BetaThemeWrapper></PageTransition>} />
        <Route path="/supporter-feed" element={<PageTransition><BetaThemeWrapper><BetaMarketIntel /></BetaThemeWrapper></PageTransition>} />
        <Route path="/gallery" element={<PageTransition><BetaThemeWrapper><BetaGallery /></BetaThemeWrapper></PageTransition>} />
        <Route path="/about" element={<PageTransition><BetaThemeWrapper><BetaAbout /></BetaThemeWrapper></PageTransition>} />
        <Route path="/newsletter" element={<PageTransition><BetaThemeWrapper><BetaNewsletter /></BetaThemeWrapper></PageTransition>} />
        <Route path="/member-access" element={<PageTransition><BetaThemeWrapper><BetaMemberAccess /></BetaThemeWrapper></PageTransition>} />

        {/* Utility routes */}
        <Route path="/settings" element={<PageTransition><SettingsPage /></PageTransition>} />
        <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
        <Route path="/admin" element={<PageTransition><AdminPage /></PageTransition>} />
        <Route path="/privacy" element={<PageTransition><PrivacyPage /></PageTransition>} />
        <Route path="/terms" element={<PageTransition><TermsPage /></PageTransition>} />
        <Route path="/contact" element={<PageTransition><ContactPage /></PageTransition>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <AuthProvider>
      <MemberProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <LanguageProvider>
              <LensProvider>
                <MissionProvider>
                  <Router>
                    <ErrorBoundary>
                      <Suspense fallback={<PageLoader />}>
                        <AnimatedRoutes />
                      </Suspense>
                    </ErrorBoundary>
                    <Toaster />
                    <CommandMenu />
                  </Router>
                </MissionProvider>
              </LensProvider>
            </LanguageProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </MemberProvider>
    </AuthProvider>
  );
}

export default App;
