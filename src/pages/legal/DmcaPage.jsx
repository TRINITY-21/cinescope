import { Link } from 'react-router-dom';
import LegalLayout, { Section } from '../../components/legal/LegalLayout';
import { SITE_ORIGIN, usePageHead } from '../../hooks/usePageHead';
import { seoBreadcrumb } from '../../utils/seoSchema';
import { LEGAL_LAST_UPDATED } from './legalCopy';

const CLOUDFLARE_DMCA_URL = 'https://abuse.cloudflare.com/dmca';
const CONTACT_EMAIL = 'hello@bynge.app';

export default function DmcaPage() {
  usePageHead({
    title: 'DMCA Notice — Bynge',
    description:
      'How to file a Digital Millennium Copyright Act takedown notice for material that appears on Bynge. Bynge does not host streaming content — it surfaces metadata from third parties.',
    canonical: `${SITE_ORIGIN}/dmca`,
    jsonLd: [
      seoBreadcrumb('DMCA', '/dmca', null, '/dmca'),
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'DMCA Notice',
        url: `${SITE_ORIGIN}/dmca`,
        dateModified: LEGAL_LAST_UPDATED,
      },
    ],
  });

  return (
    <LegalLayout
      eyebrow="Legal"
      title="DMCA Notice"
      lastUpdated={LEGAL_LAST_UPDATED}
      companionLinks={[
        { to: '/terms', label: 'Terms of Service' },
        { to: '/privacy', label: 'Privacy Policy' },
        { to: '/contact', label: 'Contact' },
      ]}
    >
      <p className="text-body text-text-secondary leading-relaxed">
        Bynge does not host, upload, or store any movie or TV-show files on its servers.
        All streaming content surfaced on{' '}
        <Link to="/" className="text-accent-peach hover:text-accent-gold">bynge.app</Link>{' '}
        is loaded from non-affiliated third-party providers. The pages below explain how
        to file a takedown for material that you believe infringes a copyright you own.
      </p>

      <Section n={1} title="Statutory framework">
        <p>
          In accordance with the Digital Millennium Copyright Act of 1998 (the text of
          which may be found on the U.S. Copyright Office website at{' '}
          <a
            href="https://lcweb.loc.gov/copyright/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-peach hover:text-accent-gold"
          >
            lcweb.loc.gov/copyright/
          </a>
          ), Bynge will respond expeditiously to claims of copyright infringement that
          are reported to Bynge&apos;s designated copyright agent identified below.
        </p>
        <p>
          Please note that under Section 512(f) any person who knowingly materially
          misrepresents that material or activity is infringing may be subject to
          liability. Bynge reserves the right, at its sole and entire discretion, to
          remove content and terminate the accounts of users who infringe, or appear to
          infringe, the intellectual property or other rights of third parties.
        </p>
      </Section>

      <Section n={2} title="What to include in a takedown notice">
        <p>
          If you believe that your copyrighted work has been copied in a way that
          constitutes copyright infringement, please provide Bynge&apos;s copyright
          agent with the following information:
        </p>
        <ul className="list-decimal pl-6 space-y-2 text-body text-text-secondary">
          <li>
            A physical or electronic signature of a person authorized to act on behalf
            of the owner of an exclusive right that is allegedly infringed.
          </li>
          <li>
            Identification of the copyrighted work claimed to have been infringed — or,
            if multiple copyrighted works at a single online site are covered by a
            single notification, a representative list of such works on the Website.
          </li>
          <li>
            Identification of the material that is claimed to be infringing or to be
            the subject of infringing activity and that is to be removed or access to
            which is to be disabled, and information reasonably sufficient to permit
            Bynge to locate the material (an exact title, URL, or filename works best).
          </li>
          <li>
            Information reasonably sufficient to permit Bynge to contact the complaining
            party — including a name, address, telephone number, and, if available, an
            email address at which the complaining party may be contacted.
          </li>
          <li>
            A statement that the complaining party has a good-faith belief that use of
            the material in the manner complained of is not authorized by the copyright
            owner, its agent, or the law.
          </li>
          <li>
            A statement that the information in the notification is accurate and, under
            penalty of perjury, that the complaining party is authorized to act on
            behalf of the owner of an exclusive right that is allegedly infringed.
          </li>
        </ul>
      </Section>

      <Section n={3} title="Where to file">
        <p>
          Because Bynge surfaces third-party streams rather than hosting any content
          itself, all DMCA notices regarding playback should also be filed with our
          infrastructure provider, Cloudflare, at:{' '}
          <a
            href={CLOUDFLARE_DMCA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-peach hover:text-accent-gold break-all"
          >
            {CLOUDFLARE_DMCA_URL}
          </a>
          .
        </p>
        <p>
          Copyright complaints must include an accurate representation of the title or
          the file mentioned in the complaint.
        </p>
        <p>
          To prevent fraudulent filings by bots or competitors, all complaints must
          include the exact title or filename of the content in question. You must also
          provide supporting legal documentation or a Letter of Authorization (LOA) to
          verify your right to request removal.
        </p>
      </Section>

      <Section n={4} title="Bynge's copyright contact">
        <p>
          Direct correspondence regarding Bynge specifically (rather than the underlying
          streaming host) can be sent to{' '}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-accent-peach hover:text-accent-gold"
          >
            {CONTACT_EMAIL}
          </a>
          {' '}with the subject line <span className="font-mono text-text-secondary">DMCA Notice</span>.
        </p>
        <p>
          We apologize for any misuse of our service and will do our best to identify
          and remove infringing material once we have the information above.
        </p>
      </Section>
    </LegalLayout>
  );
}
