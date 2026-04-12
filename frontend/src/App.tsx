import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/sonner"
import { CommandMenu } from '@/components/CommandMenu';
import { isBeta } from './config/flags';

// Eagerly load the homepage (first paint)
import { HomePage } from './pages/HomePage';

// Lazy-load everything else — Vite will auto-split into separate chunks
const ArticlesPage = React.lazy(() => import('./pages/ArticlesPage').then(m => ({ default: m.ArticlesPage })));
const ArticleDetailPage = React.lazy(() => import('./pages/ArticleDetailPage').then(m => ({ default: m.ArticleDetailPage })));
const CountryDetailPage = React.lazy(() => import('./pages/CountryDetailPage').then(m => ({ default: m.CountryDetailPage })));
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
const BetaAbout = React.lazy(() => import('./pages/beta/BetaAbout').then(m => ({ default: m.BetaAbout })));
const BetaNewsletter = React.lazy(() => import('./pages/beta/BetaNewsletter').then(m => ({ default: m.BetaNewsletter })));
const BetaMemberAccess = React.lazy(() => import('./pages/beta/BetaMemberAccess').then(m => ({ default: m.BetaMemberAccess })));

import { TooltipProvider } from "@/components/ui/tooltip";
import { MissionProvider } from './context/MissionContext';
import { LensProvider } from './context/LensContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from './components/ErrorBoundary';

const queryClient = new QueryClient();

// Minimal loading fallback for lazy-loaded routes
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <LanguageProvider>
            <LensProvider>
              <MissionProvider>
                <Router>
                  <ErrorBoundary>
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        {/* Beta & core public routes (always accessible) */}
                        <Route path="/" element={isBeta ? <BetaLanding /> : <HomePage />} />
                        <Route path="/membership" element={<BetaMembership />} />
                        <Route path="/stories" element={<BetaStories />} />
                        <Route path="/stories/:slug" element={<BetaArticle />} />
                        <Route path="/countries" element={<BetaCountryTeaser />} />
                        <Route path="/about" element={<BetaAbout />} />
                        <Route path="/newsletter" element={<BetaNewsletter />} />
                        <Route path="/member-access" element={<BetaMemberAccess />} />

                        {/* Full app routes */}
                        <Route path="/intelligence-briefings" element={<ArticlesPage />} />
                        <Route path="/articles/:slug" element={<ArticleDetailPage />} />
                        <Route path="/countries/:code" element={<CountryDetailPage />} />
                        <Route path="/dashboards" element={<DashboardsPage />} />
                        <Route path="/dashboards/:region" element={<DashboardDetailPage />} />
                        <Route path="/market-intel" element={<MarketIntelPage />} />
                        <Route path="/market-intel/sectors/:id" element={<SectorDetailPage />} />
                        <Route path="/market-intel/reports" element={<ReportsPage />} />
                        <Route path="/market-intel/reports/:id" element={<ReportDetailPage />} />
                        <Route path="/market-intel/country/:code" element={<CountryOutlookPage />} />
                        <Route path="/market-intel/country/:code/premium" element={<PremiumCountryAnalysisPage />} />
                        <Route path="/market-intel/audience" element={<AudienceInsightsPage />} />
                        <Route path="/market-intel/sectors/:id/trends" element={<PremiumSectorTrendsPage />} />
                        <Route path="/feed" element={<PersonalizedFeedPage />} />
                        <Route path="/narratives" element={<NarrativesPage />} />
                        <Route path="/narratives/country/:code" element={<CountryNarrativePage />} />
                        <Route path="/search" element={<SearchPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/admin" element={<AdminPage />} />
                        <Route path="/sponsored" element={<SponsoredPage />} />
                        <Route path="/market-intel/reports/sector/:sectorId" element={<ReportsPage />} />
                        <Route path="/privacy" element={<PrivacyPage />} />
                        <Route path="/terms" element={<TermsPage />} />
                        <Route path="/guidelines" element={<EditorialGuidelinesPage />} />
                        <Route path="/travel" element={<TravelPage />} />
                        <Route path="/events" element={<EventsPage />} />
                        <Route path="/events/:id" element={<EventDetailPage />} />
                        <Route path="/request-consultation" element={<BookingRequestPage />} />
                        <Route path="/analyst" element={<AnalystPage />} />
                        <Route path="/impact" element={<ImpactPage />} />
                        <Route path="/library" element={<LibraryPage />} />
                        <Route path="/contact" element={<ContactPage />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
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
    </AuthProvider>
  );
}

export default App;
