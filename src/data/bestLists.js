/**
 * "Best of" SEO lists — single config drives every /best/:slug page.
 *
 * Each entry describes how a list page sources its rows, how it ranks them,
 * and what hand-written editorial copy wraps the data. Adding a new list is
 * a single object: no new components, no new routes.
 *
 * Source types (the loader in BestPage.jsx implements each):
 *   - 'top-rated' — TMDB top_rated, optionally pulling several pages
 *   - 'provider'  — TMDB discover filtered to a watch_provider (id from streamingProviders.js)
 *   - 'year'      — TMDB discover with primary_release_year
 *   - 'decade'    — TMDB discover with date range
 *   - 'curated'   — hand-picked tmdbIds (preserves order)
 *
 * After the loader resolves rows, each row is enriched with a Bynge Score
 * and (optionally) a hand-written `blurb` keyed by tmdbId.
 *
 * Keep this list ranked by indexing priority (bigger search volume first)
 * so the sitemap and Discover dropdown surface them in a sane order.
 */

export const BEST_LISTS = [
  /* ──────────────────  TIER 1: all-time evergreens  ────────────────── */
  {
    slug: 'movies-of-all-time',
    category: 'all-time',
    kind: 'movie',
    anchorTmdbId: 278,              // The Shawshank Redemption — iconic top of the canon
    title: 'The 100 Best Movies of All Time',
    hookline: 'Cinema\'s undisputed greats, ranked.',
    intro:
      'These are the 100 films that show up on critics\' lists, historians\' syllabi, and the personal hall-of-fames of anyone who takes movies seriously. Ranked by Bynge Score — our metric combining IMDb, Rotten Tomatoes, Metacritic, audience signal, and cultural relevance — this list is dominated by tight craft, emotional payoff, and the kind of storytelling that holds up on a fifth watch as well as a first.',
    source: { type: 'top-rated', mediaType: 'movie', pages: 5, voteCountGte: 5000 },
    limit: 100,
    related: ['tv-shows-of-all-time', 'movies-of-2025', 'netflix-movies'],
    faq: [
      {
        q: 'How is "best" determined?',
        a: 'We weight each title by Bynge Score, which blends TMDB rating, IMDb rating, Rotten Tomatoes critic score, Metacritic, and audience volume. Cultural staying power gets a small boost via fanart and ongoing search interest.',
      },
      {
        q: 'How often is the list refreshed?',
        a: 'Daily. Underlying ratings tick over as TMDB and OMDB update, and the ranking re-sorts automatically.',
      },
      {
        q: 'Why is my favorite not on here?',
        a: 'A 7.5+ rating with thousands of votes is the minimum bar. Cult favorites with thin vote counts often miss out — we surface those separately on the Hidden Gems page.',
      },
    ],
  },
  {
    slug: 'tv-shows-of-all-time',
    category: 'all-time',
    kind: 'tv',
    anchorTmdbId: 1396,             // Breaking Bad — TMDB's #1 TV title
    anchorKind: 'tv',
    title: 'The 100 Best TV Shows of All Time',
    hookline: 'Prestige television, era-defining sitcoms, and the long-format greats.',
    intro:
      'The shows that re-set what television could be — from the slow-burn dramas of the prestige era to the comedies that scored a thousand quotes. Ranked by Bynge Score across critic consensus, audience love, and cultural reach. Whether you\'re catching up on a classic or planning your next binge, start here.',
    source: { type: 'top-rated', mediaType: 'tv', pages: 5, voteCountGte: 1000 },
    limit: 100,
    related: ['movies-of-all-time', 'netflix-shows', 'tv-shows-of-2025'],
    faq: [
      {
        q: 'Are limited series counted?',
        a: 'Yes — anything TMDB classifies as a series (mini, anthology, ongoing) is eligible.',
      },
      {
        q: 'How do shorter-run shows compare to long ones?',
        a: 'The Bynge Score is per-show, not per-episode-count, so a tight 10-episode masterpiece can outrank a 200-episode juggernaut.',
      },
    ],
  },

  /* ──────────────────  TIER 1: platform commercial intent  ────────────────── */
  {
    slug: 'netflix-movies',
    category: 'platform',
    kind: 'movie',
    anchorTmdbId: 661374,           // Glass Onion — Netflix original with strong backdrop
    title: 'The 50 Best Movies on Netflix Right Now',
    hookline: 'What\'s actually worth watching on Netflix this week.',
    intro:
      'Netflix\'s catalog rotates constantly, and most of what\'s on the home page is filler. This list cuts to the films currently streaming with the highest Bynge Scores — refreshed daily as titles enter and leave the service. Includes Netflix Originals, licensed catalog, and Oscar-winners hiding in the back rows.',
    source: { type: 'provider', mediaType: 'movie', providerTmdbId: 8 },
    limit: 50,
    related: ['netflix-shows', 'disney-plus-movies', 'movies-of-all-time'],
    providerSlug: 'netflix',
    faq: [
      {
        q: 'Why are some titles missing?',
        a: 'Streaming rights expire constantly. If a title left Netflix this week, it\'s gone from this list within 24 hours.',
      },
      {
        q: 'Does this work outside the US?',
        a: 'The list defaults to US availability. Country support is on the roadmap.',
      },
    ],
  },
  {
    slug: 'netflix-shows',
    category: 'platform',
    kind: 'tv',
    anchorTmdbId: 66732,            // Stranger Things — iconic Netflix show
    anchorKind: 'tv',
    title: 'The 50 Best Shows on Netflix Right Now',
    hookline: 'The TV worth your Netflix subscription this month.',
    intro:
      'From watercooler dramas to under-the-radar imports, these are the 50 best shows currently streaming on Netflix — ranked by Bynge Score and refreshed continuously. Skip the algorithm\'s carousel and start here.',
    source: { type: 'provider', mediaType: 'tv', providerTmdbId: 8 },
    limit: 50,
    related: ['netflix-movies', 'disney-plus-shows', 'tv-shows-of-all-time'],
    providerSlug: 'netflix',
    faq: [
      {
        q: 'Are international shows included?',
        a: 'Yes — any series streaming on Netflix in the US is eligible, regardless of country of origin.',
      },
    ],
  },
  {
    slug: 'disney-plus-movies',
    category: 'platform',
    kind: 'movie',
    anchorTmdbId: 299536,           // Avengers: Infinity War — flagship Disney+ title
    title: 'The 30 Best Movies on Disney+ Right Now',
    hookline: 'Marvel, Star Wars, Pixar, and everything in between.',
    intro:
      'Disney+ is the most uniform of the major services — every title is a near-known quantity. This list pulls the highest-rated films currently streaming, blending the Marvel Cinematic Universe, the Star Wars saga, Pixar\'s gauntlet of tearjerkers, and the studio\'s deep animated catalog into a single ranked feed.',
    source: { type: 'provider', mediaType: 'movie', providerTmdbId: 337 },
    limit: 30,
    related: ['netflix-movies', 'movies-of-all-time'],
    providerSlug: 'disney-plus',
    faq: [
      {
        q: 'Does this include 20th Century / Hulu catalog?',
        a: 'Only titles available on Disney+ proper. Hulu titles are tracked separately.',
      },
    ],
  },

  /* ──────────────────  TIER 1: time-pegged  ────────────────── */
  {
    slug: 'movies-of-2025',
    category: 'year',
    kind: 'movie',
    anchorTmdbId: 1061474,          // Superman (2025)
    title: 'The 50 Best Movies of 2025',
    hookline: 'The year\'s standouts, ranked as the votes roll in.',
    intro:
      'This year\'s strongest movies — refreshed every day as new ratings come in. The mix shifts month to month: festival darlings break out, blockbusters consolidate their numbers, and quieter releases climb as word of mouth spreads. Ranked by Bynge Score with a small freshness boost for recent breakouts.',
    source: { type: 'year', mediaType: 'movie', year: 2025 },
    limit: 50,
    related: ['movies-of-all-time', 'movies-of-2024'],
    faq: [
      {
        q: 'When does the list "lock"?',
        a: 'Never. We re-rank daily through the year and into the next as late-cycle awards-season titles climb.',
      },
    ],
  },
  {
    slug: 'tv-shows-of-2025',
    category: 'year',
    kind: 'tv',
    anchorTmdbId: 95396,            // Severance — S2 hit 2025
    anchorKind: 'tv',
    title: 'The 50 Best TV Shows of 2025',
    hookline: 'This year\'s best premieres and standout seasons.',
    intro:
      'The shows that took over the conversation this year — new premieres, returning seasons, limited runs and everything in between. Ranked by Bynge Score and refreshed daily.',
    source: { type: 'year', mediaType: 'tv', year: 2025 },
    limit: 50,
    related: ['tv-shows-of-all-time', 'netflix-shows'],
    faq: [],
  },

  /* ──────────────────  TIER 1: seasonal (hand-curated)  ────────────────── */
  {
    slug: 'christmas-movies',
    category: 'seasonal',
    kind: 'movie',
    title: '25 Best Christmas Movies to Watch This Holiday Season',
    hookline: 'From timeless classics to modern comfort-watches.',
    intro:
      'Whether your Christmas tradition runs to Capra-style sentiment, Bill Murray cynicism, or full-throated Will Ferrell sugar-rush, there\'s a film here for the mood. This list spans the genre\'s entire range — animated family fare, biting comedies, sweeping romances and the action films half the internet swears count as Christmas movies.',
    source: {
      type: 'curated',
      mediaType: 'movie',
      tmdbIds: [
        9479,    // The Nightmare Before Christmas
        12637,   // Elf
        10719,   // Love Actually
        787,     // Home Alone
        2295,    // Home Alone 2
        1271,    // 300 -- placeholder will be filtered if missing
        9043,    // It's a Wonderful Life
        787,
        9788,    // Bad Santa
        10733,   // Scrooged
        10366,   // A Christmas Story
        18785,   // The Polar Express
        1574,    // Die Hard (debatable, but yes)
        13549,   // National Lampoon's Christmas Vacation
        13476,   // The Holiday
        38356,   // Arthur Christmas
        18820,   // The Santa Clause
        9023,    // Miracle on 34th Street
        15301,   // The Family Stone
        13568,   // Last Christmas (note: not the 2019 one)
      ],
    },
    limit: 20,
    related: ['halloween-movies', 'movies-of-all-time'],
    faq: [
      {
        q: 'Is Die Hard a Christmas movie?',
        a: 'It\'s set on Christmas Eve at a Christmas party with a Christmas soundtrack. We\'re going with yes.',
      },
      {
        q: 'When is this list updated?',
        a: 'Hand-curated and reviewed each November.',
      },
    ],
  },
  /* ──────────────────  GENRES — huge ongoing search volume  ────────────────── */
  {
    slug: 'best-horror-movies',
    category: 'genre',
    kind: 'movie',
    anchorTmdbId: 694,              // The Shining
    title: 'The 50 Best Horror Movies of All Time',
    hookline: 'From slow-creeping dread to all-out terror.',
    intro:
      'Horror in its widest sense — supernatural, slasher, psychological, folk, body, found-footage. Ranked by Bynge Score, which weighs critic consensus equally with audience reaction so the genre\'s most divisive masterpieces don\'t get penalized for splitting the room.',
    source: { type: 'genre', mediaType: 'movie', genreId: 27 },
    limit: 50,
    related: ['best-thriller-movies', 'halloween-movies', 'movies-of-all-time'],
    faq: [
      { q: 'Are foreign horror films included?', a: 'Yes. South Korean, Spanish, Japanese, and French horror often outrank the Hollywood entries.' },
      { q: 'Why no jump-scare ratings?', a: 'TMDB doesn\'t track that. For sustained dread vs. shock-heavy lists, browse genre subfilters on the discover page.' },
    ],
  },
  {
    slug: 'best-comedy-movies',
    category: 'genre',
    kind: 'movie',
    anchorTmdbId: 105,               // Back to the Future
    title: 'The 50 Best Comedy Movies of All Time',
    hookline: 'Laugh-out-loud, smart-and-witty, and quotable forever.',
    intro:
      'A spread from screwball classics to modern absurdist comedy. Ranked by Bynge Score with an emphasis on cross-generational durability — the films people still watch twenty years later, not just the ones that opened big.',
    source: { type: 'genre', mediaType: 'movie', genreId: 35 },
    limit: 50,
    related: ['best-romance-movies', 'movies-of-all-time'],
    faq: [],
  },
  {
    slug: 'best-action-movies',
    category: 'genre',
    kind: 'movie',
    anchorTmdbId: 76341,             // Mad Max: Fury Road
    title: 'The 50 Best Action Movies of All Time',
    hookline: 'High stakes, choreographed chaos, ranked.',
    intro:
      'The films that pushed the action genre forward — practical-effects spectacle, kinetic editing, immaculate fight choreography, and the rare blockbuster that earns its runtime. Bynge Score weights craft over pure box office.',
    source: { type: 'genre', mediaType: 'movie', genreId: 28 },
    limit: 50,
    related: ['best-thriller-movies', 'best-sci-fi-movies'],
    faq: [],
  },
  {
    slug: 'best-sci-fi-movies',
    category: 'genre',
    kind: 'movie',
    anchorTmdbId: 157336,            // Interstellar
    title: 'The 50 Best Sci-Fi Movies of All Time',
    hookline: 'Time, space, machines, and what it means to be human.',
    intro:
      'Science fiction at its most ambitious — first-contact stories, time-loop puzzles, dystopian futures and the philosophical thrillers that refuse easy answers. Ranked by Bynge Score, with a small boost for original ideas over franchise sequels.',
    source: { type: 'genre', mediaType: 'movie', genreId: 878 },
    limit: 50,
    related: ['best-action-movies', 'movies-of-all-time'],
    faq: [],
  },
  {
    slug: 'best-thriller-movies',
    category: 'genre',
    kind: 'movie',
    anchorTmdbId: 680,               // Pulp Fiction
    title: 'The 50 Best Thriller Movies of All Time',
    hookline: 'Slow-burn tension, twist endings, can\'t-look-away storytelling.',
    intro:
      'Thrillers in every flavor — psychological, neo-noir, conspiracy, courtroom, heist. The films that grip from the first scene and trade payoff for sustained unease, ranked by Bynge Score.',
    source: { type: 'genre', mediaType: 'movie', genreId: 53 },
    limit: 50,
    related: ['best-horror-movies', 'best-action-movies'],
    faq: [],
  },
  {
    slug: 'best-romance-movies',
    category: 'genre',
    kind: 'movie',
    anchorTmdbId: 597,                // Titanic
    title: 'The 50 Best Romance Movies of All Time',
    hookline: 'The love stories worth your evening.',
    intro:
      'From sweeping epics to quiet two-hander dramas — the romance films that built the genre and the modern entries that still know how to land an ending. Ranked by Bynge Score with weight given to emotional craft.',
    source: { type: 'genre', mediaType: 'movie', genreId: 10749 },
    limit: 50,
    related: ['valentines-day-movies', 'best-comedy-movies'],
    faq: [],
  },
  {
    slug: 'best-animated-movies',
    category: 'genre',
    kind: 'movie',
    anchorTmdbId: 129,                // Spirited Away
    title: 'The 50 Best Animated Movies of All Time',
    hookline: 'From Pixar peaks to Studio Ghibli, hand-drawn to CGI.',
    intro:
      'Animation pushed every direction at once — emotional gut-punches from Pixar, dreamlike fantasies from Ghibli, anarchic comedy, and the recent boom of inventive 2D from studios like Cartoon Saloon. Ranked by Bynge Score, all ages.',
    source: { type: 'genre', mediaType: 'movie', genreId: 16 },
    limit: 50,
    related: ['family-movies', 'movies-of-all-time'],
    faq: [],
  },
  {
    slug: 'best-documentaries',
    category: 'genre',
    kind: 'movie',
    anchorTmdbId: 76203,              // 12 Years a Slave (placeholder anchor — strong backdrop)
    title: 'The 50 Best Documentaries of All Time',
    hookline: 'True stories, perfectly framed.',
    intro:
      'The documentaries that changed how their subjects are understood — sports, music, true crime, social movements, science, food, and the deeply personal portraits in between. Ranked by Bynge Score.',
    source: { type: 'genre', mediaType: 'movie', genreId: 99 },
    limit: 50,
    related: ['movies-of-all-time'],
    faq: [],
  },

  /* ──────────────────  GENRE TV  ────────────────── */
  {
    slug: 'best-drama-shows',
    category: 'genre',
    kind: 'tv',
    anchorTmdbId: 1396,
    anchorKind: 'tv',
    title: 'The 50 Best Drama TV Shows of All Time',
    hookline: 'Prestige TV at its most rewarding.',
    intro:
      'The dramas that defined modern television — antiheroes, ensemble crime sagas, family epics, and the limited series that proved short runs can outshine multi-season behemoths. Ranked by Bynge Score.',
    source: { type: 'genre', mediaType: 'tv', genreId: 18, voteCountGte: 200 },
    limit: 50,
    related: ['tv-shows-of-all-time', 'best-thriller-movies'],
    faq: [],
  },
  {
    slug: 'best-comedy-shows',
    category: 'genre',
    kind: 'tv',
    anchorTmdbId: 1668,
    anchorKind: 'tv',
    title: 'The 50 Best Comedy TV Shows of All Time',
    hookline: 'Sitcoms, mockumentaries, single-cam triumphs.',
    intro:
      'From quotable network sitcoms to the modern single-cam comedy renaissance — the shows that landed a thousand jokes and stayed funny on rewatch. Ranked by Bynge Score.',
    source: { type: 'genre', mediaType: 'tv', genreId: 35, voteCountGte: 200 },
    limit: 50,
    related: ['tv-shows-of-all-time'],
    faq: [],
  },

  /* ──────────────────  MORE PLATFORMS  ────────────────── */
  {
    slug: 'max-movies',
    category: 'platform',
    kind: 'movie',
    anchorTmdbId: 49026,               // The Dark Knight Rises (HBO/Max signature)
    providerSlug: 'max',
    title: 'The 50 Best Movies on Max Right Now',
    hookline: 'HBO\'s catalog, plus the modern Max additions.',
    intro:
      'Max carries one of streaming\'s deepest catalogs — decades of HBO prestige, the entire Warner Bros library, and a steady stream of theatrical-window originals. This list cuts to the highest-rated films currently streaming, refreshed daily.',
    source: { type: 'provider', mediaType: 'movie', providerTmdbId: 1899 },
    limit: 50,
    related: ['max-shows', 'best-drama-shows'],
    faq: [],
  },
  {
    slug: 'max-shows',
    category: 'platform',
    kind: 'tv',
    anchorTmdbId: 1399,                // Game of Thrones
    anchorKind: 'tv',
    providerSlug: 'max',
    title: 'The 50 Best Shows on Max Right Now',
    hookline: 'Prestige TV, all in one place.',
    intro:
      'HBO\'s legacy of era-defining drama plus everything Max has rolled in since the rebrand. Ranked by Bynge Score, refreshed daily as the catalog rotates.',
    source: { type: 'provider', mediaType: 'tv', providerTmdbId: 1899 },
    limit: 50,
    related: ['max-movies', 'best-drama-shows'],
    faq: [],
  },
  {
    slug: 'hulu-shows',
    category: 'platform',
    kind: 'tv',
    anchorTmdbId: 60625,                // Rick and Morty (popular Hulu sim)
    anchorKind: 'tv',
    providerSlug: 'hulu',
    title: 'The 50 Best Shows on Hulu Right Now',
    hookline: 'Network TV powerhouse plus the FX originals.',
    intro:
      'Hulu sits where current-season network TV, FX prestige drama and a deep film catalog meet. This list ranks every series currently streaming on Hulu by Bynge Score and refreshes daily.',
    source: { type: 'provider', mediaType: 'tv', providerTmdbId: 15 },
    limit: 50,
    related: ['hulu-movies', 'best-drama-shows'],
    faq: [],
  },
  {
    slug: 'hulu-movies',
    category: 'platform',
    kind: 'movie',
    anchorTmdbId: 530385,                // Midsommar (A24/Hulu)
    providerSlug: 'hulu',
    title: 'The 30 Best Movies on Hulu Right Now',
    hookline: 'Indies, recent theatrical, and prestige picks.',
    intro:
      'Hulu\'s movie catalog rotates aggressively but leans heavier on prestige indie and recent A24 fare than the other majors. This list pulls what\'s currently streaming and worth your night.',
    source: { type: 'provider', mediaType: 'movie', providerTmdbId: 15 },
    limit: 30,
    related: ['hulu-shows'],
    faq: [],
  },
  {
    slug: 'prime-video-movies',
    category: 'platform',
    kind: 'movie',
    anchorTmdbId: 335977,                // Indiana Jones and the Dial of Destiny
    providerSlug: 'prime-video',
    title: 'The 50 Best Movies on Prime Video Right Now',
    hookline: 'Amazon\'s sprawling catalog, cut to the worth-watching shortlist.',
    intro:
      'Prime Video carries one of the largest film catalogs of any major service — and one of the most uneven. This list filters to what\'s actually worth your evening, ranked by Bynge Score, refreshed daily.',
    source: { type: 'provider', mediaType: 'movie', providerTmdbId: 9 },
    limit: 50,
    related: ['prime-video-shows', 'netflix-movies'],
    faq: [],
  },
  {
    slug: 'prime-video-shows',
    category: 'platform',
    kind: 'tv',
    anchorTmdbId: 76479,                // The Boys
    anchorKind: 'tv',
    providerSlug: 'prime-video',
    title: 'The 50 Best Shows on Prime Video Right Now',
    hookline: 'The Originals that pulled their weight, plus the licensed catalog.',
    intro:
      'From The Boys to Reacher to the prestige period dramas, Prime Video\'s top-shelf TV stands up against any service. This list ranks the platform\'s best series, refreshed daily.',
    source: { type: 'provider', mediaType: 'tv', providerTmdbId: 9 },
    limit: 50,
    related: ['prime-video-movies', 'netflix-shows'],
    faq: [],
  },
  {
    slug: 'apple-tv-plus-shows',
    category: 'platform',
    kind: 'tv',
    anchorTmdbId: 95396,                // Severance
    anchorKind: 'tv',
    providerSlug: 'apple-tv-plus',
    title: 'The 30 Best Shows on Apple TV+ Right Now',
    hookline: 'Small catalog, alarmingly high hit rate.',
    intro:
      'Apple TV+ keeps its catalog small, but the hit rate is unmatched — Severance, Slow Horses, Ted Lasso, Silo, Pachinko. This list ranks every show currently streaming, all of it worth a watch.',
    source: { type: 'provider', mediaType: 'tv', providerTmdbId: 350 },
    limit: 30,
    related: ['apple-tv-plus-movies', 'netflix-shows'],
    faq: [],
  },
  {
    slug: 'apple-tv-plus-movies',
    category: 'platform',
    kind: 'movie',
    anchorTmdbId: 632727,                // Killers of the Flower Moon
    providerSlug: 'apple-tv-plus',
    title: 'The 20 Best Movies on Apple TV+ Right Now',
    hookline: 'Prestige originals and recent theatrical pickups.',
    intro:
      'Apple TV+ keeps its film slate boutique — Scorsese\'s Killers of the Flower Moon, CODA, Napoleon, and the Original films that bypassed traditional theatrical runs. This list ranks every movie currently streaming.',
    source: { type: 'provider', mediaType: 'movie', providerTmdbId: 350 },
    limit: 20,
    related: ['apple-tv-plus-shows'],
    faq: [],
  },

  /* ──────────────────  DECADES — programmatic-SEO gold  ────────────────── */
  {
    slug: 'movies-of-the-2010s',
    category: 'decade',
    kind: 'movie',
    anchorTmdbId: 27205,                // Inception
    title: 'The 50 Best Movies of the 2010s',
    hookline: 'The decade of franchises — and the indies that pushed back.',
    intro:
      'A decade dominated by the comic book studio system, but also one of the most varied indie booms ever — A24\'s rise, foreign-language breakthroughs, documentary renaissance, and the streaming explosion that changed distribution forever. Ranked by Bynge Score.',
    source: { type: 'decade', mediaType: 'movie', startYear: 2010, endYear: 2019 },
    limit: 50,
    related: ['movies-of-the-2000s', 'movies-of-all-time'],
    faq: [],
  },
  {
    slug: 'movies-of-the-2000s',
    category: 'decade',
    kind: 'movie',
    anchorTmdbId: 122,                  // LOTR: Return of the King
    title: 'The 50 Best Movies of the 2000s',
    hookline: 'Lord of the Rings, Pixar\'s prime, the indie boom.',
    intro:
      'The decade Hollywood went big on fantasy, Pixar hit its consecutive-classic streak, and the indie wave brought directors like PT Anderson, the Coens, and Christopher Nolan to widespread acclaim. Ranked by Bynge Score.',
    source: { type: 'decade', mediaType: 'movie', startYear: 2000, endYear: 2009 },
    limit: 50,
    related: ['movies-of-the-90s', 'movies-of-the-2010s'],
    faq: [],
  },
  {
    slug: 'movies-of-the-90s',
    category: 'decade',
    kind: 'movie',
    anchorTmdbId: 680,                  // Pulp Fiction
    title: 'The 50 Best Movies of the 90s',
    hookline: 'Tarantino, Pixar\'s birth, and the second indie revolution.',
    intro:
      'A decade that re-set independent filmmaking, kick-started CGI animation, and gave us the films that twenty-something cinephiles still won\'t shut up about. Ranked by Bynge Score.',
    source: { type: 'decade', mediaType: 'movie', startYear: 1990, endYear: 1999 },
    limit: 50,
    related: ['movies-of-the-2000s', 'movies-of-all-time'],
    faq: [],
  },

  /* ──────────────────  LAST YEAR + this year (rolling)  ────────────────── */
  {
    slug: 'movies-of-2024',
    category: 'year',
    kind: 'movie',
    anchorTmdbId: 533535,                // Deadpool & Wolverine
    title: 'The 50 Best Movies of 2024',
    hookline: 'The year in review, ranked.',
    intro:
      'The films that defined 2024 — from the late-cycle awards-season climbers to the blockbusters that earned their box office. Ranked by Bynge Score, finalized but still re-sorting as ratings settle.',
    source: { type: 'year', mediaType: 'movie', year: 2024 },
    limit: 50,
    related: ['movies-of-2025', 'movies-of-the-2010s'],
    faq: [],
  },
  {
    slug: 'tv-shows-of-2024',
    category: 'year',
    kind: 'tv',
    anchorTmdbId: 95396,                  // Severance (also strong 2024 presence)
    anchorKind: 'tv',
    title: 'The 50 Best TV Shows of 2024',
    hookline: 'The year\'s standout premieres and seasons.',
    intro:
      'Shogun. The Bear. Hacks. Slow Horses. The series that took over conversations in 2024 — new arrivals, returning juggernauts, and the limited runs that hit hardest. Ranked by Bynge Score.',
    source: { type: 'year', mediaType: 'tv', year: 2024 },
    limit: 50,
    related: ['tv-shows-of-2025', 'best-drama-shows'],
    faq: [],
  },

  /* ──────────────────  SEASONAL  ────────────────── */
  {
    slug: 'valentines-day-movies',
    category: 'seasonal',
    kind: 'movie',
    title: '25 Best Valentine\'s Day Movies',
    hookline: 'For the couples, the in-betweens, and the resolutely solo.',
    intro:
      'A range of moods — sweeping classics, sharp romcoms, complicated breakups, and the not-really-romances couples watch together anyway. This list spans the whole range so February 14 finds the right film for your night.',
    source: {
      type: 'curated',
      mediaType: 'movie',
      tmdbIds: [
        597, 313369, 19913, 4348, 858, 509, 6963, 24021, 11036, 82693,
        639, 114, 313106, 8048, 13442, 11631, 39419, 567, 313, 9802,
      ],
    },
    limit: 20,
    related: ['best-romance-movies', 'best-comedy-movies'],
    faq: [],
  },
  {
    slug: 'summer-blockbusters',
    category: 'seasonal',
    kind: 'movie',
    anchorTmdbId: 1726,                   // Iron Man (kicks off summer-blockbuster era)
    title: '30 Best Summer Blockbusters of All Time',
    hookline: 'Popcorn, spectacle, and the films that made the summer movie a calendar event.',
    intro:
      'The films that built the modern summer blockbuster — from Jaws and Star Wars through the Marvel run and into the streaming era. Hand-picked from the highest-rated wide-release summer entries since the 70s.',
    source: {
      type: 'curated',
      mediaType: 'movie',
      tmdbIds: [
        578, 11, 601, 78, 1726, 24428, 299536, 27205, 76341, 209112,
        559, 597, 89, 8587, 105, 122, 671, 38356, 9806, 9799,
      ],
    },
    limit: 20,
    related: ['best-action-movies', 'best-sci-fi-movies'],
    faq: [],
  },
  {
    slug: 'thanksgiving-movies',
    category: 'seasonal',
    kind: 'movie',
    title: '15 Best Thanksgiving Movies',
    hookline: 'Family chaos, gratitude, and the table-flip we all secretly want.',
    intro:
      'Thanksgiving cinema is a smaller niche than Christmas, but a genuine one — family-dysfunction comedies, road-trip ensembles, and the films you put on while the turkey rests. Hand-picked.',
    source: {
      type: 'curated',
      mediaType: 'movie',
      tmdbIds: [
        9056, 13453, 8049, 9398, 15059, 39419, 13409, 567, 1271, 9603,
        9882, 9806, 9802, 13442, 11631,
      ],
    },
    limit: 15,
    related: ['christmas-movies', 'best-comedy-movies'],
    faq: [],
  },

  /* ──────────────────  USE CASES  ────────────────── */
  {
    slug: 'family-movies',
    category: 'use-case',
    kind: 'movie',
    anchorTmdbId: 14160,                   // Up
    title: 'The 30 Best Family Movies of All Time',
    hookline: 'Films the whole family will actually enjoy — not just tolerate.',
    intro:
      'Animation studios figured out how to write for two audiences at once decades ago, and the best family films now hit emotional depth most adult dramas envy. Ranked by Bynge Score with weight on cross-generation appeal.',
    source: {
      type: 'curated',
      mediaType: 'movie',
      tmdbIds: [
        14160, 862, 12, 354912, 129, 9806, 10681, 109445, 11, 19,
        585, 38356, 808, 8587, 671, 22, 122917, 56831, 9788, 9479,
        17473, 38575, 161795, 150540, 38356, 49444, 11631, 9802, 13442, 9806,
      ],
    },
    limit: 25,
    related: ['best-animated-movies', 'best-comedy-movies'],
    faq: [],
  },
  {
    slug: 'feel-good-movies',
    category: 'use-case',
    kind: 'movie',
    anchorTmdbId: 122906,                   // About Time
    title: 'The 25 Best Feel-Good Movies',
    hookline: 'When the world feels heavy. Hand-picked.',
    intro:
      'No high-stakes thrillers, no devastating endings — just the films that genuinely lift the mood. Heartfelt, kind, often funny, and never cynical.',
    source: {
      type: 'curated',
      mediaType: 'movie',
      tmdbIds: [
        122906, 14160, 194, 228326, 346648, 2493, 38356, 109445, 76203, 354912,
        8587, 22, 9806, 9788, 13549, 39419, 9802, 11036, 11631, 567,
      ],
    },
    limit: 20,
    related: ['family-movies', 'best-romance-movies'],
    faq: [],
  },

  /* ──────────────────  BYNGE MOAT  ────────────────── */
  {
    slug: 'bynge-perfect-scores',
    category: 'moat',
    kind: 'movie',
    anchorTmdbId: 278,
    title: 'Bynge Perfect Scores: Movies Rated 9 or Higher',
    hookline: 'Our proprietary metric\'s top tier.',
    intro:
      'Bynge Score blends every major rating source plus cultural signal into a single 0–10 number. Anything above 9 is rare — these are the films that broke the rubric. Updated daily as scores move.',
    source: { type: 'bynge-perfect', mediaType: 'movie', pages: 10, minByngeScore: 9 },
    limit: 100,
    related: ['movies-of-all-time', 'best-drama-shows'],
    faq: [
      { q: 'Why so few entries?', a: 'A Bynge Score of 9+ requires consensus across critic ratings, audience volume, and freshness signals. Most years see fewer than a dozen new entries qualify.' },
    ],
  },

  {
    slug: 'halloween-movies',
    category: 'seasonal',
    kind: 'movie',
    title: '25 Best Halloween Movies to Watch in October',
    hookline: 'Spooky season, ranked from cozy to crawl-out-of-your-skin.',
    intro:
      'A spread of films for every Halloween mood — from gateway scares for jumpy beginners to the genuine modern classics. We cover slashers, supernatural horror, atmospheric folk horror, found footage, and the handful of "horror movies that aren\'t really that scary" that show up at every Halloween party.',
    source: {
      type: 'curated',
      mediaType: 'movie',
      tmdbIds: [
        947,     // Halloween (1978)
        694,     // The Shining
        9552,    // The Exorcist
        2667,    // The Blair Witch Project
        4232,    // Scream
        281957,  // The Conjuring
        381288,  // It (2017)
        491418,  // Hereditary
        530385,  // Midsommar
        653851,  // X
        551271,  // Nope
        776503,  // CODA placeholder
        497828,  // Smile
        882598,  // Talk to Me
        877269,  // Pearl
        676710,  // M3GAN
        272,     // Batman Begins placeholder
        9389,    // Sleepy Hollow
        78,      // Blade Runner placeholder
      ],
    },
    limit: 20,
    related: ['christmas-movies', 'movies-of-all-time'],
    faq: [
      {
        q: 'Are non-horror Halloween movies included?',
        a: 'A few crossovers like Beetlejuice and The Nightmare Before Christmas can show up on related cozy-October lists. This list focuses on horror proper.',
      },
    ],
  },
];

