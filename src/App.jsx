import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ErrorBoundary from './components/ui/ErrorBoundary';
import PageTransition from './components/ui/PageTransition';
import RouteLoader from './components/ui/RouteLoader';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import MainLayout from './layouts/MainLayout';

const HomePage = lazy(() => import('./pages/HomePage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const ShowPage = lazy(() => import('./pages/ShowPage'));
const MoviePage = lazy(() => import('./pages/MoviePage'));
const MoviesPage = lazy(() => import('./pages/MoviesPage'));
const PersonPage = lazy(() => import('./pages/PersonPage'));
const TmdbPersonPage = lazy(() => import('./pages/TmdbPersonPage'));
const SchedulePage = lazy(() => import('./pages/SchedulePage'));
const BrowsePage = lazy(() => import('./pages/BrowsePage'));
const DiscoverPage = lazy(() => import('./pages/DiscoverPage'));
const ComparePage = lazy(() => import('./pages/ComparePage'));
const PeoplePage = lazy(() => import('./pages/PeoplePage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const TrackingPage = lazy(() => import('./pages/TrackingPage'));
const CollectionPage = lazy(() => import('./pages/CollectionPage'));
const WatchPartyPage = lazy(() => import('./pages/WatchPartyPage'));
const ShowWatchPage = lazy(() => import('./pages/ShowWatchPage'));
const EpisodePage = lazy(() => import('./pages/EpisodePage'));
const WhereToWatchPage = lazy(() => import('./pages/WhereToWatchPage'));
const MovieWatchPage = lazy(() => import('./pages/MovieWatchPage'));
const ContentStudioPage = lazy(() => import('./pages/admin/ContentStudioPage'));
const WatchOrdersIndexPage = lazy(() => import('./pages/WatchOrdersIndexPage'));
const WatchOrderPage = lazy(() => import('./pages/WatchOrderPage'));
const LikeIndexPage = lazy(() => import('./pages/LikeIndexPage'));
const LikePage = lazy(() => import('./pages/LikePage'));
const HowWeRankPage = lazy(() => import('./pages/HowWeRankPage'));
const TrendingPage = lazy(() => import('./pages/TrendingPage'));
const HiddenGemsPage = lazy(() => import('./pages/HiddenGemsPage'));
const ComingSoonPage = lazy(() => import('./pages/ComingSoonPage'));
const TrailersPage = lazy(() => import('./pages/TrailersPage'));
const StreamingPage = lazy(() => import('./pages/StreamingPage'));
const DiscoverCuratedMoodPage = lazy(() => import('./pages/DiscoverCuratedMoodPage'));
const MoodSlugRedirect = lazy(() => import('./components/routing/MoodSlugRedirect'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const BestIndexPage = lazy(() => import('./pages/BestIndexPage'));
const BestPage = lazy(() => import('./pages/BestPage'));
const DirectorIndexPage = lazy(() => import('./pages/DirectorIndexPage'));
const DirectorPage = lazy(() => import('./pages/DirectorPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const NewsletterPage = lazy(() => import('./pages/NewsletterPage'));
const ShouldIWatchIndexPage = lazy(() => import('./pages/ShouldIWatchIndexPage'));
const ShouldIWatchPage = lazy(() => import('./pages/ShouldIWatchPage'));
const MovieComparePage = lazy(() => import('./pages/MovieComparePage'));
const TermsPage = lazy(() => import('./pages/legal/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/legal/PrivacyPage'));
const DmcaPage = lazy(() => import('./pages/legal/DmcaPage'));
const GenresPage = lazy(() => import('./pages/GenresPage'));
const CountriesPage = lazy(() => import('./pages/CountriesPage'));
const CountryPage = lazy(() => import('./pages/CountryPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppProvider>
          <MainLayout>
            <Suspense fallback={<RouteLoader />}>
              <Routes>
                <Route element={<PageTransition />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/show/:id/watch" element={<ShowWatchPage />} />
                  <Route path="/show/:id/season/:season/episode/:episode" element={<EpisodePage />} />
                  <Route path="/show/:id" element={<ShowPage />} />
                  <Route path="/movie/:id/watch" element={<MovieWatchPage />} />
                  <Route path="/movie/:id" element={<MoviePage />} />
                  <Route path="/movies" element={<MoviesPage />} />
                  <Route path="/collection/:id" element={<CollectionPage />} />
                  <Route path="/person/:id" element={<PersonPage />} />
                  <Route path="/tmdb-person/:id" element={<TmdbPersonPage />} />
                  <Route path="/schedule" element={<SchedulePage />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/browse" element={<BrowsePage />} />
                  <Route path="/browse/:genre" element={<BrowsePage />} />
                  <Route path="/discover" element={<DiscoverPage />} />
                  <Route path="/discover/mood/:slug" element={<DiscoverCuratedMoodPage />} />
                  <Route path="/stats" element={<Navigate to="/tracking" replace />} />
                  <Route path="/compare" element={<ComparePage />} />
                  <Route path="/compare/movies" element={<MovieComparePage />} />
                  <Route path="/compare/movies/:slug" element={<MovieComparePage />} />
                  <Route path="/compare/:slug" element={<ComparePage />} />
                  <Route path="/people" element={<PeoplePage />} />
                  <Route path="/tracking" element={<TrackingPage />} />
                  <Route path="/party" element={<WatchPartyPage />} />
                  <Route path="/admin/studio" element={<ContentStudioPage />} />
                  <Route path="/watch-order" element={<WatchOrdersIndexPage />} />
                  <Route path="/watch-order/:franchise" element={<WatchOrderPage />} />
                  <Route path="/like" element={<LikeIndexPage />} />
                  <Route path="/like/:slug" element={<LikePage />} />
                  <Route path="/how-we-rank" element={<HowWeRankPage />} />
                  <Route path="/trending" element={<Navigate to="/trending/week" replace />} />
                  <Route path="/trending/:window" element={<TrendingPage />} />
                  <Route path="/hidden-gems" element={<HiddenGemsPage />} />
                  <Route path="/coming-soon" element={<Navigate to="/coming-soon/movies" replace />} />
                  <Route path="/coming-soon/:kind" element={<ComingSoonPage />} />
                  <Route path="/trailers" element={<TrailersPage />} />
                  <Route path="/best" element={<BestIndexPage />} />
                  <Route path="/best/:slug" element={<BestPage />} />
                  <Route path="/director" element={<DirectorIndexPage />} />
                  <Route path="/director/:slug" element={<DirectorPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/newsletter" element={<NewsletterPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/dmca" element={<DmcaPage />} />
                  <Route path="/genres" element={<GenresPage />} />
                  <Route path="/country" element={<CountriesPage />} />
                  <Route path="/country/:code" element={<CountryPage />} />
                  <Route path="/where-to-watch/:slug" element={<WhereToWatchPage />} />
                  <Route path="/should-i-watch" element={<ShouldIWatchIndexPage />} />
                  <Route path="/should-i-watch/:slug" element={<ShouldIWatchPage />} />
                  <Route path="/streaming" element={<StreamingPage />} />
                  <Route path="/streaming/:provider" element={<StreamingPage />} />
                  <Route path="/mood" element={<Navigate to="/discover#curated-movies" replace />} />
                  <Route path="/mood/:slug" element={<MoodSlugRedirect />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </Suspense>
          </MainLayout>
        </AppProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
