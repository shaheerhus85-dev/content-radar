const FETCH_TIMEOUT_MS = 12_000;

const COMMON_FEED_PATHS = [
  '/feed',
  '/feed.xml',
  '/rss',
  '/rss.xml',
  '/atom.xml',
  '/blog/feed',
  '/blog/feed.xml',
  '/blog/rss',
  '/blog/rss.xml',
  '/news/rss',
  '/news/rss.xml',
  '/changelog/rss',
  '/changelog/rss.xml',
  '/updates/rss',
  '/updates/rss.xml',
];

const COMMON_SITEMAP_PATHS = [
  '/sitemap.xml',
  '/sitemap_index.xml',
  '/sitemap-index.xml',
];

const PURPOSE_LABELS = {
  competitor: 'Competitor monitoring',
  content: 'Blog / content tracking',
  product: 'Product updates / changelog',
  seo: 'SEO content ideas',
  research: 'Industry research',
  custom: 'Custom monitoring',
};

const normalizePurpose = (purpose) => (
  Object.hasOwn(PURPOSE_LABELS, purpose) ? purpose : 'custom'
);

const normalizeUrl = (input) => {
  const rawUrl = String(input || '').trim();
  if (!rawUrl) {
    throw new Error('Website URL is required.');
  }

  const withProtocol = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
  const parsedUrl = new URL(withProtocol);

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('Only http and https website URLs are supported.');
  }

  parsedUrl.hash = '';
  return parsedUrl.toString();
};

const fetchText = async (url, accept) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: accept,
        'User-Agent': 'ContentRadar/1.0 SourceDiscovery',
      },
      redirect: 'follow',
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Request failed with ${response.status}`);
    }

    const text = await response.text();
    return {
      text,
      contentType: response.headers.get('content-type') || '',
      finalUrl: response.url || url,
    };
  } finally {
    clearTimeout(timeoutId);
  }
};

const readRequestBody = async (req) => {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }

  const rawBody = Buffer.concat(chunks).toString('utf8');
  return rawBody ? JSON.parse(rawBody) : {};
};

const decodeHtmlEntities = (value) => (
  value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
);

const getAttribute = (tag, attributeName) => {
  const pattern = new RegExp(`${attributeName}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i');
  const match = tag.match(pattern);
  return decodeHtmlEntities(match?.[2] || match?.[3] || match?.[4] || '');
};

const extractHtmlTitle = (html) => {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!match?.[1]) return '';

  return decodeHtmlEntities(match[1])
    .replace(/\s+/g, ' ')
    .trim();
};

const extractAlternateFeeds = (html, pageUrl) => {
  const linkTags = html.match(/<link\b[^>]*>/gi) || [];

  return linkTags
    .map((tag) => {
      const rel = getAttribute(tag, 'rel').toLowerCase();
      const type = getAttribute(tag, 'type').toLowerCase();
      const href = getAttribute(tag, 'href');
      const title = getAttribute(tag, 'title');

      if (!href || !rel.split(/\s+/).includes('alternate')) return null;

      if (type.includes('rss')) {
        return {
          url: new URL(href, pageUrl).toString(),
          type: 'rss',
          discoveryMethod: 'html-link',
          title,
        };
      }

      if (type.includes('atom')) {
        return {
          url: new URL(href, pageUrl).toString(),
          type: 'atom',
          discoveryMethod: 'html-link',
          title,
        };
      }

      return null;
    })
    .filter(Boolean);
};

const extractRobotSitemaps = (robotsText, origin) => (
  robotsText
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*sitemap\s*:\s*(.+)\s*$/i)?.[1]?.trim())
    .filter(Boolean)
    .map((url) => new URL(url, origin).toString())
);

