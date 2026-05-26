import { usePageHead } from '../../hooks/usePageHead';
import PageLayout from '../../layouts/PageLayout';
import Container from '../ui/Container';
import NotFoundScene from '../ui/NotFoundScene';

/**
 * Lightweight 404 for invalid SEO slugs (no auto-redirect, noindex).
 */
export default function SeoNotFound({
  title = 'Page not found',
  description,
  backTo = '/',
  backLabel = 'Back to home',
  secondaryTo,
  secondaryLabel,
}) {
  usePageHead({
    title: `${title} — Bynge`,
    robots: 'noindex, nofollow',
  });

  return (
    <PageLayout>
      <Container>
        <NotFoundScene
          code="404"
          title={title}
          description={description}
          compact
          primaryTo={backTo}
          primaryLabel={backLabel}
          secondaryTo={secondaryTo}
          secondaryLabel={secondaryLabel}
        />
      </Container>
    </PageLayout>
  );
}
