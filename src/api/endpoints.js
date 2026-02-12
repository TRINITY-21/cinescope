const BASE = 'https://api.tvmaze.com';

export const endpoints = {
  searchShows: (q) => `${BASE}/search/shows?q=${encodeURIComponent(q)}`,
  singleSearch: (q) => `${BASE}/singlesearch/shows?q=${encodeURIComponent(q)}`,
  searchPeople: (q) => `${BASE}/search/people?q=${encodeURIComponent(q)}`,

  show: (id, embeds = []) => {
    const params = embeds.map((e) => `embed[]=${e}`).join('&');
    return `${BASE}/shows/${id}${params ? '?' + params : ''}`;
  },
  showEpisodes: (id) => `${BASE}/shows/${id}/episodes`,
  showSeasons: (id) => `${BASE}/shows/${id}/seasons`,
  showCast: (id) => `${BASE}/shows/${id}/cast`,
  showCrew: (id) => `${BASE}/shows/${id}/crew`,
  showImages: (id) => `${BASE}/shows/${id}/images`,
  showAkas: (id) => `${BASE}/shows/${id}/akas`,

  seasonEpisodes: (id) => `${BASE}/seasons/${id}/episodes`,

  episode: (id) => `${BASE}/episodes/${id}`,

  person: (id) => `${BASE}/people/${id}`,
  personCast: (id) => `${BASE}/people/${id}/castcredits?embed=show`,
  personCrew: (id) => `${BASE}/people/${id}/crewcredits?embed=show`,

  schedule: (country = 'US', date) => {
    const params = new URLSearchParams({ country });
    if (date) params.set('date', date);
    return `${BASE}/schedule?${params}`;
  },
  scheduleWeb: (date) =>
    date ? `${BASE}/schedule/web?date=${date}` : `${BASE}/schedule/web`,

  showEpisodesWithSpecials: (id) => `${BASE}/shows/${id}/episodes?specials=1`,
  showEpisodesByDate: (id, date) => `${BASE}/shows/${id}/episodesbydate?date=${date}`,

  episodeGuestCast: (id) => `${BASE}/episodes/${id}/guestcast`,
  episodeGuestCrew: (id) => `${BASE}/episodes/${id}/guestcrew`,

  personGuestCast: (id) => `${BASE}/people/${id}/guestcastcredits?embed=show`,
  peopleIndex: (page = 0) => `${BASE}/people?page=${page}`,

  showUpdates: (since = 'day') => `${BASE}/updates/shows?since=${since}`,
  scheduleFull: () => `${BASE}/schedule/full`,

  showIndex: (page = 0) => `${BASE}/shows?page=${page}`,
};