const getFeedType = (text, contentType, requestedType) => {
  const sample = text.slice(0, 4000).toLowerCase();
  const normalizedContentType = contentType.toLowerCase();

  if (
    requestedType === 'atom'
    || normalizedContentType.includes('atom')
    || /<feed[\s>]/i.test(sample)
  ) {
    return 'atom';
  }

  if (
    requestedType === 'rss'
    || normalizedContentType.includes('rss')
    || /<rss[\s>]/i.test(sample)
    || /<rdf:rdf[\s>]/i.test(sample)
  ) {
    return 'rss';
  }

  return null;
};

const isSitemapXml = (text, contentType) => {
  const sample = text.slice(0, 4000).toLowerCase();
  return (
    contentType.toLowerCase().includes('xml')
    || /<urlset[\s>]/i.test(sample)
    || /<sitemapindex[\s>]/i.test(sample)
  ) && (
    /<urlset[\s>]/i.test(sample)
    || /<sitemapindex[\s>]/i.test(sample)
  );
};

const getPathRelevance = (url, purpose) => {
  const path = new URL(url).pathname.toLowerCase();
  let score = 0;

  if (/(feed|rss|atom)/.test(path)) score += 10;
  if (/(blog|news|articles|insights)/.test(path)) score += 14;
  if (/(changelog|release|updates|product)/.test(path)) score += 16;

  if (purpose === 'product' && /(changelog|release|updates|product)/.test(path)) score += 28;
  if ((purpose === 'content' || purpose === 'seo') && /(blog|news|articles|insights)/.test(path)) score += 24;
  if (purpose === 'research' && /(blog|news|research|insights)/.test(path)) score += 18;
  if (purpose === 'competitor' && /(blog|news|changelog|updates)/.test(path)) score += 12;

  return score;
};

const getTypeLabel = (candidate) => {
  const path = new URL(candidate.url).pathname.toLowerCase();

  if (candidate.type === 'sitemap') return 'Website sitemap fallback';
  if (candidate.type === 'webpage') return 'Basic page watch';
  if (/(changelog|release|updates)/.test(path)) return 'Product updates feed found';
  if (/(blog|news|articles|insights)/.test(path)) return 'Best content feed found';
  return 'Best feed found';
};

const getReason = (candidate, purpose) => {
  const purposeLabel = PURPOSE_LABELS[purpose];

  if (candidate.discoveryMethod === 'html-link') {
    return `The website advertises this feed directly, and it is a strong fit for ${purposeLabel.toLowerCase()}.`;
  }

  if (candidate.discoveryMethod === 'common-path') {
    return `This common publishing path responded with a valid feed for ${purposeLabel.toLowerCase()}.`;
  }

  if (candidate.discoveryMethod === 'robots') {
    return `The website lists this sitemap in robots.txt, so Content Radar can use it as a reliable fallback.`;
  }

  if (candidate.discoveryMethod === 'sitemap') {
    return `No dedicated feed was found, but this sitemap can still surface recently published pages.`;
  }

  return `No feed or sitemap was confirmed, so Content Radar can monitor the page itself as a basic fallback.`;
};

const scoreCandidate = (candidate, purpose) => {
  const baseScore = {
    rss: 82,
    atom: 80,
    sitemap: 52,
    webpage: 20,
  }[candidate.type] || 10;

  const methodBonus = {
    'html-link': 12,
    'common-path': 7,
    robots: 8,
    sitemap: 4,
    fallback: 0,
  }[candidate.discoveryMethod] || 0;

  return Math.min(100, baseScore + methodBonus + getPathRelevance(candidate.url, purpose));
};

const createCandidate = (candidate, purpose) => {
  const score = scoreCandidate(candidate, purpose);

  return {
    url: candidate.url,
    type: candidate.type,
    label: candidate.title || getTypeLabel(candidate),
    reason: getReason(candidate, purpose),
    score,
    discoveryMethod: candidate.discoveryMethod,
  };
};

const addCandidate = (map, candidate) => {
  const key = candidate.url.replace(/\/$/, '').toLowerCase();
  const existing = map.get(key);

  if (!existing || candidate.score > existing.score) {
    map.set(key, candidate);
  }
};

