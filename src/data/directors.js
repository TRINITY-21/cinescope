/**
 * Director list registry — feeds /director/:slug pages and (optionally)
 * Best Of entries via the `director` source type.
 *
 * Each director has a TMDB person id; the loader hits
 *   /person/:id/movie_credits
 * and filters their directorial work, sorted by rating.
 *
 * Anchor backdrop is the director's flagship film's tmdbId — used for the
 * index card and detail-page ambient backdrop.
 */

export const DIRECTORS = [
  {
    slug: 'christopher-nolan',
    name: 'Christopher Nolan',
    tmdbPersonId: 525,
    anchorTmdbId: 27205, // Inception
    hookline: 'IMAX-scaled spectacle with puzzle-box intelligence.',
    intro:
      'Christopher Nolan turned blockbuster filmmaking into a thinking-person\'s genre — practical-effects spectacle wrapped around time-loop puzzles, identity riddles and moral weight. Every film here is built to be argued about for years after release.',
  },
  {
    slug: 'quentin-tarantino',
    name: 'Quentin Tarantino',
    tmdbPersonId: 138,
    anchorTmdbId: 680, // Pulp Fiction
    hookline: 'Crackling dialogue, deep cinephilia, unhinged violence.',
    intro:
      'Tarantino reset the rules of independent filmmaking in the 90s and never stopped re-writing them. His films are loud, talky, indulgent, profane, and unmistakable from frame one — and most of them rank among the best of their decade.',
  },
  {
    slug: 'martin-scorsese',
    name: 'Martin Scorsese',
    tmdbPersonId: 1032,
    anchorTmdbId: 1422, // The Departed
    hookline: 'Half a century of American cinema, near-perfectly executed.',
    intro:
      'Scorsese\'s filmography is the closest thing modern American cinema has to a complete textbook — crime epics, religious meditations, music documentaries, biopics, and the late-career works that prove his eye sharpens with age.',
  },
  {
    slug: 'steven-spielberg',
    name: 'Steven Spielberg',
    tmdbPersonId: 488,
    anchorTmdbId: 329, // Jurassic Park
    hookline: 'The director who built the modern blockbuster.',
    intro:
      'Spielberg invented the summer movie, redefined the family film, and somewhere along the way became one of the most reliable dramatic directors alive. From Jaws to Schindler\'s List to The Fabelmans, nobody else has a range like this.',
  },
  {
    slug: 'stanley-kubrick',
    name: 'Stanley Kubrick',
    tmdbPersonId: 240,
    anchorTmdbId: 694, // The Shining
    hookline: 'Perfectionism as filmmaking philosophy.',
    intro:
      'Kubrick worked across more genres than any other major director — sci-fi, war, horror, costume drama, satire — and made canon-level films in every one of them. A small filmography, an outsized influence.',
  },
  {
    slug: 'denis-villeneuve',
    name: 'Denis Villeneuve',
    tmdbPersonId: 137427,
    anchorTmdbId: 438631, // Dune Part One
    hookline: 'Patience, scale, and absolute control of frame.',
    intro:
      'Villeneuve\'s films feel like nothing else being made — deliberately paced, beautifully designed, often quiet, and built around a central moral question that refuses easy answers. From Sicario to Arrival to Dune, the consistency is staggering.',
  },
  {
    slug: 'paul-thomas-anderson',
    name: 'Paul Thomas Anderson',
    tmdbPersonId: 4762,
    anchorTmdbId: 7345, // There Will Be Blood
    hookline: 'The most idiosyncratic American director of his generation.',
    intro:
      'PT Anderson makes films that don\'t look or sound like anyone else\'s — long takes, character-first writing, formal swings that shouldn\'t work and somehow do. Boogie Nights, Magnolia, There Will Be Blood, The Master, Phantom Thread.',
  },
  {
    slug: 'wes-anderson',
    name: 'Wes Anderson',
    tmdbPersonId: 5655,
    anchorTmdbId: 120467, // Grand Budapest Hotel
    hookline: 'Symmetry, pastels, and emotional depth hiding under whimsy.',
    intro:
      'Anderson\'s visual signature is so distinctive it\'s become its own genre — but beneath the dollhouse aesthetics are some of the most quietly devastating family films of the last 25 years. Rushmore, The Royal Tenenbaums, Moonrise Kingdom, Grand Budapest.',
  },
  {
    slug: 'david-fincher',
    name: 'David Fincher',
    tmdbPersonId: 7467,
    anchorTmdbId: 550, // Fight Club
    hookline: 'Procedural rigor applied to thrillers and obsession.',
    intro:
      'Fincher\'s films are immaculately controlled — every shot considered, every cut on the beat. He made the definitive serial-killer film (Zodiac), the definitive tech-origin story (The Social Network), and the cult phenomenon that won\'t die (Fight Club).',
  },
  {
    slug: 'greta-gerwig',
    name: 'Greta Gerwig',
    tmdbPersonId: 45400,
    anchorTmdbId: 346698, // Barbie
    hookline: 'Coming-of-age specificity, mainstream reach.',
    intro:
      'Gerwig\'s three directorial features — Lady Bird, Little Women, Barbie — each redefined what their genre could do commercially and critically. One of the most exciting filmmakers working.',
  },
  {
    slug: 'jordan-peele',
    name: 'Jordan Peele',
    tmdbPersonId: 116296,
    anchorTmdbId: 419430, // Get Out
    hookline: 'Horror as social allegory, sharply executed.',
    intro:
      'Peele turned modern horror into a vehicle for big ideas without sacrificing craft or scares. Get Out, Us, Nope — three films, three completely different premises, all of them brought to the highest tier of the genre.',
  },
  {
    slug: 'kathryn-bigelow',
    name: 'Kathryn Bigelow',
    tmdbPersonId: 6464,
    anchorTmdbId: 12162, // The Hurt Locker
    hookline: 'Kinetic, unsentimental, masterful with tension.',
    intro:
      'Bigelow specializes in films that put you in rooms most movies are too scared to enter — bomb-disposal teams, raid units, undercover ops. The Hurt Locker. Zero Dark Thirty. Point Break. Strange Days. A working director\'s director.',
  },
  {
    slug: 'spike-lee',
    name: 'Spike Lee',
    tmdbPersonId: 5281,
    anchorTmdbId: 757, // Do the Right Thing
    hookline: 'Urgent, formally inventive, four decades of essential cinema.',
    intro:
      'Lee\'s filmography is the most important sustained body of work in American cinema about Black life — Do the Right Thing, Malcolm X, 25th Hour, BlacKkKlansman, Da 5 Bloods. He keeps making essential films decades into his career.',
  },
  {
    slug: 'bong-joon-ho',
    name: 'Bong Joon-ho',
    tmdbPersonId: 21684,
    anchorTmdbId: 496243, // Parasite
    hookline: 'Genre-blending precision, class allegory built into the bones.',
    intro:
      'Bong won the Best Picture Oscar with a subtitled film about class inequality. His earlier work — Memories of Murder, The Host, Mother — is just as strong. Every film is a different genre, every film is unmistakably his.',
  },
  {
    slug: 'hayao-miyazaki',
    name: 'Hayao Miyazaki',
    tmdbPersonId: 608,
    anchorTmdbId: 129, // Spirited Away
    anchorKind: 'movie',
    hookline: 'Studio Ghibli\'s soul. Animation that justifies the form.',
    intro:
      'Miyazaki\'s films are the gold standard for animated storytelling — hand-drawn worlds, environmental themes, complex child protagonists, and an unflinching willingness to sit with melancholy. Spirited Away, Princess Mononoke, My Neighbor Totoro, Howl\'s Moving Castle.',
  },
];

export function findDirector(slug) {
  return DIRECTORS.find((d) => d.slug === slug) || null;
}
