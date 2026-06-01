import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from './components/beta/PageTransition';
import { Toaster } from "@/components/ui/sonner";
import { CommandMenu } from '@/components/CommandMenu';
import { Layout } from './components/Layout';

// ── BOA-Story pages ───────────────────────────────────────────────────────────
const BetaLanding     = React.lazy(() => import('./pages/beta/BetaLanding').then(m => ({ default: m.BetaLanding })));
const BetaMembership  = React.lazy(() => import('./pages/beta/BetaMembership').then(m => ({ default: m.BetaMembership })));
const BetaIntelligence = React.lazy(() => import('./pages/beta/BetaIntelligence').then(m => ({ default: m.BetaIntelligence })));
const BetaStories     = React.lazy(() => import('./pages/beta/BetaStories').then(m => ({ default: m.BetaStories })));
const BetaLibrary     = React.lazy(() => import('./pages/beta/BetaLibrary').then(m => ({ default: m.BetaLibrary })));
const BetaArticle     = React.lazy(() => import('./pages/beta/BetaArticle').then(m => ({ default: m.BetaArticle })));
const BetaCountryTeaser = React.lazy(() => import('./pages/beta/BetaCountryTeaser').then(m => ({ default: m.BetaCountryTeaser })));
const BetaCountryHub  = React.lazy(() => import('./pages/beta/BetaCountryHub').then(m => ({ default: m.BetaCountryHub })));
const BetaMarketIntel = React.lazy(() => import('./pages/beta/BetaMarketIntel').then(m => ({ default: m.BetaMarketIntel })));
const BetaGallery     = React.lazy(() => import('./pages/beta/BetaGallery').then(m => ({ default: m.BetaGallery })));
const BetaAbout       = React.lazy(() => import('./pages/beta/BetaAbout').then(m => ({ default: m.BetaAbout })));
const BetaNewsletter  = React.lazy(() => import('./pages/beta/BetaNewsletter').then(m => ({ default: m.BetaNewsletter })));
const BetaMemberAccess = React.lazy(() => import('./pages/beta/BetaMemberAccess').then(m => ({ default: m.BetaMemberAccess })));
const BetaEvents      = React.lazy(() => import('./pages/beta/BetaEvents').then(m => ({ default: m.BetaEvents })));
const BetaConcierge   = React.lazy(() => import('./pages/beta/BetaConcierge').then(m => ({ default: m.BetaConcierge })));
const BetaTravel      = React.lazy(() => import('./pages/beta/BetaTravel').then(m => ({ default: m.BetaTravel })));
const BetaSearch      = React.lazy(() => import('./pages/beta/BetaSearch').then(m => ({ default: m.BetaSearch })));
const BetaFeed        = React.lazy(() => import('./pages/beta/BetaFeed').then(m => ({ default: m.BetaFeed })));
const BetaContinentalOverview = React.lazy(() => import('./pages/beta/BetaContinentalOverview').then(m => ({ default: m.BetaContinentalOverview })));
const BetaSponsorDashboard = React.lazy(() => import('./pages/beta/BetaSponsorDashboard').then(m => ({ default: m.BetaSponsorDashboard })));
const BetaNarrativeToolkit = React.lazy(() => import('./pages/beta/BetaNarrativeToolkit').then(m => ({ default: m.BetaNarrativeToolkit })));

