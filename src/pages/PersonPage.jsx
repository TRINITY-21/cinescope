import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { endpoints } from '../api/endpoints';
import { getTmdbPersonDetails, getTmdbPersonExternalIds, getTmdbPersonImages, hasTmdbKey, searchTmdbPerson } from '../api/tmdb';
import FilmographyList from '../components/person/FilmographyList';
import PersonHero from '../components/person/PersonHero';
import Container from '../components/ui/Container';
import Loader from '../components/ui/Loader';
import NotFoundScene from '../components/ui/NotFoundScene';
import TabGroup from '../components/ui/TabGroup';
import { useApiQuery } from '../hooks/useApiQuery';
import { SITE_ORIGIN, usePageHead } from '../hooks/usePageHead';

function PersonPageContent() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('acting');
  const [tmdbData, setTmdbData] = useState(null);
  const [tmdbExternalIds, setTmdbExternalIds] = useState(null);
  const [tmdbPhotos, setTmdbPhotos] = useState([]);

  const personUrl = id ? endpoints.person(id) : null;
  const { data: person, isLoading, error, refetch } = useApiQuery(personUrl);
  const creditsEnabled = Boolean(id && person);
  const { data: castCredits } = useApiQuery(
    creditsEnabled ? endpoints.personCast(id) : null,
  );
  const { data: crewCredits } = useApiQuery(
    creditsEnabled ? endpoints.personCrew(id) : null,
  );
  const { data: guestCredits } = useApiQuery(
    creditsEnabled ? endpoints.personGuestCast(id) : null,
  );

  const head = error
    ? {
        title: error.status === 404 ? 'Person not found — Bynge' : 'Could not load person — Bynge',
        robots: 'noindex, nofollow',
        canonical: `${SITE_ORIGIN}/person/${id}`,
      }
    : person
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
              '@type': 'Person',
              name: person.name,
              url: `${SITE_ORIGIN}/person/${id}`,
              image: person.image?.original || person.image?.medium || undefined,
              birthDate: person.birthday || undefined,
              deathDate: person.deathday || undefined,
              birthPlace: tmdbData?.place_of_birth || person.country?.name || undefined,
              description: tmdbData?.biography?.slice(0, 500) || undefined,
              jobTitle: tmdbData?.known_for_department || undefined,
              sameAs: [
                tmdbData?.id ? `${SITE_ORIGIN}/tmdb-person/${tmdbData.id}` : null,
                tmdbExternalIds?.imdb_id ? `https://www.imdb.com/name/${tmdbExternalIds.imdb_id}` : null,
                tmdbExternalIds?.instagram_id ? `https://instagram.com/${tmdbExternalIds.instagram_id}` : null,
                tmdbExternalIds?.twitter_id ? `https://twitter.com/${tmdbExternalIds.twitter_id}` : null,
              ].filter(Boolean),
            },
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
      : {};

  usePageHead(head);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    setActiveTab('acting');
    setTmdbData(null);
    setTmdbExternalIds(null);
    setTmdbPhotos([]);
  }, [id]);

  // Fetch TMDB person data when TVMaze person loads
  useEffect(() => {
    let cancelled = false;
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

        if (!cancelled && details.status === 'fulfilled' && details.value) {
          setTmdbData(details.value);
        }
        if (!cancelled && externalIds.status === 'fulfilled' && externalIds.value) {
          setTmdbExternalIds(externalIds.value);
        }
        if (!cancelled && photos.status === 'fulfilled' && photos.value) {
          setTmdbPhotos(photos.value);
        }
      } catch (err) {
        console.error('Failed to load TMDB person data:', err);
      }
    }
    loadTmdb();
    return () => {
      cancelled = true;
    };
  }, [person?.name]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader label="Loading person" />
      </div>
    );
  }

  if (error) {
    const status = error.status;
    const is404 = status === 404;
    return (
      <NotFoundScene
        code={is404 ? '404' : 'Error'}
        title={is404 ? "This person isn't in our catalog" : 'Could not load this person'}
        description={
          is404
            ? 'TVMaze did not return a profile for this person. The credit link may be outdated.'
            : 'We hit a temporary issue while loading this profile. Try again.'
        }
        path={`/person/${id}`}
      >
        <button
          type="button"
          onClick={refetch}
          className="px-5 py-2.5 sm:px-7 sm:py-3 text-sm sm:text-base font-semibold rounded-lg bg-accent-red hover:bg-accent-red/90 text-white btn-glow-red transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-peach focus:ring-offset-2 focus:ring-offset-bg-primary"
        >
          Retry
        </button>
      </NotFoundScene>
    );
  }

  if (!person) {
    return (
      <NotFoundScene
        code="Error"
        title="Could not load this person"
        description="We didn't get a profile back. Please try again."
        path={`/person/${id}`}
      >
        <button
          type="button"
          onClick={refetch}
          className="px-5 py-2.5 sm:px-7 sm:py-3 text-sm sm:text-base font-semibold rounded-lg bg-accent-red hover:bg-accent-red/90 text-white btn-glow-red transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-peach focus:ring-offset-2 focus:ring-offset-bg-primary"
        >
          Retry
        </button>
      </NotFoundScene>
    );
  }

  const tabs = [
    { id: 'acting', label: `Acting (${castCredits?.length || 0})` },
    ...(guestCredits?.length > 0 ? [{ id: 'guest', label: `Guest Roles (${guestCredits.length})` }] : []),
    { id: 'crew', label: `Crew (${crewCredits?.length || 0})` },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
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

/** Remount when :id changes so cast/crew navigation always refetches cleanly. */
export default function PersonPage() {
  const { id } = useParams();
  return <PersonPageContent key={id} />;
}
