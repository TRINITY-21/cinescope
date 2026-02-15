import { AnimatePresence } from 'framer-motion';
import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Loader from './components/ui/Loader';
import { AppProvider } from './context/AppContext';
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
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

export default function App() {
  const location = useLocation();

  return (
    <AppProvider>
      <MainLayout>
        <AnimatePresence mode="wait">
          <Suspense fallback={<Loader fullScreen />}>
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<HomePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/show/:id" element={<ShowPage />} />
              <Route path="/movie/:id" element={<MoviePage />} />
              <Route path="/movies" element={<MoviesPage />} />
              <Route path="/collection/:id" element={<CollectionPage />} />
              <Route path="/person/:id" element={<PersonPage />} />
              <Route path="/tmdb-person/:id" element={<TmdbPersonPage />} />
              <Route path="/schedule" element={<SchedulePage />} />
              <Route path="/browse" element={<BrowsePage />} />
              <Route path="/browse/:genre" element={<BrowsePage />} />
              <Route path="/discover" element={<DiscoverPage />} />
              <Route path="/stats" element={<Navigate to="/tracking" replace />} />
              <Route path="/compare" element={<ComparePage />} />
              <Route path="/people" element={<PeoplePage />} />
              <Route path="/schedule" element={<CalendarPage />} />
              <Route path="/tracking" element={<TrackingPage />} />
              <Route path="/party" element={<WatchPartyPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </AnimatePresence>
      </MainLayout>
    </AppProvider>
  );
}
