import { APK_STREAMS } from '@/lib/apk-streams';

export type ChannelCategory = 'national' | 'international' | 'entertainment' | 'kids' | 'religion';

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
  sources: readonly string[],
  color: string,
  providerUrl?: string,
  region = category === 'national' ? 'Indonesia' : category === 'international' ? 'International' : 'International',
  language?: string,
): Channel => ({
  id,
  name,
  number,
  category,
  region,
  language,
  sources: [...sources],
  color,
  providerUrl,
});

export const CHANNELS: Channel[] = [
  // NATIONAL — 25 channels, matching the APK layout/count.
  make('gtv', 'GTV HD', 1, 'national', ['https://live.rctiplus.id/rctiplus/gtv_360p.m3u8'], 'linear-gradient(135deg,#ec4899,#7e22ce)', 'https://www.rctiplus.com/tv/gtv'),
  make('mnctv', 'MNC TV HD', 2, 'national', ['https://live.rctiplus.id/rctiplus/mnctv_720p.m3u8'], 'linear-gradient(135deg,#2563eb,#312e81)', 'https://www.rctiplus.com/tv/mnctv'),
  make('rcti', 'RCTI HD', 3, 'national', ['https://live.rctiplus.id/rctiplus/rcti_360p.m3u8'], 'linear-gradient(135deg,#ef4444,#7f1d1d)', 'https://www.rctiplus.com/tv/rcti'),
  make('sctv', 'SCTV HD', 4, 'national', ['http://op-group1-swiftservehd-1.dens.tv/h/h217/02.m3u8'], 'linear-gradient(135deg,#38bdf8,#1d4ed8)', 'https://www.vidio.com/micro/live/204-sctv'),
  make('indosiar', 'Indosiar HD', 5, 'national', ['http://op-group1-swiftservehd-1.dens.tv/h/h207/index.m3u8'], 'linear-gradient(135deg,#2563eb,#dc2626)', 'https://www.vidio.com/micro/live/205-indosiar'),
  make('inews', 'iNews HD', 6, 'national', APK_STREAMS.inews, 'linear-gradient(135deg,#dc2626,#111827)', 'https://www.rctiplus.com/tv/inews'),
  make('transtv', 'Trans TV HD', 7, 'national', APK_STREAMS.transtv, 'linear-gradient(135deg,#0ea5e9,#1d4ed8)', 'https://www.transtv.co.id/live'),
  make('trans7', 'Trans7 HD', 8, 'national', APK_STREAMS.trans7, 'linear-gradient(135deg,#dc2626,#1e3a8a)', 'https://www.trans7.co.id/live-streaming'),
  make('antv', 'ANTV HD', 9, 'national', ['http://op-group1-swiftservehd-1.dens.tv/s/s07/index.m3u8?app_type=web&userid=lite&chname=antv'], 'linear-gradient(135deg,#f59e0b,#dc2626)', 'https://www.visionplus.id/webclient/#/live'),
  make('daai', 'DAAI TV HD', 10, 'national', APK_STREAMS.daai, 'linear-gradient(135deg,#0f766e,#164e63)', 'https://www.daaiplus.com/'),
  make('rtv', 'RTV HD', 11, 'national', APK_STREAMS.rtv, 'linear-gradient(135deg,#7c3aed,#312e81)', 'https://www.rtv.co.id/'),
  make('kompastv', 'Kompas TV HD', 12, 'national', APK_STREAMS.kompastv, 'linear-gradient(135deg,#1e3a8a,#164e63)', 'https://www.vidio.com/micro/live/874-kompas-tv'),
  make('tvri-nasional', 'TVRI Nasional', 13, 'national', APK_STREAMS.tvriNasional, 'linear-gradient(135deg,#2563eb,#0f172a)', 'https://klik.tvri.go.id/detailchannel/tvri_ch_00'),
  make('tvri-jakarta', 'TVRI Jakarta', 14, 'national', APK_STREAMS.tvriJakarta, 'linear-gradient(135deg,#2563eb,#1e3a8a)', 'https://klik.tvri.go.id/'),
  make('tvri-jabar', 'TVRI Jawa Barat', 15, 'national', APK_STREAMS.tvriJabar, 'linear-gradient(135deg,#059669,#164e63)', 'https://klik.tvri.go.id/'),
  make('tvri-jatim', 'TVRI Jawa Timur', 16, 'national', APK_STREAMS.tvriJatim, 'linear-gradient(135deg,#ea580c,#7f1d1d)', 'https://klik.tvri.go.id/'),
  make('cnn-indonesia', 'CNN Indonesia', 17, 'national', ['https://live.cnnindonesia.com/livecnn/smil:cnntv.smil/playlist.m3u8'], 'linear-gradient(135deg,#dc2626,#450a0a)', 'https://www.cnnindonesia.com/tv'),
  make('cnbc-indonesia', 'CNBC Indonesia', 18, 'national', ['https://live.cnbcindonesia.com/livecnbc/smil:cnbctv.smil/master.m3u8'], 'linear-gradient(135deg,#1d4ed8,#083344)', 'https://www.cnbcindonesia.com/live'),
  make('garuda-tv', 'Garuda TV', 19, 'national', ['https://hgmtv.com:19360/garudatvlivestreaming/garudatvlivestreaming.m3u8'], 'linear-gradient(135deg,#2563eb,#0f172a)', 'https://garuda.tv/live'),
  make('magna', 'MAGNA Channel', 20, 'national', APK_STREAMS.magna, 'linear-gradient(135deg,#7e22ce,#831843)', 'https://www.vidio.com/live'),
  make('bn-channel', 'BN Channel', 21, 'national', ['https://flv.intechmedia.net/live/ch112.m3u8'], 'linear-gradient(135deg,#0ea5e9,#1e40af)', 'https://www.vidio.com/live'),
  make('jawa-pos', 'Jawa Pos TV', 22, 'national', APK_STREAMS.jawaPos, 'linear-gradient(135deg,#ef4444,#7f1d1d)', 'https://www.jawapos.com/tv/'),
  make('banjar-tv', 'Banjar TV', 23, 'national', APK_STREAMS.banjar, 'linear-gradient(135deg,#1d4ed8,#0f172a)', 'https://banjartv.siar.us/'),
  make('caruban-tv', 'Caruban TV', 24, 'national', APK_STREAMS.caruban, 'linear-gradient(135deg,#0f766e,#1e3a8a)', 'https://stream.carubantv.id/'),
  make('dhoho-tv', 'Dhoho TV', 25, 'national', APK_STREAMS.dhoho, 'linear-gradient(135deg,#7c3aed,#581c87)', 'https://dhohotv.siar.us/'),

  // INTERNATIONAL — 7 channels.
  make('cna', 'CNA', 26, 'international', APK_STREAMS.cna, 'linear-gradient(135deg,#2563eb,#0f172a)', 'https://www.channelnewsasia.com/watch', 'Singapore', 'English'),
  make('nhk-world', 'NHK World Japan HD', 27, 'international', APK_STREAMS.nhk, 'linear-gradient(135deg,#dc2626,#0f172a)', 'https://www3.nhk.or.jp/nhkworld/en/live/', 'Japan', 'English'),
  make('bloomberg', 'Bloomberg Originals HD', 28, 'international', APK_STREAMS.bloomberg, 'linear-gradient(135deg,#111827,#1d4ed8)', 'https://www.bloomberg.com/live', 'USA', 'English'),
  make('dw-english', 'DW English HD', 29, 'international', APK_STREAMS.dwEnglish, 'linear-gradient(135deg,#52525b,#7f1d1d)', 'https://www.dw.com/en/live-tv/s-100825', 'Germany', 'English'),
  make('dw-deutsch', 'DW Deutsch HD', 30, 'international', APK_STREAMS.dwDeutsch, 'linear-gradient(135deg,#52525b,#854d0e)', 'https://www.dw.com/de/live-tv/s-100825', 'Germany', 'German'),
  make('arirang', 'Arirang TV Korea HD', 31, 'international', APK_STREAMS.arirang, 'linear-gradient(135deg,#2563eb,#581c87)', 'https://www.arirang.com/live', 'Korea', 'English'),
  make('trt-world', 'TRT World HD', 32, 'international', APK_STREAMS.trtWorld, 'linear-gradient(135deg,#b91c1c,#164e63)', 'https://www.trtworld.com/live', 'Turkey', 'English'),

  // ENTERTAINMENT & SPORT — 9 channels.
  make('bein-sports', 'beIN Sports XTRA', 33, 'entertainment', APK_STREAMS.beinSports, 'linear-gradient(135deg,#ec4899,#111827)', 'https://www.beinsports.com/'),
  make('fox-sports', 'FOX Sports HD', 34, 'entertainment', APK_STREAMS.foxSports, 'linear-gradient(135deg,#2563eb,#111827)', 'https://www.foxsports.com/'),
  make('red-bull', 'Red Bull TV HD', 35, 'entertainment', APK_STREAMS.redBull, 'linear-gradient(135deg,#2563eb,#dc2626)', 'https://www.redbull.com/int-en/live'),
  make('bbc-earth', 'BBC Earth HD', 36, 'entertainment', APK_STREAMS.bbcEarth, 'linear-gradient(135deg,#0f172a,#dc2626)', 'https://www.bbc.com/earth'),
  make('movies-action', 'Movies Action HD', 37, 'entertainment', [], 'linear-gradient(135deg,#7f1d1d,#111827)', 'https://www.themoviebox.xyz/id'),
  make('movies-thriller', 'Movies Thriller HD', 38, 'entertainment', [], 'linear-gradient(135deg,#312e81,#111827)', 'https://www.themoviebox.xyz/id'),
  make('new-kmovies', 'NEW KMOVIES HD', 39, 'entertainment', [], 'linear-gradient(135deg,#be123c,#312e81)', 'https://www.themoviebox.xyz/id'),
  make('themoviebox', 'TheMovieBox HD', 40, 'entertainment', [], 'linear-gradient(135deg,#1d4ed8,#581c87)', 'https://www.themoviebox.xyz/id'),
  make('dracinema', 'DRACINEMA HD', 41, 'entertainment', [], 'linear-gradient(135deg,#7c3aed,#be185d)', 'https://www.dracinema.com/'),

  // KIDS — 7 channels.
  make('cartoon-network', 'Cartoon Network HD', 42, 'kids', APK_STREAMS.cartoon, 'linear-gradient(135deg,#2563eb,#ec4899)', 'https://www.cartoonnetwork.com/'),
  make('baby-shark', 'Baby Shark TV HD', 43, 'kids', APK_STREAMS.babyShark, 'linear-gradient(135deg,#38bdf8,#7c3aed)', 'https://www.youtube.com/@Pinkfong'),
  make('moonbug', 'Moonbug Kids HD', 44, 'kids', APK_STREAMS.moonbug, 'linear-gradient(135deg,#22c55e,#2563eb)', 'https://www.youtube.com/@MoonbugKids'),
  make('toon-goggles', 'Toon Goggles', 45, 'kids', APK_STREAMS.toonGoggles, 'linear-gradient(135deg,#f59e0b,#ec4899)', 'https://www.toongoggles.com/'),
  make('moji-cartoon', 'MojiTV Cartoon', 46, 'kids', APK_STREAMS.mojiCartoon, 'linear-gradient(135deg,#38bdf8,#f97316)', 'https://www.moji.id/'),
  make('kidsflix', 'KidsFlix 24/7', 47, 'kids', APK_STREAMS.kidsFlix, 'linear-gradient(135deg,#22c55e,#7c3aed)', 'https://www.kidsflix.tv/'),
  make('vtv-digital', 'VTV Digital', 48, 'kids', ['https://flv.intechmedia.net/live/ch107.m3u8'], 'linear-gradient(135deg,#ec4899,#f59e0b)', 'https://www.visionplus.id/'),

  // RELIGION — 4 channels.
  make('ahsan-tv', 'Ahsan TV', 49, 'religion', APK_STREAMS.ahsan, 'linear-gradient(135deg,#166534,#0f172a)', 'https://www.youtube.com/'),
  make('alwafa-tarim', 'Alwafa Tarim TV', 50, 'religion', ['https://ammedia.siar.us/ammedia/live/playlist.m3u8'], 'linear-gradient(135deg,#14532d,#7f1d1d)', 'https://www.youtube.com/'),
  make('salam-tv', 'Salam TV', 51, 'religion', APK_STREAMS.salam, 'linear-gradient(135deg,#059669,#0f172a)', 'https://www.youtube.com/'),
  make('tawaf-tv', 'Tawaf TV', 52, 'religion', APK_STREAMS.tawaf, 'linear-gradient(135deg,#0f766e,#312e81)', 'https://www.youtube.com/'),
];

export const CATEGORY_LABELS: Record<ChannelCategory, string> = {
  national: 'Nasional',
  international: 'Internasional',
  entertainment: 'Hiburan & Sport',
  kids: 'Kids',
  religion: 'Religi',
};

export const CATEGORY_COUNTS = {
  all: CHANNELS.length,
  national: CHANNELS.filter((channel) => channel.category === 'national').length,
  international: CHANNELS.filter((channel) => channel.category === 'international').length,
  entertainment: CHANNELS.filter((channel) => channel.category === 'entertainment').length,
  kids: CHANNELS.filter((channel) => channel.category === 'kids').length,
  religion: CHANNELS.filter((channel) => channel.category === 'religion').length,
};
