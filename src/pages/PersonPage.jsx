import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { endpoints } from '../api/endpoints';
import { getTmdbPersonDetails, getTmdbPersonExternalIds, getTmdbPersonImages, hasTmdbKey, searchTmdbPerson } from '../api/tmdb';
import FilmographyList from '../components/person/FilmographyList';
import PersonHero from '../components/person/PersonHero';
import Container from '../components/ui/Container';
import Loader from '../components/ui/Loader';
import TabGroup from '../components/ui/TabGroup';
import { useApiQuery } from '../hooks/useApiQuery';
import { SITE_ORIGIN, usePageHead } from '../hooks/usePageHead';

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

  usePageHead(
    person
      ? {
          title: `${person.name} — Bynge`,
          description: `${person.name} on Bynge — filmography, credits, and shows they've appeared in.`,
          canonical: `${SITE_ORIGIN}/person/${id}`,
          ogImage: tmdbData?.id
            ? `${SITE_ORIGIN}/api/og?type=tmdb-person&id=${tmdbData.id}`
            : `${SITE_ORIGIN}/api/og?type=person&id=${id}`,
          ogType: 'profile',
          jsonLd: [
            {
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_ORIGIN },
                { '@type': 'ListItem', position: 2, name: 'People', item: `${SITE_ORIGIN}/people` },
                { '@type': 'ListItem', position: 3, name: person.name, item: `${SITE_ORIGIN}/person/${id}` },
              ],
            },
          ],
        }
      : {},
  );

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
