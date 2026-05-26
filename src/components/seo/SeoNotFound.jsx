import { Link } from 'react-router-dom';
import { usePageHead } from '../../hooks/usePageHead';
import PageLayout from '../../layouts/PageLayout';
import Container from '../ui/Container';
import EmptyState from '../ui/EmptyState';

/**
 * Lightweight 404 for invalid SEO slugs (no auto-redirect, noindex).
 */
export default function SeoNotFound({
  title = 'Page not found',
  description = 'This page does not exist or may have moved.',
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
      <Container className="pt-8">
        <EmptyState
          title={title}
          description={description}
          action={{ label: backLabel, to: backTo }}
          secondaryAction={
            secondaryTo && secondaryLabel
              ? { label: secondaryLabel, to: secondaryTo }
              : undefined
          }
        />
        <p className="mt-8 text-center text-caption text-text-muted">
          <Link to="/" className="text-accent-peach hover:text-accent-gold transition-colors">
            Go to Bynge home
          </Link>
        </p>
      </Container>
    </PageLayout>
  );
}
