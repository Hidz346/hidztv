import crypto from 'node:crypto';

const AUTH_URL = 'https://servicebuss.transvision.co.id/global/v3/auth/redirect-login';
const CHANNELS_URL = 'https://servicebuss.transvision.co.id/global/v4/channel-list?page=1&per_page=50&platform_id=1';
const CUBMU_ORIGIN = 'https://www.cubmu.com';
const CUBMU_REFERER = 'https://www.cubmu.com/';

const EMAIL = process.env.CUBMU_EMAIL || 'master_account@transvision.co.id';
const PASSWORD = process.env.CUBMU_PASSWORD || 'hospitality';

type TokenResponse = {
  data?: {
    access_token?: string;
  };
};

type CubMuChannel = {
  channel_id?: string | number;
  channel_name?: string;
  channel_number?: number;
  channel_image?: string;
  slug_url?: string;
  genre_name?: string;
};

type ChannelListResponse = {
  data?: {
    items?: Array<{
      genre_name?: string;
      channels?: CubMuChannel[];
    }>;
  };
};

let cachedToken = '';
let tokenExpiresAt = 0;
let cachedChannels: CubMuChannel[] = [];
let channelsCachedAt = 0;

const browserHeaders = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Origin: CUBMU_ORIGIN,
  Referer: CUBMU_REFERER,
};

function encryptPassword(password: string, now = Date.now()): string {
  let value = password + '{SPLITTER}' + Math.floor(now / 1000);

  for (let i = 0; i < 2; i += 1) {
    const encoded = Buffer.from(value, 'utf8').toString('base64');
    value = 'xx' + encoded;
  }

  return value;
}

function decryptManifest(value: string): string {
  if (!value?.trim()) return '';

  let encoded = value.trim().replaceAll('-', '+').replaceAll('_', '/');

  while (encoded.length % 4 !== 0) {
    encoded += '=';
  }

  const decoded = Buffer.from(encoded, 'base64');
  if (decoded.length < 16) return '';

  const iv = decoded.subarray(0, 16);
  const ciphertext = decoded.subarray(16);
  const key = Buffer.from('tr4n5V1s10nL1v3y', 'utf8');

  const decipher = crypto.createDecipheriv('aes-128-cfb', key, iv);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const payload = {
    app_id: 'cubmu',
    tvs_platform_id: 'standalone',
    email_or_phone: EMAIL,
    password: encryptPassword(PASSWORD),
    device: {
      device_id: 'web_browser',
      device_brand: 'Web Browser',
      device_type: 'WEB',
      firebase_id: 'NOT_ALLOWED',
      notes: 'Web Browser-V2.1',
    },
  };

  const response = await fetch(AUTH_URL, {
    method: 'POST',
    headers: {
      ...browserHeaders,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('CubMu authentication failed: HTTP ' + response.status);
  }

  const json = (await response.json()) as TokenResponse;
  const token = json.data?.access_token?.trim();

  if (!token) {
    throw new Error('CubMu authentication returned no access token');
  }

  cachedToken = token;
  tokenExpiresAt = Date.now() + 12 * 60 * 60 * 1000;
  return token;
}

export async function getCubMuChannels(): Promise<CubMuChannel[]> {
  if (cachedChannels.length && Date.now() - channelsCachedAt < 5 * 60 * 1000) {
    return cachedChannels;
  }

  const token = await getAccessToken();
  const response = await fetch(CHANNELS_URL, {
    headers: {
      ...browserHeaders,
      Authorization: 'Bearer ' + token,
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('CubMu channel list failed: HTTP ' + response.status);
  }

  const json = (await response.json()) as ChannelListResponse;
  const channels: CubMuChannel[] = [];

  for (const group of json.data?.items ?? []) {
    for (const channel of group.channels ?? []) {
      channels.push({
        ...channel,
        genre_name: channel.genre_name || group.genre_name || 'TV Nasional',
      });
    }
  }

  cachedChannels = channels;
  channelsCachedAt = Date.now();
  return channels;
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/hd\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export async function resolveCubMuChannel(input: string): Promise<CubMuChannel> {
  const channels = await getCubMuChannels();
  const needle = normalize(input);

  const exact = channels.find((channel) => {
    const candidates = [channel.channel_name, channel.slug_url, String(channel.channel_id ?? '')]
      .filter(Boolean)
      .map(normalize);
    return candidates.includes(needle);
  });

  if (exact) return exact;

  const partial = channels.find((channel) => {
    const name = normalize(channel.channel_name || '');
    const slug = normalize(channel.slug_url || '');
    return Boolean(needle) && (name.includes(needle) || needle.includes(name) || slug.includes(needle));
  });

  if (!partial) {
    throw new Error('Channel tidak ditemukan di CubMu: ' + input);
  }

  return partial;
}

export async function resolveCubMuStream(input: string): Promise<{
  channel: CubMuChannel;
  manifestUrl: string;
}> {
  const channel = await resolveCubMuChannel(input);
  const slug = String(channel.slug_url || '').replace(/^\/+|\/+$/g, '');

  if (!slug) {
    throw new Error('Channel tidak mempunyai slug CubMu');
  }

  const pageUrl = slug.startsWith('http')
    ? slug
    : CUBMU_ORIGIN + '/watch/live-tv/' + slug;

  const response = await fetch(pageUrl, {
    headers: browserHeaders,
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('CubMu live page failed: HTTP ' + response.status);
  }

  const html = await response.text();
  const nextDataMatch = html.match(
    /<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i,
  );

  if (!nextDataMatch) {
    throw new Error('CubMu __NEXT_DATA__ tidak ditemukan');
  }

  const data = JSON.parse(nextDataMatch[1]) as {
    props?: {
      pageProps?: {
        detailChannel?: {
          manifest?: string;
          channel_cdn_list?: Array<{
            cdn_manifest?: {
              hls?: string;
            };
          }>;
        };
      };
    };
  };

  const detail = data.props?.pageProps?.detailChannel;
  const encryptedCandidates = [
    detail?.manifest || '',
    ...(detail?.channel_cdn_list ?? []).map((item) => item.cdn_manifest?.hls || ''),
  ].filter(Boolean);

  for (const encrypted of encryptedCandidates) {
    const direct = encrypted.includes('.m3u8')
      ? encrypted
      : decryptManifest(encrypted);

    if (/^https?:\/\//i.test(direct) && direct.includes('.m3u8')) {
      return { channel, manifestUrl: direct };
    }
  }

  throw new Error('CubMu tidak mengembalikan HLS manifest yang dapat diputar');
}

export const CUBMU_PROXY_HEADERS = {
  ...browserHeaders,
  Accept: '*/*',
};
