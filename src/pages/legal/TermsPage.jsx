import { Link } from 'react-router-dom';
import LegalLayout, { Section } from '../../components/legal/LegalLayout';
import { SITE_ORIGIN, usePageHead } from '../../hooks/usePageHead';
import { seoBreadcrumb } from '../../utils/seoSchema';
import { LEGAL_LAST_UPDATED } from './legalCopy';

export default function TermsPage() {
  usePageHead({
    title: 'Terms of Service — Bynge',
    description:
      'The rules for using Bynge: who can use it, what counts as acceptable use, how third-party data and streaming sources are handled, and the limits of our liability.',
    canonical: `${SITE_ORIGIN}/terms`,
    jsonLd: [
      seoBreadcrumb('Terms', '/terms', null, '/terms'),
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Terms of Service',
        url: `${SITE_ORIGIN}/terms`,
        dateModified: LEGAL_LAST_UPDATED,
      },
    ],
  });

  return (
    <LegalLayout
      eyebrow="Legal"
      title="Terms of Service"
      lastUpdated={LEGAL_LAST_UPDATED}
      companionLinks={[
        { to: '/privacy', label: 'Privacy Policy' },
        { to: '/about', label: 'About Bynge' },
        { to: '/contact', label: 'Contact' },
      ]}
    >
      <p className="text-body text-text-secondary leading-relaxed">
        These Terms govern your use of Bynge (the &ldquo;Service&rdquo;) at{' '}
        <Link to="/" className="text-accent-peach hover:text-accent-gold">bynge.app</Link>. By using the Service you agree
        to these Terms. If you don&apos;t agree, don&apos;t use Bynge. We&apos;ve written them in plain English on purpose.
      </p>

      <Section n={1} title="The Service">
        <p>
          Bynge is a free streaming discovery and tracking tool. It aggregates publicly available metadata about
          movies and TV shows, ranks titles using the Bynge Score (our proprietary metric), and surfaces curated
          lists, watch-order guides, and recommendations.
        </p>
        <p>
          We may add, remove, or change features at any time, including without notice. The Service is offered
          as-is.
        </p>
      </Section>

      <Section n={2} title="Eligibility">
        <p>
          You must be at least 13 years old to use Bynge. By using the Service you confirm you meet this
          requirement. If you&apos;re between 13 and the age of majority in your jurisdiction, you may only use
          Bynge with a parent or legal guardian&apos;s permission.
        </p>
      </Section>

      <Section n={3} title="Acceptable use">
        <p>You agree not to:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Scrape, mirror, or systematically copy our content (including the Bynge Score) without written permission.</li>
          <li>Resell or commercially redistribute any part of the Service.</li>
          <li>Attempt to reverse-engineer, decompile, or interfere with the Service.</li>
          <li>Use the Service to violate any law or third party&apos;s rights.</li>
          <li>Upload or transmit malicious code, attempt to overload our infrastructure, or probe security weaknesses without disclosure.</li>
        </ul>
      </Section>

      <Section n={4} title="Third-party data and streaming sources">
        <p>
          Bynge displays metadata sourced from{' '}
          <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" className="text-accent-peach hover:text-accent-gold">TMDB</a>,{' '}
          <a href="https://www.tvmaze.com" target="_blank" rel="noopener noreferrer" className="text-accent-peach hover:text-accent-gold">TVMaze</a>,{' '}
          <a href="https://www.omdbapi.com" target="_blank" rel="noopener noreferrer" className="text-accent-peach hover:text-accent-gold">OMDB</a>,{' '}
          <a href="https://fanart.tv" target="_blank" rel="noopener noreferrer" className="text-accent-peach hover:text-accent-gold">fanart.tv</a>,{' '}
          Wikipedia and others. Those providers own their data and their terms apply alongside ours.
        </p>
        <p>
          Where Bynge surfaces video playback, the video is served by independent third-party providers via iframe
          embed. Bynge does not host, stream, encode, transmit, store, or own any video content. We do not control
          which titles those providers carry, the quality of their streams, or the legality of their licensing in
          your jurisdiction. If you believe a third-party provider is infringing your rights, contact the provider
          directly — we cannot remove content we do not host.
        </p>
      </Section>

      <Section n={5} title="Your content">
        <p>
          Watchlists, ratings, 5-state tracking, and other personalization data live in your browser&apos;s local
          storage. We don&apos;t transmit it to our servers and we can&apos;t recover it for you if you clear it.
        </p>
        <p>
          If you subscribe to the newsletter, we collect only your email address. See our{' '}
          <Link to="/privacy" className="text-accent-peach hover:text-accent-gold">Privacy Policy</Link> for the full picture.
        </p>
      </Section>

      <Section n={6} title="Intellectual property">
        <p>
          The Bynge name, logo, Bynge Score brand, original editorial copy, list curation, and the codebase are
          owned by Bynge. Movie and TV metadata, posters, and backdrops are property of their respective rightsholders
          and used under the licensing terms of the data providers listed in §4.
        </p>
        <p>
          You may link to any public page on Bynge. You may not embed our pages in a frame or republish our editorial
          copy without permission. Quoting short excerpts with attribution is fine.
        </p>
      </Section>

      <Section n={7} title="Bynge Score">
        <p>
          The Bynge Score is our proprietary 0–10 metric. We may change how it&apos;s calculated at any time; we
          publish the current methodology at{' '}
          <Link to="/how-we-rank" className="text-accent-peach hover:text-accent-gold">/how-we-rank</Link>. The Score is
          an editorial signal, not a guarantee, prediction, or recommendation of fitness for any purpose.
        </p>
      </Section>

      <Section n={8} title="Disclaimers">
        <p>
          The Service is provided <strong className="text-white">&ldquo;as is&rdquo;</strong> and
          {' '}<strong className="text-white">&ldquo;as available&rdquo;</strong>, without warranties of any kind, express
          or implied — including merchantability, fitness for a particular purpose, accuracy, or non-infringement.
          We do not warrant that the Service will be uninterrupted, error-free, or free of harmful components.
        </p>
        <p>
          Streaming availability, ratings, and metadata can be incorrect or outdated. Always confirm critical
          information (release dates, parental ratings, content warnings) on the source provider before relying on
          it.
        </p>
      </Section>

      <Section n={9} title="Limitation of liability">
        <p>
          To the maximum extent permitted by law, Bynge will not be liable for any indirect, incidental, special,
          consequential, or punitive damages, or any loss of profits, revenues, data, or goodwill, arising from your
          use of (or inability to use) the Service.
        </p>
        <p>
          If a court finds liability, the total aggregate liability for any claim related to the Service is limited
          to USD 100 or the amount you paid us in the 12 months before the claim — whichever is lower. Bynge is
          free, so this number is typically USD 100.
        </p>
      </Section>

      <Section n={10} title="Indemnity">
        <p>
          You agree to indemnify and hold Bynge harmless from any claim, damage, or expense (including reasonable
          legal fees) arising from your misuse of the Service or violation of these Terms.
        </p>
      </Section>

      <Section n={11} title="Changes to these Terms">
        <p>
          We may update these Terms periodically. The &ldquo;Last updated&rdquo; date at the top reflects the current
          version. Continued use of the Service after changes are posted constitutes acceptance.
        </p>
      </Section>

      <Section n={12} title="Termination">
        <p>
          We can suspend or end your access to the Service at any time, for any reason, including violation of these
          Terms. Sections that by their nature should survive termination (§4 §6 §8 §9 §10) survive.
        </p>
      </Section>

      <Section n={13} title="Governing law">
        <p>
          These Terms are governed by the laws of the jurisdiction where Bynge operates, without regard to conflict
          of laws principles. Disputes are resolved in the courts of that jurisdiction.
        </p>
      </Section>

      <Section n={14} title="Contact">
        <p>
          Questions about these Terms? Reach us via the{' '}
          <Link to="/contact" className="text-accent-peach hover:text-accent-gold">contact page</Link> or email{' '}
          <a href="mailto:hello@bynge.app" className="text-accent-peach hover:text-accent-gold">hello@bynge.app</a>.
        </p>
      </Section>
    </LegalLayout>
  );
}
