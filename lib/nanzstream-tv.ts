type NanzStreamTvChannel = {
  channel_id: string;
  channel_name: string;
  channel_number?: number;
  channel_image?: string;
  genre_name: string;
  stream_url: string;
};

const DIRECT_CHANNELS: NanzStreamTvChannel[] = [
  { channel_id: 'daai_tv', channel_name: 'DAAI TV HD', genre_name: 'TV Nasional', stream_url: 'https://pull.daaiplus.com/live-DAAIPLUS/live-DAAIPLUS_HD.m3u8' },
  { channel_id: 'dw_deutsch', channel_name: 'DW Deutsch HD', genre_name: 'Berita', stream_url: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8' },
  { channel_id: 'dw_english', channel_name: 'DW English HD', genre_name: 'Berita', stream_url: 'https://dwamdstream104.akamaized.net/hls/live/2015530/dwstream104/index.m3u8' },
  { channel_id: 'inews', channel_name: 'iNews HD', genre_name: 'Berita', stream_url: 'https://live.i-news.tv/hls/1/stream.m3u8' },
  { channel_id: 'metro_tv', channel_name: 'Metro TV HD', genre_name: 'Berita', stream_url: 'https://edge.medcom.id/live-edge/smil:metro.smil/playlist.m3u8' },
  { channel_id: 'mojitv', channel_name: 'MojiTV Cartoon', genre_name: 'Anak', stream_url: 'https://odmedia-mojitv-1-be.samsung.wurl.tv/playlist.m3u8' },
  { channel_id: 'nhk_world', channel_name: 'NHK World Japan HD', genre_name: 'Berita', stream_url: 'https://media-tyo.hls.nhkworld.jp/hls/w/live/master.m3u8' },
  { channel_id: 'rtv', channel_name: 'RTV HD', genre_name: 'Hiburan', stream_url: 'https://rtvstream.rtv.co.id:4555/hls/rtv.m3u8' },
  { channel_id: 'tvri_dki', channel_name: 'TVRI Jakarta', genre_name: 'TV Nasional', stream_url: 'https://ott-balancer.tvri.go.id/live/eds/DKI/hls/DKI.m3u8' },
  { channel_id: 'tvri_jabar', channel_name: 'TVRI Jawa Barat', genre_name: 'TV Nasional', stream_url: 'https://ott-balancer.tvri.go.id/live/eds/Jabar/hls/Jabar.m3u8' },
  { channel_id: 'tvri_jatim', channel_name: 'TVRI Jawa Timur', genre_name: 'TV Nasional', stream_url: 'https://ott-balancer.tvri.go.id/live/eds/Jatim/hls/Jatim.m3u8' },
  { channel_id: 'tvri_nasional', channel_name: 'TVRI Nasional', genre_name: 'TV Nasional', stream_url: 'https://ott-balancer.tvri.go.id/live/eds/Nasional/hls/Nasional.m3u8' },
  { channel_id: 'tvri_world', channel_name: 'TVRI World', genre_name: 'Berita', stream_url: 'https://ott-balancer.tvri.go.id/live/eds/TVRIWorld/hls/TVRIWorld.m3u8' },
  { channel_id: 'trans_tv', channel_name: 'Trans TV', genre_name: 'Hiburan', stream_url: 'https://green-night-d2b4.iontv.workers.dev/transtv.m3u8' },
  { channel_id: 'trans7', channel_name: 'Trans7', genre_name: 'Hiburan', stream_url: 'https://green-night-d2b4.iontv.workers.dev/trans7.m3u8' },
  { channel_id: 'arirang', channel_name: 'Arirang TV Korea HD', genre_name: 'Hiburan', stream_url: 'https://amdlive-ch01-ctnd-com.akamaized.net/arirang_1ch/smil:arirang_1ch.smil/playlist.m3u8' },
  { channel_id: 'bbc_earth', channel_name: 'BBC Earth', genre_name: 'Edukasi', stream_url: 'https://amg00793-amg00793c6-xumo-us-2669.playouts.now.amagi.tv/BBCStudios-BBCEarthA-hls/playlist.m3u8' },
  { channel_id: 'cna', channel_name: 'CNA', genre_name: 'Berita', stream_url: 'https://amg01082-cna-amg01082c1-rlaxx-us-11304.playouts.now.amagi.tv/playlist.m3u8' },
  { channel_id: 'bein_xtra', channel_name: 'beIN XTRA', genre_name: 'Olahraga', stream_url: 'https://bein-xtra-bein.amagi.tv/playlist.m3u8' },
  { channel_id: 'bloomberg', channel_name: 'Bloomberg Originals HD', genre_name: 'Berita', stream_url: 'https://bloomberg.com/media-manifest/streams/qt.m3u8' },
  { channel_id: 'trt_world', channel_name: 'TRT World', genre_name: 'Berita', stream_url: 'https://tv-trtworld.medya.trt.com.tr/master.m3u8' },
  { channel_id: 'banjar_tv', channel_name: 'Banjar TV', genre_name: 'TV Lokal', stream_url: 'https://banjartv.siar.us/banjartv/live/playlist.m3u8' },
  { channel_id: 'dhoho_tv', channel_name: 'Dhoho TV', genre_name: 'TV Lokal', stream_url: 'https://dhohotv.siar.us/dhohotv/live/playlist.m3u8' },
  { channel_id: 'salam_televisi', channel_name: 'Salam Televisi', genre_name: 'Religi', stream_url: 'https://live.salamtelevisi.com/hls/0/stream.m3u8' },
  { channel_id: 'tawaf_tv', channel_name: 'Tawaf TV', genre_name: 'Religi', stream_url: 'https://tvstreamcast.com/tawaftv.m3u8' },
];

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/hd\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function getNanzStreamTvChannels() {
  return DIRECT_CHANNELS.map((channel) => ({ ...channel }));
}

export function resolveNanzStreamDirect(channelName: string) {
  const needle = normalize(channelName);
  if (!needle) return null;

  const exact = DIRECT_CHANNELS.find((channel) => {
    const name = normalize(channel.channel_name);
    const id = normalize(channel.channel_id);
    return name === needle || id === needle;
  });

  if (exact) return exact;

  return DIRECT_CHANNELS.find((channel) => {
    const name = normalize(channel.channel_name);
    const id = normalize(channel.channel_id);
    return name.includes(needle) || needle.includes(name) || id.includes(needle);
  }) ?? null;
}

export const NANZSTREAM_DIRECT_HOSTS = [
  'pull.daaiplus.com',
  'dwamdstream102.akamaized.net',
  'dwamdstream104.akamaized.net',
  'live.i-news.tv',
  'edge.medcom.id',
  'odmedia-mojitv-1-be.samsung.wurl.tv',
  'media-tyo.hls.nhkworld.jp',
  'rtvstream.rtv.co.id',
  'ott-balancer.tvri.go.id',
  'green-night-d2b4.iontv.workers.dev',
  'amdlive-ch01-ctnd-com.akamaized.net',
  'amg00793-amg00793c6-xumo-us-2669.playouts.now.amagi.tv',
  'amg01082-cna-amg01082c1-rlaxx-us-11304.playouts.now.amagi.tv',
  'bein-xtra-bein.amagi.tv',
  'bloomberg.com',
  'tv-trtworld.medya.trt.com.tr',
  'banjartv.siar.us',
  'dhohotv.siar.us',
  'live.salamtelevisi.com',
  'tvstreamcast.com',
  '122.248.43.242',
  '2-fss-2.streamhoster.com',
  '5bf7b725107e5.streamlock.net',
  'dramiyos-cdn.com',
  'amg01329-otterainc-toongoggles-samsungau-ad-4c.amagi.tv',
  'ammedia.siar.us',
  'd1jzu95oc8fgt3.cloudfront.net',
  'flv.intechmedia.net',
  'rbmn-live.akamaized.net',
  'shd-amg-fast.edgenextcdn.net',
  'stream-us-east-1.getpublica.com',
  'stream.carubantv.id',
];