const probeFeedCandidate = async (url, requestedType, discoveryMethod, title) => {
  try {
    const result = await fetchText(
      url,
      'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
    );
    const type = getFeedType(result.text, result.contentType, requestedType);
    if (!type) return null;

    return {
      url: result.finalUrl,
      type,
      discoveryMethod,
      title,
    };
  } catch {
    return null;
  }
};

const probeSitemapCandidate = async (url, discoveryMethod) => {
  try {
    const result = await fetchText(url, 'application/xml, text/xml;q=0.9, */*;q=0.8');
    if (!isSitemapXml(result.text, result.contentType)) return null;

    return {
      url: result.finalUrl,
      type: 'sitemap',
      discoveryMethod,
    };
  } catch {
    return null;
  }
};

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed.' });
  }

  try {
    const body = await readRequestBody(req);
    const normalizedUrl = normalizeUrl(body.url);
    const purpose = normalizePurpose(body.purpose);
    const pageUrl = new URL(normalizedUrl);
    const origin = pageUrl.origin;
    const candidateMap = new Map();

    let homepage = null;
    try {
      homepage = await fetchText(normalizedUrl, 'text/html, application/xhtml+xml;q=0.9, */*;q=0.8');
    } catch {
      homepage = null;
    }

    const pageTitle = homepage ? extractHtmlTitle(homepage.text) : '';
    const pageWatchUrl = homepage?.finalUrl || normalizedUrl;
    const htmlFeeds = homepage ? extractAlternateFeeds(homepage.text, homepage.finalUrl) : [];

    const feedProbeUrls = [
      ...htmlFeeds,
      ...COMMON_FEED_PATHS.map((path) => ({
        url: new URL(path, origin).toString(),
        discoveryMethod: 'common-path',
      })),
    ];

    const feedCandidates = await Promise.all(
      feedProbeUrls.map((candidate) => (
        probeFeedCandidate(
          candidate.url,
          candidate.type,
          candidate.discoveryMethod,
          candidate.title,
        )
      )),
    );

    feedCandidates
      .filter(Boolean)
      .map((candidate) => createCandidate(candidate, purpose))
      .forEach((candidate) => addCandidate(candidateMap, candidate));

    let robotSitemaps = [];
    try {
      const robots = await fetchText(new URL('/robots.txt', origin).toString(), 'text/plain, */*;q=0.8');
      robotSitemaps = extractRobotSitemaps(robots.text, origin);
    } catch {
      robotSitemaps = [];
    }

    const sitemapProbeUrls = [
      ...robotSitemaps.map((url) => ({
        url,
        discoveryMethod: 'robots',
      })),
      ...COMMON_SITEMAP_PATHS.map((path) => ({
        url: new URL(path, origin).toString(),
        discoveryMethod: 'sitemap',
      })),
    ];

    const sitemapCandidates = await Promise.all(
      sitemapProbeUrls.map((candidate) => (
        probeSitemapCandidate(candidate.url, candidate.discoveryMethod)
      )),
    );

    sitemapCandidates
      .filter(Boolean)
      .map((candidate) => createCandidate(candidate, purpose))
      .forEach((candidate) => addCandidate(candidateMap, candidate));

    const fallbackCandidate = createCandidate({
      url: pageWatchUrl,
      type: 'webpage',
      discoveryMethod: 'fallback',
      title: pageTitle || 'Basic page watch',
    }, purpose);
    addCandidate(candidateMap, fallbackCandidate);

    const candidates = Array.from(candidateMap.values())
      .sort((first, second) => second.score - first.score);

    return res.status(200).json({
      success: true,
      normalizedUrl,
      recommended: candidates[0],
      candidates,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to discover sources for this website.';
    return res.status(400).json({
      success: false,
      error: message,
    });
  }
}
