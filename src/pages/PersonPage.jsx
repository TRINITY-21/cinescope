import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApiQuery } from '../hooks/useApiQuery';
import { endpoints } from '../api/endpoints';
import Container from '../components/ui/Container';
import TabGroup from '../components/ui/TabGroup';
import Loader from '../components/ui/Loader';
import PersonHero from '../components/person/PersonHero';
import FilmographyList from '../components/person/FilmographyList';
import { searchTmdbPerson, getTmdbPersonDetails, getTmdbPersonExternalIds, getTmdbPersonImages, hasTmdbKey } from '../api/tmdb';

export default function PersonPage() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('acting');
  const [tmdbData, setTmdbData] = useState(null);
  const [tmdbExternalIds, setTmdbExternalIds] = useState(null);
  const [tmdbPhotos, setTmdbPhotos] = useState([]);

  const { data: person, isLoading } = useApiQuery(endpoints.person(id));
  const { data: castCredits } = useApiQuery(endpoints.personCast(id));
  const { data: crewCredits } = useApiQuery(endpoints.personCrew(id));
  const { data: guestCredits } = useApiQuery(endpoints.personGuestCast(id));

  useEffect(() => {
    if (person) {
      document.title = `${person.name} — Bynge`;
    }
    return () => { document.title = 'Bynge'; };
  }, [person]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Fetch TMDB person data when TVMaze person loads
  useEffect(() => {
    async function loadTmdb() {
      if (!person?.name || !hasTmdbKey()) return;
      try {
        const found = await searchTmdbPerson(person.name);
        if (!found) return;

        const [details, externalIds, photos] = await Promise.allSettled([
          getTmdbPersonDetails(found.id),
          getTmdbPersonExternalIds(found.id),
          getTmdbPersonImages(found.id),
        ]);

        if (details.status === 'fulfilled' && details.value) {
          setTmdbData(details.value);
        }
        if (externalIds.status === 'fulfilled' && externalIds.value) {
          setTmdbExternalIds(externalIds.value);
        }
        if (photos.status === 'fulfilled' && photos.value) {
          setTmdbPhotos(photos.value);
        }
      } catch (err) {
        console.error('Failed to load TMDB person data:', err);
      }
    }
    loadTmdb();
  }, [person]);

  if (isLoading || !person) return <Loader fullScreen />;

  const tabs = [
    { id: 'acting', label: `Acting (${castCredits?.length || 0})` },
    ...(guestCredits?.length > 0 ? [{ id: 'guest', label: `Guest Roles (${guestCredits.length})` }] : []),
    { id: 'crew', label: `Crew (${crewCredits?.length || 0})` },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <PersonHero
        person={person}
        castCredits={castCredits}
        crewCredits={crewCredits}
        guestCredits={guestCredits}
        tmdbData={tmdbData}
        tmdbExternalIds={tmdbExternalIds}
        tmdbPhotos={tmdbPhotos}
      />

      <div className="relative">
        <Container>
          <TabGroup tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
          <div className="mt-6">
            {activeTab === 'acting' && <FilmographyList credits={castCredits} type="cast" />}
            {activeTab === 'guest' && <FilmographyList credits={guestCredits} type="guest" />}
            {activeTab === 'crew' && <FilmographyList credits={crewCredits} type="crew" />}
          </div>
        </Container>
      </div>
    </motion.div>
  );
}
