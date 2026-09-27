export type ChannelCategory = 'national' | 'international';

export type Channel = {
  id: string;
  name: string;
  number: number;
  category: ChannelCategory;
  region: string;
  language?: string;
  color: string;
  sources: string[];
  providerUrl?: string;
};

const make = (
  id: string,
  name: string,
  number: number,
  category: ChannelCategory,
  sources: string[],
  color: string,
  providerUrl: string,
  extra: Partial<Channel> = {},
): Channel => ({
  id,
  name,
  number,
  category,
  region: category === 'national' ? 'Indonesia' : 'International',
  sources,
  color,
  providerUrl,
  ...extra,
});

export const CHANNELS: Channel[] = [
  make('rcti', 'RCTI', 1, 'national', [], 'linear-gradient(135deg,#b91c1c,#450a0a)', 'https://www.rctiplus.com/tv/rcti'),
  make('mnctv', 'MNCTV', 2, 'national', [], 'linear-gradient(135deg,#1d4ed8,#312e81)', 'https://www.rctiplus.com/tv/mnctv'),
  make('gtv', 'GTV', 3, 'national', [], 'linear-gradient(135deg,#f97316,#7f1d1d)', 'https://www.rctiplus.com/tv/gtv'),
  make('inews', 'iNEWS', 4, 'national', [], 'linear-gradient(135deg,#dc2626,#111827)', 'https://www.rctiplus.com/tv/inews'),
  make('rtv', 'RTV', 5, 'national', ['https://rtvstream.rtv.co.id:4555/hls/rtv.m3u8'], 'linear-gradient(135deg,#7c3aed,#312e81)', 'https://www.rtv.co.id/'),
  make('trans7', 'TRANS7', 6, 'national', ['https://video.detik.com/trans7/smil:trans7.smil/index.m3u8'], 'linear-gradient(135deg,#dc2626,#1e3a8a)', 'https://www.trans7.co.id/live-streaming'),
  make('transtv', 'TRANS TV', 7, 'national', ['https://video.detik.com/transtv/smil:transtv.smil/index.m3u8'], 'linear-gradient(135deg,#0ea5e9,#1d4ed8)', 'https://www.transtv.co.id/live'),
  make('tvone', 'TV One', 8, 'national', ['https://op-group1-swiftservehd-1.dens.tv/h/h40/index.m3u8'], 'linear-gradient(135deg,#dc2626,#111111)', 'https://www.vidio.com/live'),
  make('kompastv', 'Kompas TV', 9, 'national', ['https://op-group1-swiftservehd-1.dens.tv/s/s104/index.m3u8'], 'linear-gradient(135deg,#1e3a8a,#164e63)', 'https://www.vidio.com/micro/live/874-kompas-tv'),
  make('mdtv', 'MDTV', 10, 'national', ['https://wahyu1ptv.pages.dev/MDTV-HD.m3u8'], 'linear-gradient(135deg,#db2777,#581c87)', 'https://www.vidio.com/live'),
  make('tvri', 'TVRI', 11, 'national', ['https://ott-balancer.tvri.go.id/live/eds/Nasional/hls/Nasional.m3u8'], 'linear-gradient(135deg,#1d4ed8,#0f172a)', 'https://klik.tvri.go.id/detailchannel/tvri_ch_00'),
  make('tvri-world', 'TVRI World', 12, 'national', ['https://ott-balancer.tvri.go.id/live/eds/TVRIWorld/hls/TVRIWorld.m3u8'], 'linear-gradient(135deg,#475569,#020617)', 'https://klik.tvri.go.id/'),
  make('tvri-sport', 'TVRI Sport', 13, 'national', ['https://ott-balancer.tvri.go.id/live/eds/SportHD/hls/SportHD.m3u8'], 'linear-gradient(135deg,#15803d,#172554)', 'https://klik.tvri.go.id/'),
  make('metrotv', 'Metro TV', 14, 'national', ['https://edge.medcom.id/live-edge/smil:metro.smil/playlist.m3u8'], 'linear-gradient(135deg,#1e3a8a,#ca8a04)', 'https://www.vidio.com/live/777-metro-tv'),
  make('btv', 'BTV', 15, 'national', ['https://xtdslboppkkv-pull.bpmedialive.com/live/beritasatu/abr.m3u8'], 'linear-gradient(135deg,#f97316,#b91c1c)', 'https://www.vidio.com/live'),
  make('sctv', 'SCTV', 16, 'national', [], 'linear-gradient(135deg,#38bdf8,#2563eb)', 'https://www.vidio.com/micro/live/204-sctv'),
  make('indosiar', 'Indosiar', 17, 'national', [], 'linear-gradient(135deg,#2563eb,#dc2626)', 'https://www.vidio.com/micro/live/205-indosiar'),
  make('cnn-indonesia', 'CNN Indonesia', 18, 'national', ['https://live.cnnindonesia.com/livecnn/smil:cnntv.smil/chunklist_w672934803_b384000_sleng.m3u8'], 'linear-gradient(135deg,#dc2626,#450a0a)', 'https://www.cnnindonesia.com/tv'),
  make('cnbc-indonesia', 'CNBC Indonesia', 19, 'national', ['https://live.cnbcindonesia.com/livecnbc/smil:cnbctv.smil/playlist.m3u8'], 'linear-gradient(135deg,#1d4ed8,#083344)', 'https://www.cnbcindonesia.com/live'),
  make('garuda-tv', 'Garuda TV', 20, 'national', ['https://hgmtv.com:19360/garudatvlivestreaming/garudatvlivestreaming.m3u8'], 'linear-gradient(135deg,#b91c1c,#172554)', 'https://garuda.tv/live'),
  make('nusantara-tv', 'Nusantara TV', 21, 'national', ['https://nusantaratv.siar.us/nusantaratv/live/playlist.m3u8'], 'linear-gradient(135deg,#1d4ed8,#164e63)', 'https://www.nusantaratv.com/live'),
  make('magna-tv', 'Magna TV', 22, 'national', ['https://edge.medcom.id/live-edge/smil:magna.smil/playlist.m3u8'], 'linear-gradient(135deg,#7e22ce,#831843)', 'https://www.vidio.com/live'),
  make('adi-tv', 'Adi TV', 23, 'national', ['https://v2.siar.us/aditv/livestream/playlist.m3u8'], 'linear-gradient(135deg,#059669,#14532d)', 'https://aditv.co.id/'),
  make('rctv', 'RCTV', 24, 'national', ['https://v10.siar.us/rctv/live/playlist.m3u8'], 'linear-gradient(135deg,#ea580c,#7f1d1d)', 'https://www.radarcirebon.tv/livestreaming/'),
  make('pal-tv', 'PAL TV', 25, 'national', ['https://v3.siar.us/paltv/live/playlist.m3u8'], 'linear-gradient(135deg,#eab308,#7f1d1d)', 'https://paltv.co.id/'),
  make('rri-net', 'RRI NET', 26, 'national', ['https://private-streaming.rri.go.id/memfs/6f77c7b5-feb2-4935-9f89-e7e9fca0a54a_output_0.m3u8'], 'linear-gradient(135deg,#1d4ed8,#312e81)', 'https://rrinet.rri.co.id/'),
  make('bbs-tv', 'BBS TV', 27, 'national', ['https://5bf7b725107e5.streamlock.net/bbstv/bbstv/playlist.m3u8'], 'linear-gradient(135deg,#dc2626,#c2410c)', 'https://www.bbstv.co.id/'),

  make('cgtn', 'CGTN', 101, 'international', [], 'linear-gradient(135deg,#dc2626,#450a0a)', 'https://www.cgtn.com/special/CGTN-Live.html', { region: 'China', language: 'English' }),
  make('dw-english', 'DW English', 102, 'international', [], 'linear-gradient(135deg,#52525b,#7f1d1d)', 'https://www.dw.com/en/live-tv/s-100825', { region: 'Germany', language: 'English' }),
  make('dw-arabic', 'DW Arabic', 103, 'international', [], 'linear-gradient(135deg,#52525b,#854d0e)', 'https://www.dw.com/ar/live-tv/s-100825', { region: 'Germany', language: 'Arabic' }),
  make('ebs-kids', 'EBS KIDS', 104, 'international', ['https://ebsonair.ebs.co.kr/plus3familypc/familypc1m/playlist.m3u8'], 'linear-gradient(135deg,#4ade80,#2563eb)', 'https://www.ebs.co.kr/', { region: 'Korea', language: 'Korean' }),
  make('nhk-world', 'NHK WORLD-JAPAN', 105, 'international', ['https://masterpl.hls.nhkworld.jp/hls/w/live/smarttv.m3u8','https://media-tyo.hls.nhkworld.jp/hls/w/live/master.m3u8'], 'linear-gradient(135deg,#dc2626,#0f172a)', 'https://www3.nhk.or.jp/nhkworld/en/live/', { region: 'Japan', language: 'English' }),
  make('euronews', 'Euronews', 106, 'international', ['https://cdn-euronews.akamaized.net/live/eds/euronews-en/25002/index.m3u8'], 'linear-gradient(135deg,#1d4ed8,#312e81)', 'https://www.euronews.com/live', { region: 'Europe', language: 'English' }),
  make('al-jazeera', 'Al Jazeera English', 107, 'international', ['https://live-hls-apps-aje-fa.getaj.net/AJE/index.m3u8'], 'linear-gradient(135deg,#991b1b,#000000)', 'https://www.aljazeera.com/live', { region: 'Qatar', language: 'English' }),
  make('arirang', 'Arirang', 108, 'international', ['https://amdlive-ch01-ctnd-com.akamaized.net/arirang_1ch/smil:arirang_1ch.smil/playlist.m3u8'], 'linear-gradient(135deg,#2563eb,#581c87)', 'https://www.arirang.com/live', { region: 'Korea', language: 'English' }),
  make('trt-world', 'TRT World', 109, 'international', ['https://tv-trtworld.medya.trt.com.tr/master.m3u8'], 'linear-gradient(135deg,#b91c1c,#164e63)', 'https://www.trtworld.com/live', { region: 'Turkey', language: 'English' }),
  make('rt-america', 'RT America', 110, 'international', [], 'linear-gradient(135deg,#15803d,#020617)', 'https://www.rt.com/on-air/', { region: 'USA', language: 'English' }),
  make('cbs-news', 'CBS News', 111, 'international', ['https://cbsnews.akamaized.net/hls/live/2020607/cbsnlineup_8/master.m3u8'], 'linear-gradient(135deg,#1d4ed8,#0f172a)', 'https://www.cbsnews.com/live/', { region: 'USA', language: 'English' }),
];

export const NATIONAL_COUNT = CHANNELS.filter((channel) => channel.category === 'national').length;
export const INTERNATIONAL_COUNT = CHANNELS.filter((channel) => channel.category === 'international').length;