export function findBestList(slug) {
  return BEST_LISTS.find((l) => l.slug === slug) || null;
}

/** Group lists by category for the index page. Preserves the ordering above. */
export function groupBestLists() {
  const groups = new Map();
  for (const list of BEST_LISTS) {
    const key = list.category;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(list);
  }
  return [...groups.entries()].map(([category, lists]) => ({ category, lists }));
}

export const CATEGORY_META = {
  'all-time': {
    label: 'All-Time Greats',
    description: 'The canon — films and shows that show up on every critic\'s shortlist.',
  },
  'genre': {
    label: 'By Genre',
    description: 'The peak of each genre, ranked by Bynge Score.',
  },
  'platform': {
    label: 'By Streaming Service',
    description: 'What\'s actually worth watching on each platform, refreshed daily.',
  },
  'year': {
    label: 'By Year',
    description: 'The best of the most recent year, climbing in real time.',
  },
  'decade': {
    label: 'By Decade',
    description: 'The films that defined an era.',
  },
  'seasonal': {
    label: 'Holiday & Seasonal',
    description: 'Hand-picked lists for the times of year that come with a watchlist.',
  },
  'use-case': {
    label: 'For Every Mood',
    description: 'Lists tuned to what you actually want from your night.',
  },
  'moat': {
    label: 'Bynge Exclusives',
    description: 'Lists you won\'t find anywhere else — built on our proprietary metric.',
  },
};
