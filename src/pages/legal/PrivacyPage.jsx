import { Link } from 'react-router-dom';
import LegalLayout, { Section } from '../../components/legal/LegalLayout';
import { SITE_ORIGIN, usePageHead } from '../../hooks/usePageHead';
import { seoBreadcrumb } from '../../utils/seoSchema';
import { LEGAL_LAST_UPDATED } from './legalCopy';

export default function PrivacyPage() {
  usePageHead({
    title: 'Privacy Policy — Bynge',
    description:
      'What Bynge collects, why, and what stays on your device. We do not sell data, do not run trackers, and do not share emails. Plain-English privacy policy.',
    canonical: `${SITE_ORIGIN}/privacy`,
    jsonLd: [
      seoBreadcrumb('Privacy', '/privacy', null, '/privacy'),
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Privacy Policy',
        url: `${SITE_ORIGIN}/privacy`,
        dateModified: LEGAL_LAST_UPDATED,
      },
    ],
  });

  return (
    <LegalLayout
      eyebrow="Legal"
      title="Privacy Policy"
      lastUpdated={LEGAL_LAST_UPDATED}
      companionLinks={[
        { to: '/terms', label: 'Terms of Service' },
        { to: '/about', label: 'About Bynge' },
        { to: '/contact', label: 'Contact' },
      ]}
    >
      <p className="text-body text-text-secondary leading-relaxed">
        Short version: we collect almost nothing. Your watchlist and ratings live in your browser. If you subscribe
        to the newsletter, we collect your email — that&apos;s it. We never sell data, we don&apos;t run trackers,
        and we don&apos;t share your information.
      </p>

      <Section n={1} title="What we store on your device">
        <p>
          Bynge uses your browser&apos;s <strong className="text-white">localStorage</strong> to remember:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Your watchlist (movies + shows) and 5-state tracking (Watching / Watched / Watchlist / Paused / Dropped).</li>
          <li>Your personal star ratings (half-star precision, 0.5–5.0).</li>
          <li>Recently-viewed history and episode-watch progress.</li>
          <li>Collections you&apos;ve built.</li>
          <li>UI preferences (streaming server choice, etc.).</li>
        </ul>
        <p>
          All of this stays in your browser. It&apos;s never transmitted to our servers. Clear your browser data
          and it&apos;s gone — even from us. You can export and re-import this data via{' '}
          <Link to="/settings" className="text-accent-peach hover:text-accent-gold">/settings</Link> if you want
          to move between devices.
        </p>
      </Section>

      <Section n={2} title="What we collect on our servers">
        <p>
          Two cases:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong className="text-white">Newsletter subscription</strong> — we store only the email address you
            provide and the source tag (which page or component triggered the signup). Stored by our email provider,
            not on Bynge servers. Unsubscribe with one click from any email.
          </li>
          <li>
            <strong className="text-white">Contact emails</strong> — when you write to{' '}
            <a href="mailto:hello@bynge.app" className="text-accent-peach hover:text-accent-gold">hello@bynge.app</a>
            , the message lives in our inbox. We don&apos;t auto-add you to any list.
          </li>
        </ul>
        <p>
          We do <strong className="text-white">not</strong> create accounts, store passwords, fingerprint browsers,
          or operate any sign-in.
        </p>
      </Section>

      <Section n={3} title="Analytics">
        <p>
          We use <strong className="text-white">Vercel Analytics</strong> and{' '}
          <strong className="text-white">Vercel Speed Insights</strong> for aggregate page-view counts and
          performance metrics. These tools do not use cookies, do not collect IP addresses in identifiable form,
          and do not fingerprint visitors. They give us nothing more than counts of which pages people open.
        </p>
        <p>
          No third-party advertising trackers run on Bynge. No Google Analytics, no Meta Pixel, no TikTok pixel.
        </p>
      </Section>

      <Section n={4} title="Third-party content">
        <p>
          When Bynge displays an image, plays a trailer, or embeds a stream, your browser fetches that content
          directly from the third-party provider — TMDB&apos;s image CDN, YouTube, video-embed providers, etc.
          These providers see your IP and standard browser headers under their own privacy policies. We don&apos;t
          control them and don&apos;t receive that data.
        </p>
        <p>
          Major providers we link to:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><a href="https://www.themoviedb.org/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-accent-peach hover:text-accent-gold">TMDB privacy policy</a></li>
          <li><a href="https://www.tvmaze.com/privacy" target="_blank" rel="noopener noreferrer" className="text-accent-peach hover:text-accent-gold">TVMaze privacy policy</a></li>
          <li><a href="https://www.youtube.com/intl/en/howyoutubeworks/our-commitments/protecting-user-data/" target="_blank" rel="noopener noreferrer" className="text-accent-peach hover:text-accent-gold">YouTube privacy</a></li>
        </ul>
      </Section>

      <Section n={5} title="Cookies">
        <p>
          Bynge itself sets no cookies. Third-party content embedded in our pages (YouTube trailers, stream
          providers) may set their own cookies under their own terms — your browser cookie controls work as expected.
        </p>
      </Section>

      <Section n={6} title="Your rights">
        <p>
          You can:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong className="text-white">Delete your local data</strong> — clear site storage in your browser, or use the &ldquo;Clear data&rdquo; option in <Link to="/settings" className="text-accent-peach hover:text-accent-gold">/settings</Link>.</li>
          <li><strong className="text-white">Unsubscribe from the newsletter</strong> — one-click link at the bottom of every email.</li>
          <li><strong className="text-white">Request deletion</strong> — email <a href="mailto:hello@bynge.app" className="text-accent-peach hover:text-accent-gold">hello@bynge.app</a> and we&apos;ll purge any record we hold (typically just an email address).</li>
        </ul>
        <p>
          If you&apos;re in the EU, UK, California, or other jurisdictions with privacy laws (GDPR, UK GDPR, CCPA),
          you have additional rights — including access, portability, and objection. Email us to exercise any of them.
        </p>
      </Section>

      <Section n={7} title="Children">
        <p>
          Bynge isn&apos;t designed for children under 13 and we don&apos;t knowingly collect data from them. If
          you believe a child has subscribed to the newsletter, email us and we&apos;ll remove the address.
        </p>
      </Section>

      <Section n={8} title="Security">
        <p>
          We use industry-standard transport security (HTTPS) for everything Bynge serves. Newsletter subscriber
          data is stored by our email provider under their own security practices. No system is perfectly secure;
          if we ever experience a breach affecting subscriber data, we&apos;ll notify affected users by email.
        </p>
      </Section>

      <Section n={9} title="Changes to this Policy">
        <p>
          When we change this policy, we update the &ldquo;Last updated&rdquo; date at the top. Material changes —
          new data collection, new providers — will also be announced in the newsletter.
        </p>
      </Section>

      <Section n={10} title="Contact">
        <p>
          Privacy questions or requests:{' '}
          <a href="mailto:hello@bynge.app" className="text-accent-peach hover:text-accent-gold">hello@bynge.app</a> —
          or use the{' '}
          <Link to="/contact" className="text-accent-peach hover:text-accent-gold">contact page</Link>.
        </p>
      </Section>
    </LegalLayout>
  );
}
