const NANZSTREAM_API_BASE = 'https://nanzstream-api.vercel.app/api';

const ENDPOINTS = [
  '',
  '/live-tv',
  '/tv',
  '/channels',
  '/live',
  '/tv/channels',
  '/live-tv/channels',
] as const;

const URL_KEYS = [
  'playbackUrl',
  'playback_url',
  'streamUrl',
  'stream_url',
  'videoUrl',
  'video_url',
  'manifestUrl',
  'manifest_url',
  'm3u8',
  'hls',
  'sourceUrl',
  'source_url',
  'url',
  'stream',
  'source',
] as const;

const NAME_KEYS = [
  'name',
  'title',
  'channelName',
  'channel_name',
  'displayName',
  'display_name',
  'channelTitle',
  'channel_title',
] as const;

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

type Candidate = {
  url: string;
  score: number;
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/hd\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function looksLikeUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function looksLikePlaybackUrl(value: string) {
  return looksLikeUrl(value) && (
    /\.m3u8(?:[?#]|$)/i.test(value) ||
    /(?:hls|stream|live|manifest|playlist)/i.test(value)
  );
}

function getObjectNames(value: { [key: string]: JsonValue }) {
  return NAME_KEYS
    .map((key) => value[key])
    .filter((item): item is string => typeof item === 'string')
    .map(normalize)
    .filter(Boolean);
}

function collectCandidates(
  value: JsonValue,
  channelName: string,
  depth = 0,
  parentScore = 0,
  output: Candidate[] = [],
) {
  if (depth > 7 || value == null) return output;

  const needle = normalize(channelName);

  if (typeof value === 'string') {
    if (looksLikePlaybackUrl(value)) {
      output.push({ url: value, score: parentScore });
    }
    return output;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectCandidates(item, channelName, depth + 1, parentScore, output);
    }
    return output;
  }

  if (typeof value !== 'object') return output;

  const names = getObjectNames(value);
  const nameMatch = Boolean(
    needle && names.some(
      (name) => name === needle || name.includes(needle) || needle.includes(name),
    ),
  );
  const score = parentScore + (nameMatch ? 100 : 0);

  for (const key of URL_KEYS) {
    const item = value[key];
    if (typeof item === 'string' && looksLikePlaybackUrl(item)) {
      output.push({ url: item, score: score + 50 });
    }
  }

  for (const [key, item] of Object.entries(value)) {
    if (URL_KEYS.includes(key as (typeof URL_KEYS)[number])) continue;
    collectCandidates(item, channelName, depth + 1, score, output);
  }

  return output;
}

function pickPlaybackUrl(payload: JsonValue, channelName: string) {
  const candidates = collectCandidates(payload, channelName);
  const unique = new Map<string, Candidate>();

  for (const candidate of candidates) {
    const current = unique.get(candidate.url);
    if (!current || candidate.score > current.score) {
      unique.set(candidate.url, candidate);
    }
  }

  return [...unique.values()]
    .sort((a, b) => b.score - a.score)
    .map((candidate) => candidate.url)[0] ?? '';
}

async function fetchJson(url: string) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json, text/plain, */*',
      'User-Agent': 'HIDZTV/2.0 NanzStream API Adapter',
    },
    cache: 'no-store',
  });

  if (!response.ok) return null;

  const text = await response.text();
  if (!text.trim()) return null;

  try {
    return JSON.parse(text) as JsonValue;
  } catch {
    const match = text.match(/https?:\/\/[^\s"'<>]+(?:\.m3u8|[?&](?:stream|url|source)=)[^\s"'<>]*/i);
    return match?.[0] ?? null;
  }
}

export async function resolveNanzStreamTv(channelName: string) {
  const encoded = encodeURIComponent(channelName);
  const attempted: string[] = [];

  for (const endpoint of ENDPOINTS) {
    const url = endpoint
      ? `${NANZSTREAM_API_BASE}${endpoint}?channel=${encoded}`
      : `${NANZSTREAM_API_BASE}?channel=${encoded}`;

    attempted.push(url);

    try {
      const payload = await fetchJson(url);
      if (!payload) continue;

      const playbackUrl = typeof payload === 'string'
        ? (looksLikePlaybackUrl(payload) ? payload : '')
        : pickPlaybackUrl(payload, channelName);

      if (playbackUrl) {
        return {
          ok: true as const,
          playbackUrl,
          endpoint: url,
        };
      }
    } catch {
      // Try the next known route without failing the whole player.
    }
  }

  return {
    ok: false as const,
    attempted,
  };
}
