/**
 * RSS 2.0 feed of Bynge "Best Of" lists.
 *
 * Subscribed-to by aggregators (Feedly, NetNewsWire, Reeder, etc.) and used
 * by services like Substack and IFTTT to syndicate content. Also picked up
 * by Google's RSS feed reader and the public-feeds backbone, which is a
 * cheap inbound-link source.
 *
 * Cached at the edge for 1h with stale-while-revalidate.
 */

import { BEST_LISTS } from '../src/data/bestLists.js';
import { DIRECTORS } from '../src/data/directors.js';

const SITE_URL = (process.env.SITE_URL || 'https://bynge.app').replace(/\/$/, '');
const FEED_TITLE = 'Bynge — Lists & Rankings';
const FEED_DESCRIPTION =
  'Hand-ranked lists of the best movies and TV shows — refreshed continuously. By streaming service, year, decade, mood and director.';

function escapeXml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function rfc822(date) {
  return new Date(date).toUTCString();
}

function itemEntry({ title, url, description, guid, pubDate, category }) {
  return `    <item>
      <title>${escapeXml(title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(guid || url)}</guid>
      <pubDate>${rfc822(pubDate)}</pubDate>
      ${category ? `<category>${escapeXml(category)}</category>` : ''}
      <description>${escapeXml(description)}</description>
    </item>`;
}

export default async function handler(req, res) {
  const now = new Date();
  const items = [];

  // Best Of list pages — most recent first by category, freshly-refreshed at the top.
  // Stagger the pubDates so feed readers don't dump them in a single batch.
  let offset = 0;
  for (const list of BEST_LISTS) {
    const url = `${SITE_URL}/best/${list.slug}`;
    items.push(
      itemEntry({
        title: list.title,
        url,
        description: list.intro || list.hookline || `Hand-ranked list on Bynge: ${list.title}`,
        pubDate: new Date(now.getTime() - offset * 60 * 60 * 1000),
        category: list.category,
      }),
    );
    offset += 1;
  }

  // Director filmography pages — secondary section so the feed isn't all best-of.
  for (const d of DIRECTORS) {
    const url = `${SITE_URL}/director/${d.slug}`;
    items.push(
      itemEntry({
        title: `Best ${d.name} Movies, Ranked`,
        url,
        description: d.intro,
        pubDate: new Date(now.getTime() - offset * 60 * 60 * 1000),
        category: 'director',
      }),
    );
    offset += 1;
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(FEED_TITLE)}</title>
    <link>${SITE_URL}/best</link>
    <atom:link href="${SITE_URL}/api/rss.xml" rel="self" type="application/rss+xml" />
    <description>${escapeXml(FEED_DESCRIPTION)}</description>
    <language>en-us</language>
    <lastBuildDate>${rfc822(now)}</lastBuildDate>
    <ttl>60</ttl>
${items.join('\n')}
  </channel>
</rss>`;

  res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(xml);
}
