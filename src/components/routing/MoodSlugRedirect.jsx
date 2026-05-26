import { Navigate, useParams } from 'react-router-dom';

/** Legacy `/mood/:slug` URLs → canonical `/discover/mood/:slug` */
export default function MoodSlugRedirect() {
  const { slug } = useParams();
  return <Navigate to={`/discover/mood/${slug}`} replace />;
}
