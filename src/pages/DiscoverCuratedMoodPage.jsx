import { Navigate, useParams } from 'react-router-dom';
import CuratedMoodDetail from '../components/discover/CuratedMoodDetail';
import { findMood } from '../data/moods';

export default function DiscoverCuratedMoodPage() {
  const { slug } = useParams();
  const mood = findMood(slug);

  if (!mood) {
    return <Navigate to="/discover#curated-movies" replace />;
  }

  return <CuratedMoodDetail mood={mood} />;
}
