import { useLocation } from 'react-router-dom';
import NotFoundScene from '../components/ui/NotFoundScene';
import { usePageHead } from '../hooks/usePageHead';

export default function NotFoundPage() {
  const location = useLocation();

  usePageHead({
    title: 'Page not found — Bynge',
    robots: 'noindex, nofollow',
  });

  return (
    <NotFoundScene
      code="404"
      title="Scene not found"
      description="This URL isn't in our catalog — the show may have ended, or the link might be mistyped."
      path={location.pathname}
    />
  );
}
