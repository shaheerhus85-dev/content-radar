import { XMLParser } from 'fast-xml-parser';

export interface ParsedFeedItem {
  title: string;
  url: string;
  publishedAt: string | null;
  rawSnippet: string;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  trimValues: true,
});

const toArray = <T>(value: T | T[] | undefined | null): T[] => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const toText = (value: unknown): string => {
  if (!value) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (typeof value === 'object' && '#text' in value) {
    const text = (value as { '#text'?: unknown })['#text'];
    return typeof text === 'string' || typeof text === 'number' ? String(text) : '';
  }

  return '';
};

const stripHtml = (value: string) =>
  value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const getAtomLink = (link: unknown) => {
  if (!link) return '';
  if (typeof link === 'string') return link;

  const links = toArray(link);
  const alternate = links.find((entry) => (
    typeof entry === 'object'
    && entry !== null
    && (!('@_rel' in entry) || (entry as { '@_rel'?: string })['@_rel'] === 'alternate')
  ));
  const chosen = alternate || links[0];

  if (typeof chosen === 'object' && chosen !== null && '@_href' in chosen) {
    return String((chosen as { '@_href'?: string })['@_href'] || '');
  }

  return toText(chosen);
};

const titleFromUrl = (url: string) => {
  try {
    const parsedUrl = new URL(url);
    const pathPart = parsedUrl.pathname.split('/').filter(Boolean).pop();
    if (!pathPart) return parsedUrl.hostname;

    return decodeURIComponent(pathPart)
      .replace(/[-_]+/g, ' ')
      .replace(/\.[a-z0-9]+$/i, '')
      .trim() || parsedUrl.hostname;
  } catch {
    return 'Sitemap URL';
  }
};

export const parseFeedXml = (xml: string, maxItems = 10): ParsedFeedItem[] => {
  const parsed = parser.parse(xml);

  if (parsed?.rss?.channel?.item) {
    return toArray<Record<string, unknown>>(parsed.rss.channel.item)
      .slice(0, maxItems)
      .map((item) => {
        const url = toText(item.link) || toText(item.guid);
        const rawSnippet = stripHtml(
          toText(item.description) || toText(item['content:encoded']) || toText(item.summary),
        );

        return {
          title: toText(item.title) || titleFromUrl(url),
          url,
          publishedAt: toText(item.pubDate) || toText(item.isoDate) || null,
          rawSnippet,
        };
      })
      .filter((item) => item.url);
  }

  if (parsed?.feed?.entry) {
    return toArray<Record<string, unknown>>(parsed.feed.entry)
      .slice(0, maxItems)
      .map((entry) => {
        const url = getAtomLink(entry.link) || toText(entry.id);
        const rawSnippet = stripHtml(
          toText(entry.summary) || toText(entry.content),
        );

        return {
          title: toText(entry.title) || titleFromUrl(url),
          url,
          publishedAt: toText(entry.published) || toText(entry.updated) || null,
          rawSnippet,
        };
      })
      .filter((item) => item.url);
  }

  if (parsed?.urlset?.url) {
    return toArray<Record<string, unknown>>(parsed.urlset.url)
      .slice(0, maxItems)
      .map((entry) => {
        const url = toText(entry.loc);
        return {
          title: titleFromUrl(url),
          url,
          publishedAt: toText(entry.lastmod) || null,
          rawSnippet: url ? `Sitemap entry discovered at ${url}` : '',
        };
      })
      .filter((item) => item.url);
  }

  return [];
};
