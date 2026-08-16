const FEEDS = [
  { id: 'spectrum', name: 'IEEE Spectrum', url: 'https://spectrum.ieee.org/feeds/feed.rss' },
  { id: 'semi', name: 'SemiEngineering', url: 'https://semiengineering.com/feed/' },
  { id: 'eetimes', name: 'EE Times', url: 'https://www.eetimes.com/feed/' },
  { id: 'ars', name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index' },
  { id: 'mit', name: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/' },
  { id: 'wired', name: 'Wired', url: 'https://www.wired.com/feed/rss' },
  { id: 'bbc', name: 'BBC Technology', url: 'https://feeds.bbci.co.uk/news/technology/rss.xml' },
];

function parseRSS(xml, sourceId, sourceName) {
  const items = [];
  // Match <item>...</item> or <entry>...</entry>
  const itemRegex = /<(?:item|entry)[\s>]([\s\S]*?)<\/(?:item|entry)>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];

    const title = (block.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/) || [])[1] || '';
    const link = (block.match(/<link[^>]*href="([^"]*)"/) || block.match(/<link[^>]*>([\s\S]*?)<\/link>/) || [])[1] || '';
    const desc = (block.match(/<(?:description|summary)[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/(?:description|summary)>/) || [])[1] || '';
    const date = (block.match(/<(?:pubDate|published|updated)[^>]*>([\s\S]*?)<\/(?:pubDate|published|updated)>/) || [])[1] || '';

    if (title && link) {
      // Strip HTML from description
      const cleanDesc = desc.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim().slice(0, 200);
      const cleanTitle = title.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();

      items.push({
        title: cleanTitle,
        link: link.trim(),
        description: cleanDesc,
        date: date.trim(),
        sourceId,
        sourceName,
      });
    }
  }

  return items.slice(0, 8); // Max 8 per source
}

export default async function handler(req, res) {
  // Set cache header - cache for 30 minutes
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');

  const sourceFilter = req.query.source || 'all';

  const feedsToFetch = sourceFilter === 'all'
    ? FEEDS
    : FEEDS.filter(f => f.id === sourceFilter);

  try {
    const results = await Promise.allSettled(
      feedsToFetch.map(async (feed) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        try {
          const resp = await fetch(feed.url, {
            signal: controller.signal,
            headers: { 'User-Agent': 'EnglishBoost/1.0 RSS Reader' },
          });
          clearTimeout(timeout);
          if (!resp.ok) return [];
          const xml = await resp.text();
          return parseRSS(xml, feed.id, feed.name);
        } catch {
          clearTimeout(timeout);
          return [];
        }
      })
    );

    let articles = [];
    for (const r of results) {
      if (r.status === 'fulfilled' && Array.isArray(r.value)) {
        articles = articles.concat(r.value);
      }
    }

    // Sort by date (newest first)
    articles.sort((a, b) => {
      const da = new Date(a.date || 0);
      const db = new Date(b.date || 0);
      return db - da;
    });

    return res.status(200).json({ articles: articles.slice(0, 30) });
  } catch (err) {
    console.error('Feed fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch feeds', articles: [] });
  }
}
