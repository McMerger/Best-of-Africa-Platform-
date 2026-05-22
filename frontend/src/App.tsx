import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from './components/beta/PageTransition';
import { Toaster } from "@/components/ui/sonner"
import { CommandMenu } from '@/components/CommandMenu';
import { isBeta } from './config/flags';

// Eagerly load the homepage (first paint)
import { HomePage } from './pages/HomePage';

// Lazy-load everything else — Vite will auto-split into separate chunks
const ArticlesPage = React.lazy(() => import('./pages/ArticlesPage').then(m => ({ default: m.ArticlesPage })));
const ArticleDetailPage = React.lazy(() => import('./pages/ArticleDetailPage').then(m => ({ default: m.ArticleDetailPage })));
const DashboardsPage = React.lazy(() => import('./pages/DashboardsPage').then(m => ({ default: m.DashboardsPage })));
const DashboardDetailPage = React.lazy(() => import('./pages/DashboardDetailPage').then(m => ({ default: m.DashboardDetailPage })));
const MarketIntelPage = React.lazy(() => import('./pages/MarketIntelPage').then(m => ({ default: m.MarketIntelPage })));
const SectorDetailPage = React.lazy(() => import('./pages/SectorDetailPage').then(m => ({ default: m.SectorDetailPage })));
const CountryNarrativePage = React.lazy(() => import('./pages/CountryNarrativePage').then(m => ({ default: m.CountryNarrativePage })));
const NarrativesPage = React.lazy(() => import('./pages/NarrativesPage').then(m => ({ default: m.NarrativesPage })));
const SearchPage = React.lazy(() => import('./pages/SearchPage').then(m => ({ default: m.SearchPage })));
const ReportsPage = React.lazy(() => import('./pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const ReportDetailPage = React.lazy(() => import('./pages/ReportDetailPage').then(m => ({ default: m.ReportDetailPage })));
const CountryOutlookPage = React.lazy(() => import('./pages/CountryOutlookPage').then(m => ({ default: m.CountryOutlookPage })));
const AudienceInsightsPage = React.lazy(() => import('./pages/AudienceInsightsPage').then(m => ({ default: m.AudienceInsightsPage })));
const PremiumCountryAnalysisPage = React.lazy(() => import('./pages/PremiumCountryAnalysisPage').then(m => ({ default: m.PremiumCountryAnalysisPage })));
const PremiumSectorTrendsPage = React.lazy(() => import('./pages/PremiumSectorTrendsPage').then(m => ({ default: m.PremiumSectorTrendsPage })));
const PersonalizedFeedPage = React.lazy(() => import('./pages/PersonalizedFeedPage').then(m => ({ default: m.PersonalizedFeedPage })));
const EditorialGuidelinesPage = React.lazy(() => import('./pages/EditorialGuidelinesPage').then(m => ({ default: m.EditorialGuidelinesPage })));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const LoginPage = React.lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const AdminPage = React.lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })));
const SponsoredPage = React.lazy(() => import('./pages/SponsoredPage').then(m => ({ default: m.SponsoredPage })));
const PrivacyPage = React.lazy(() => import('./pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })));
const TermsPage = React.lazy(() => import('./pages/TermsPage').then(m => ({ default: m.TermsPage })));
const ContactPage = React.lazy(() => import('./pages/ContactPage').then(m => ({ default: m.ContactPage })));
const EventsPage = React.lazy(() => import('./pages/EventsPage').then(m => ({ default: m.EventsPage })));
const EventDetailPage = React.lazy(() => import('./pages/EventDetailPage').then(m => ({ default: m.EventDetailPage })));
const BookingRequestPage = React.lazy(() => import('./pages/BookingRequestPage').then(m => ({ default: m.BookingRequestPage })));
const AnalystPage = React.lazy(() => import('./pages/AnalystPage').then(m => ({ default: m.AnalystPage })));
const ImpactPage = React.lazy(() => import('./pages/ImpactPage').then(m => ({ default: m.ImpactPage })));
const LibraryPage = React.lazy(() => import('./pages/LibraryPage').then(m => ({ default: m.LibraryPage })));
const TravelPage = React.lazy(() => import('./pages/TravelPage').then(m => ({ default: m.TravelPage })));

// Beta pages — always accessible
const BetaLanding = React.lazy(() => import('./pages/beta/BetaLanding').then(m => ({ default: m.BetaLanding })));
const BetaMembership = React.lazy(() => import('./pages/beta/BetaMembership').then(m => ({ default: m.BetaMembership })));
const BetaStories = React.lazy(() => import('./pages/beta/BetaStories').then(m => ({ default: m.BetaStories })));
const BetaArticle = React.lazy(() => import('./pages/beta/BetaArticle').then(m => ({ default: m.BetaArticle })));
const BetaCountryTeaser = React.lazy(() => import('./pages/beta/BetaCountryTeaser').then(m => ({ default: m.BetaCountryTeaser })));
const BetaCountryHub = React.lazy(() => import('./pages/beta/BetaCountryHub').then(m => ({ default: m.BetaCountryHub })));
const BetaMarketIntel = React.lazy(() => import('./pages/beta/BetaMarketIntel').then(m => ({ default: m.BetaMarketIntel })));
const BetaAbout = React.lazy(() => import('./pages/beta/BetaAbout').then(m => ({ default: m.BetaAbout })));
const BetaNewsletter = React.lazy(() => import('./pages/beta/BetaNewsletter').then(m => ({ default: m.BetaNewsletter })));
const BetaMemberAccess = React.lazy(() => import('./pages/beta/BetaMemberAccess').then(m => ({ default: m.BetaMemberAccess })));

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

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Beta & core public routes (always accessible) */}
        <Route path="/" element={<PageTransition>{isBeta ? <BetaLanding /> : <HomePage />}</PageTransition>} />
        <Route path="/membership" element={<PageTransition><BetaMembership /></PageTransition>} />
        <Route path="/stories" element={<PageTransition><BetaStories /></PageTransition>} />
        <Route path="/stories/:slug" element={<PageTransition><BetaArticle /></PageTransition>} />
        <Route path="/countries" element={<PageTransition><BetaCountryTeaser /></PageTransition>} />
        <Route path="/countries/:code" element={<PageTransition><BetaCountryHub /></PageTransition>} />
        <Route path="/intel" element={<PageTransition><BetaMarketIntel /></PageTransition>} />
        <Route path="/about" element={<PageTransition><BetaAbout /></PageTransition>} />
        <Route path="/newsletter" element={<PageTransition><BetaNewsletter /></PageTransition>} />
        <Route path="/member-access" element={<PageTransition><BetaMemberAccess /></PageTransition>} />

        {/* Full app routes */}
        <Route path="/intelligence-briefings" element={<PageTransition><ArticlesPage /></PageTransition>} />
        <Route path="/articles/:slug" element={<PageTransition><ArticleDetailPage /></PageTransition>} />
        <Route path="/dashboards" element={<PageTransition><DashboardsPage /></PageTransition>} />
        <Route path="/dashboards/:region" element={<PageTransition><DashboardDetailPage /></PageTransition>} />
        <Route path="/market-intel" element={<PageTransition><MarketIntelPage /></PageTransition>} />
        <Route path="/market-intel/sectors/:id" element={<PageTransition><SectorDetailPage /></PageTransition>} />
        <Route path="/market-intel/reports" element={<PageTransition><ReportsPage /></PageTransition>} />
        <Route path="/market-intel/reports/:id" element={<PageTransition><ReportDetailPage /></PageTransition>} />
        <Route path="/market-intel/country/:code" element={<PageTransition><CountryOutlookPage /></PageTransition>} />
        <Route path="/market-intel/country/:code/premium" element={<PageTransition><PremiumCountryAnalysisPage /></PageTransition>} />
        <Route path="/market-intel/audience" element={<PageTransition><AudienceInsightsPage /></PageTransition>} />
        <Route path="/market-intel/sectors/:id/trends" element={<PageTransition><PremiumSectorTrendsPage /></PageTransition>} />
        <Route path="/feed" element={<PageTransition><PersonalizedFeedPage /></PageTransition>} />
        <Route path="/narratives" element={<PageTransition><NarrativesPage /></PageTransition>} />
        <Route path="/narratives/country/:code" element={<PageTransition><CountryNarrativePage /></PageTransition>} />
        <Route path="/search" element={<PageTransition><SearchPage /></PageTransition>} />
        <Route path="/settings" element={<PageTransition><SettingsPage /></PageTransition>} />
        <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
        <Route path="/admin" element={<PageTransition><AdminPage /></PageTransition>} />
        <Route path="/sponsored" element={<PageTransition><SponsoredPage /></PageTransition>} />
        <Route path="/market-intel/reports/sector/:sectorId" element={<PageTransition><ReportsPage /></PageTransition>} />
        <Route path="/privacy" element={<PageTransition><PrivacyPage /></PageTransition>} />
        <Route path="/terms" element={<PageTransition><TermsPage /></PageTransition>} />
        <Route path="/guidelines" element={<PageTransition><EditorialGuidelinesPage /></PageTransition>} />
        <Route path="/travel" element={<PageTransition><TravelPage /></PageTransition>} />
        <Route path="/events" element={<PageTransition><EventsPage /></PageTransition>} />
        <Route path="/events/:id" element={<PageTransition><EventDetailPage /></PageTransition>} />
        <Route path="/request-consultation" element={<PageTransition><BookingRequestPage /></PageTransition>} />
        <Route path="/analyst" element={<PageTransition><AnalystPage /></PageTransition>} />
        <Route path="/impact" element={<PageTransition><ImpactPage /></PageTransition>} />
        <Route path="/library" element={<PageTransition><LibraryPage /></PageTransition>} />
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
