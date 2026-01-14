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
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { AdminPage } from './pages/AdminPage';
import { SponsoredPage } from './pages/SponsoredPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { ContactPage } from './pages/ContactPage';
import { NotFoundPage } from './pages/NotFoundPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/news" element={<ArticlesPage />} />
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
        <Route path="/contact" element={<ContactPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster />
      <CommandMenu />
    </Router>
  );
}

export default App;