// ── Utility / Account pages ───────────────────────────────────────────────────
const SettingsPage = React.lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const PremiumSectorTrends = React.lazy(() => import('./pages/beta/PremiumSectorTrends').then(m => ({ default: m.PremiumSectorTrends })));
const LoginPage    = React.lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const AdminPage    = React.lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })));
const PrivacyPage  = React.lazy(() => import('./pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })));
const TermsPage    = React.lazy(() => import('./pages/TermsPage').then(m => ({ default: m.TermsPage })));
const ContactPage  = React.lazy(() => import('./pages/ContactPage').then(m => ({ default: m.ContactPage })));

import { TooltipProvider } from "@/components/ui/tooltip";
import { MissionProvider } from './context/MissionContext';
import { LensProvider } from './context/LensContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { MemberProvider } from './context/MemberContext';
import { AudioProvider } from './context/AudioContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from './components/ErrorBoundary';
import { BetaGlobalPlayer } from './components/beta/BetaGlobalPlayer';
import { BetaChatWidget } from './components/beta/BetaChatWidget';

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="h-8 w-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
  </div>
);

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <Layout>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>

          {/* ── BOA-Story narrative pages ─────────────────────────────── */}
          <Route path="/"                element={<PageTransition><BetaLanding /></PageTransition>} />
          <Route path="/about"           element={<PageTransition><BetaAbout /></PageTransition>} />
          <Route path="/membership"      element={<PageTransition><BetaMembership /></PageTransition>} />
          <Route path="/gallery"         element={<PageTransition><BetaGallery /></PageTransition>} />
          <Route path="/posts"           element={<PageTransition><BetaStories /></PageTransition>} />
          <Route path="/posts/:slug"     element={<PageTransition><BetaArticle /></PageTransition>} />
          <Route path="/supporter-feed"  element={<PageTransition><BetaMarketIntel /></PageTransition>} />
          <Route path="/newsletter"      element={<PageTransition><BetaNewsletter /></PageTransition>} />
          <Route path="/member-access"   element={<PageTransition><BetaMemberAccess /></PageTransition>} />

          {/* ── Countries (shared between both sections) ──────────────── */}
          <Route path="/countries"       element={<PageTransition><BetaCountryTeaser /></PageTransition>} />
          <Route path="/countries/:code" element={<PageTransition><BetaCountryHub /></PageTransition>} />
          <Route path="/countries/:code/narratives" element={<PageTransition><BetaNarrativeToolkit /></PageTransition>} />
          <Route path="/intelligence"    element={<PageTransition><BetaIntelligence /></PageTransition>} />
          <Route path="/intel" element={<PageTransition><BetaMarketIntel /></PageTransition>} />
          <Route path="/sectors/:id/trends" element={<PageTransition><PremiumSectorTrends /></PageTransition>} />
          <Route path="/dashboards/overview" element={<PageTransition><BetaContinentalOverview /></PageTransition>} />
          <Route path="/dashboards"      element={<Navigate to="/dashboards/overview" replace />} />
          <Route path="/library"         element={<PageTransition><BetaLibrary /></PageTransition>} />
          <Route path="/sponsor/dashboard" element={<PageTransition><BetaSponsorDashboard /></PageTransition>} />

          {/* ── Corporate Services ──────────────────────────────────────── */}
          <Route path="/events"                 element={<PageTransition><BetaEvents /></PageTransition>} />
          <Route path="/request-consultation"   element={<PageTransition><BetaConcierge /></PageTransition>} />
          <Route path="/travel"                 element={<PageTransition><BetaTravel /></PageTransition>} />
          <Route path="/search"                 element={<PageTransition><BetaSearch /></PageTransition>} />
          <Route path="/feed"                   element={<PageTransition><BetaFeed /></PageTransition>} />

          {/* ── Utility pages ─────────────────────────────────────────── */}
          <Route path="/settings" element={<PageTransition><SettingsPage /></PageTransition>} />
          <Route path="/login"    element={<PageTransition><LoginPage /></PageTransition>} />
          <Route path="/admin"    element={<PageTransition><AdminPage /></PageTransition>} />
          <Route path="/privacy"  element={<PageTransition><PrivacyPage /></PageTransition>} />
          <Route path="/terms"    element={<PageTransition><TermsPage /></PageTransition>} />
          <Route path="/contact"  element={<PageTransition><ContactPage /></PageTransition>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </Layout>
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
                  <AudioProvider>
                    <Router>
                      <ErrorBoundary>
                        <Suspense fallback={<PageLoader />}>
                          <AnimatedRoutes />
                        </Suspense>
                      </ErrorBoundary>
                      <BetaGlobalPlayer />
                      <BetaChatWidget />
                      <Toaster />
                      <CommandMenu />
                    </Router>
                  </AudioProvider>
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
