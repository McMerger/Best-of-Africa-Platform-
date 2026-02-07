import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from "@/components/ui/sonner"
import { CommandMenu } from '@/components/CommandMenu';
import { HomePage } from './pages/HomePage';
import { ArticlesPage } from './pages/ArticlesPage';
import { ArticleDetailPage } from './pages/ArticleDetailPage';
import { CountriesPage } from './pages/CountriesPage';
import { CountryDetailPage } from './pages/CountryDetailPage';
import { DashboardsPage } from './pages/DashboardsPage';
import { DashboardDetailPage } from './pages/DashboardDetailPage';
import { MarketIntelPage } from './pages/MarketIntelPage';
import { SectorDetailPage } from './pages/SectorDetailPage';
import { CountryNarrativePage } from './pages/CountryNarrativePage';
import { NarrativesPage } from './pages/NarrativesPage';
import { SearchPage } from './pages/SearchPage';
import { ReportsPage } from './pages/ReportsPage';
import { ReportDetailPage } from './pages/ReportDetailPage';
import { CountryOutlookPage } from './pages/CountryOutlookPage';
import { AudienceInsightsPage } from './pages/AudienceInsightsPage';
import { PremiumCountryAnalysisPage } from './pages/PremiumCountryAnalysisPage';
import { PremiumSectorTrendsPage } from './pages/PremiumSectorTrendsPage';
import { PersonalizedFeedPage } from './pages/PersonalizedFeedPage';
import { EditorialGuidelinesPage } from './pages/EditorialGuidelinesPage';

import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { AdminPage } from './pages/AdminPage';
import { SponsoredPage } from './pages/SponsoredPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { ContactPage } from './pages/ContactPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { EventsPage } from './pages/EventsPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { BookingRequestPage } from './pages/BookingRequestPage';
import { MembershipPage } from './pages/MembershipPage';
import { AboutPage } from './pages/AboutPage';
import { AnalystPage } from './pages/AnalystPage';
import { ImpactPage } from './pages/ImpactPage';

import { LibraryPage } from './pages/LibraryPage';
import { TravelPage } from './pages/TravelPage';

import { TooltipProvider } from "@/components/ui/tooltip";
import { MissionProvider } from './context/MissionContext';
import { AuthProvider } from './context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <MissionProvider>
            <Router>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/intelligence-briefings" element={<ArticlesPage />} />
                <Route path="/articles/:slug" element={<ArticleDetailPage />} />
                <Route path="/countries" element={<CountriesPage />} />
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
                {/* Services Removed */}
                <Route path="/travel" element={<TravelPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/events/:id" element={<EventDetailPage />} />
                <Route path="/request-consultation" element={<BookingRequestPage />} />

                <Route path="/membership" element={<MembershipPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/analyst" element={<AnalystPage />} />
                <Route path="/impact" element={<ImpactPage />} />
                <Route path="/library" element={<LibraryPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
              <Toaster />
              <CommandMenu />
            </Router>
          </MissionProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
