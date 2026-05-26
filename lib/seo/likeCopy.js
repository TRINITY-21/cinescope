/**
 * Editorial copy + structured data for /like/:slug pages.
 */

export function getKindLabel(kind) {
  return kind === 'movie' ? 'Movies' : 'Shows';
}

export function getLikePageTitle(kind, sourceTitle) {
  return `${getKindLabel(kind)} like ${sourceTitle}`;
}

export function getLikeDescription(kind, sourceTitle) {
  const label = getKindLabel(kind).toLowerCase();
  return `If you loved ${sourceTitle}, here are ${label} with the same vibe — ranked by rating and picked from TMDB's recommendation graph. Updated continuously on Bynge.`;
}

export function getLikeIntroParagraphs(kind, sourceTitle, count) {
  const label = getKindLabel(kind).toLowerCase();
  return [
    `You finished ${sourceTitle} and want more of that exact feeling. This list surfaces ${count} ${label} that share DNA with it — same tone, pacing, and audience appeal — not random trending titles.`,
    `Each pick is pulled from TMDB's recommendation graph, then ranked by audience score and recency so the list stays useful as new seasons and films land. Read the one-line hook on each row before you commit.`,
  ];
}

export function getLikeFaq(kind, sourceTitle) {
  const label = getKindLabel(kind).toLowerCase();
  return [
    {
      q: `How many ${label} like ${sourceTitle} are on this list?`,
      a: `Up to twenty titles, sorted by rating. We cap the list so every entry is worth your time instead of padding with weak matches.`,
    },
    {
      q: 'How are these picks chosen?',
      a: `We start with TMDB's "similar titles" API for ${sourceTitle}, then re-rank by vote average and release year. Bynge does not accept paid placement on editorial lists.`,
    },
    {
      q: `Is ${sourceTitle} a movie or a TV show?`,
      a:
        kind === 'movie'
          ? `This page treats ${sourceTitle} as a film and recommends other movies. If you meant a series with a similar name, try searching from the Shows browse page.`
          : `This page treats ${sourceTitle} as a TV series and recommends other shows. If you meant a film, try the Movies section or search again.`,
    },
    {
      q: 'How often is this list updated?',
      a: 'Whenever underlying TMDB ratings shift — typically daily. Rankings can move as new seasons premiere or older titles get rediscovered.',
    },
  ];
}

export function buildLikeJsonLd({ siteOrigin, slug, kind, sourceTitle, recommendations }) {
  const kindLabel = getKindLabel(kind);
  const pageUrl = `${siteOrigin}/like/${slug}`;
  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: siteOrigin },
        { '@type': 'ListItem', position: 2, name: 'Similar picks', item: `${siteOrigin}/like` },
        {
          '@type': 'ListItem',
          position: 3,
          name: `${kindLabel} like ${sourceTitle}`,
          item: pageUrl,
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `${kindLabel} like ${sourceTitle}`,
      url: pageUrl,
      numberOfItems: recommendations.length,
      itemListElement: recommendations.slice(0, 20).map((r, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${siteOrigin}/${kind === 'movie' ? 'movie' : 'show'}/${r.id}`,
        item: {
          '@type': kind === 'movie' ? 'Movie' : 'TVSeries',
          name: r.title || r.name,
        },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: getLikeFaq(kind, sourceTitle).map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ];
  return schemas;
}
