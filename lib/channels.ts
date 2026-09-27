export type ChannelCategory = 'national' | 'international';

export type Channel = {
  id: string;
  name: string;
  number: number;
  category: ChannelCategory;
  region: string;
  language?: string;
  logo?: string;
  color: string;
  sources: string[];
  embedUrl?: string;
};

const make = (id: string, name: string, number: number, category: ChannelCategory, sources: string[], color: string, extra: Partial<Channel> = {}): Channel => ({
  id, name, number, category, region: category === 'national' ? 'Indonesia' : 'International', sources, color, ...extra,
});

export const CHANNELS: Channel[] = [
  make('rcti', 'RCTI', 1, 'national', ['https://vcdn2.rctiplus.id/live/eds/rcti_fta/live_fta/rcti_fta-avc1_1537200=7-mp4a_64000_eng=2.m3u8'], 'linear-gradient(135deg,#b91c1c,#450a0a)'),
  make('mnctv', 'MNCTV', 2, 'national', ['https://vcdn2.rctiplus.id/live/eds/mnctv_fta/live_fta/mnctv_fta-avc1_1537200=7-mp4a_64000_eng=2.m3u8'], 'linear-gradient(135deg,#1d4ed8,#312e81)'),
  make('gtv', 'GTV', 3, 'national', ['https://vcdn2.rctiplus.id/live/eds/gtv_fta/live_fta/gtv_fta-avc1_1537200=6-mp4a_64000_eng=2.m3u8'], 'linear-gradient(135deg,#f97316,#7f1d1d)'),
  make('inews', 'iNEWS', 4, 'national', ['https://vcdn2.rctiplus.id/live/eds/inews_fta/live_fta/inews_fta.m3u8'], 'linear-gradient(135deg,#dc2626,#111827)'),
  make('rtv', 'RTV', 5, 'national', ['https://op-group1-swiftservehd-1.dens.tv/h/h10/index.m3u8','https://op-group1-swiftservehd-1.dens.tv/h/h10/02.m3u8'], 'linear-gradient(135deg,#7c3aed,#312e81)'),
  make('trans7', 'TRANS7', 6, 'national', ['https://video.detik.com/trans7/smil:trans7.smil/playlist.m3u8','https://video.detik.com/trans7/smil:trans7.smil/chunklist_w286481765_b744100_sleng.m3u8'], 'linear-gradient(135deg,#dc2626,#1e3a8a)'),
  make('transtv', 'TRANS TV', 7, 'national', ['https://video.detik.com/transtv/smil:transtv.smil/playlist.m3u8'], 'linear-gradient(135deg,#0ea5e9,#1d4ed8)'),
  make('tvone', 'TV One', 8, 'national', ['https://op-group1-swiftservehd-1.dens.tv/h/h40/index.m3u8','https://op-group1-swiftservehd-1.dens.tv/h/h40/02.m3u8'], 'linear-gradient(135deg,#dc2626,#111111)'),
  make('kompastv', 'Kompas TV', 9, 'national', ['https://op-group1-swiftservehd-1.dens.tv/s/s104/index.m3u8','https://op-group1-swiftservehd-1.dens.tv/s/s104/02.m3u8'], 'linear-gradient(135deg,#1e3a8a,#164e63)'),
  make('mdtv', 'MDTV', 10, 'national', ['https://op-group1-swiftservehd-1.dens.tv/h/h223/index.m3u8?app_type=web&userid=lite&chname=MDTV','https://op-group1-swiftservehd-1.dens.tv/h/h223/02.m3u8'], 'linear-gradient(135deg,#db2777,#581c87)'),
  make('tvri', 'TVRI', 11, 'national', ['https://ott-balancer.tvri.go.id/live/eds/Nasional/hls/Nasional.m3u8'], 'linear-gradient(135deg,#1d4ed8,#0f172a)'),
  make('tvri-world', 'TVRI World', 12, 'national', ['https://ott-balancer.tvri.go.id/live/eds/TVRIWorld/hls/TVRIWorld.m3u8'], 'linear-gradient(135deg,#475569,#020617)'),
  make('tvri-sport', 'TVRI Sport', 13, 'national', ['http://118.97.50.107/Content/HLS/Live/Channel(TVRI4)/index.m3u8'], 'linear-gradient(135deg,#15803d,#172554)'),
  make('metrotv', 'Metro TV', 14, 'national', ['https://op-group1-swiftservehd-1.dens.tv/h/h12/index.m3u8','https://op-group1-swiftservehd-1.dens.tv/h/h12/02.m3u8'], 'linear-gradient(135deg,#1e3a8a,#ca8a04)'),
  make('btv', 'BTV', 15, 'national', ['https://op-group1-swiftservehd-1.dens.tv/h/h129/S4/mnf.m3u8'], 'linear-gradient(135deg,#f97316,#b91c1c)'),
  make('sctv', 'SCTV', 16, 'national', ['https://op-group1-swiftservehd-1.dens.tv/h/h217/index.m3u8','https://op-group1-swiftservehd-1.dens.tv/h/h217/02.m3u8'], 'linear-gradient(135deg,#38bdf8,#2563eb)'),
  make('indosiar', 'Indosiar', 17, 'national', ['https://op-group1-swiftservehd-1.dens.tv/h/h235/index.m3u8','https://op-group1-swiftservehd-1.dens.tv/h/h235/02.m3u8'], 'linear-gradient(135deg,#2563eb,#dc2626)'),
  make('cnn-indonesia', 'CNN Indonesia', 18, 'national', ['https://live.cnnindonesia.com/livecnn/smil:cnntv.smil/chunklist_w672934803_b384000_sleng.m3u8'], 'linear-gradient(135deg,#dc2626,#450a0a)'),
  make('cnbc-indonesia', 'CNBC Indonesia', 19, 'national', ['https://live.cnbcindonesia.com/livecnbc/smil:cnbctv.smil/playlist.m3u8'], 'linear-gradient(135deg,#1d4ed8,#083344)'),
  make('garuda-tv', 'Garuda TV', 20, 'national', ['https://stream.garuda.tv/live/garudatv/live.m3u8'], 'linear-gradient(135deg,#b91c1c,#172554)'),
  make('nusantara-tv', 'Nusantara TV', 21, 'national', ['https://nusantaratv.siar.us/nusantaratv/live/playlist.m3u8','https://nusantaratv.siar.us/nusantaratv/live/chunks.m3u8'], 'linear-gradient(135deg,#1d4ed8,#164e63)'),
  make('magna-tv', 'Magna TV', 22, 'national', ['https://edge.medcom.id/live-edge/smil:magna.smil/playlist.m3u8'], 'linear-gradient(135deg,#7e22ce,#831843)'),
  make('adi-tv', 'Adi TV', 23, 'national', ['https://v2.siar.us/aditv/livestream/playlist.m3u8'], 'linear-gradient(135deg,#059669,#14532d)'),
  make('rctv', 'RCTV', 24, 'national', ['https://v10.siar.us/rctv/live/playlist.m3u8'], 'linear-gradient(135deg,#ea580c,#7f1d1d)'),
  make('pal-tv', 'PAL TV', 25, 'national', ['https://v3.siar.us/paltv/live/playlist.m3u8'], 'linear-gradient(135deg,#eab308,#7f1d1d)'),
  make('rri-net', 'RRI NET', 26, 'national', ['https://rrinet.rri.co.id/hls/live.m3u8'], 'linear-gradient(135deg,#1d4ed8,#312e81)'),
  make('bbs-tv', 'BBS TV', 27, 'national', ['http://103.119.54.246:8080/hls/bbstv.m3u8'], 'linear-gradient(135deg,#dc2626,#c2410c)'),
  make('cgtn', 'CGTN', 101, 'international', ['https://news.cgtn.com/resource/live/english/cgtn-news.m3u8'], 'linear-gradient(135deg,#dc2626,#450a0a)', {region:'China',language:'English'}),
  make('dw-english', 'DW English', 102, 'international', ['https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8'], 'linear-gradient(135deg,#52525b,#7f1d1d)', {region:'Germany',language:'English'}),
  make('dw-arabic', 'DW Arabic', 103, 'international', ['https://dwamdstream104.akamaized.net/hls/live/2015530/dwstream104/index.m3u8'], 'linear-gradient(135deg,#52525b,#854d0e)', {region:'Germany',language:'Arabic'}),
  make('ebs-kids', 'EBS KIDS', 104, 'international', ['https://ebsonair.ebs.co.kr/plus3familypc/familypc1m/playlist.m3u8'], 'linear-gradient(135deg,#4ade80,#2563eb)', {region:'Korea',language:'Korean'}),
  make('nhk-world', 'NHK WORLD-JAPAN', 105, 'international', ['https://media-tyo.hls.nhkworld.jp/hls/w/live/master.m3u8'], 'linear-gradient(135deg,#dc2626,#0f172a)', {region:'Japan',language:'English'}),
  make('euronews', 'Euronews', 106, 'international', ['https://cdn-euronews.akamaized.net/live/eds/euronews-en/25002/index.m3u8'], 'linear-gradient(135deg,#1d4ed8,#312e81)', {region:'Europe',language:'English'}),
  make('al-jazeera', 'Al Jazeera English', 107, 'international', ['https://d35j504z0x2vu2.cloudfront.net/v1/master/0bc8e8376bd8417a1b6761138aa41c26c7309312/al-jazeera-english/playlist.m3u8'], 'linear-gradient(135deg,#991b1b,#000000)', {region:'Qatar',language:'English'}),
  make('arirang', 'Arirang', 108, 'international', ['http://amdlive-ch01.ctnd.com.edgesuite.net/arirang_1ch/smil:arirang_1ch.smil/playlist.m3u8'], 'linear-gradient(135deg,#2563eb,#581c87)', {region:'Korea',language:'English'}),
  make('trt-world', 'TRT World', 109, 'international', ['https://tv-trtworld.live.trt.com.tr/master.m3u8'], 'linear-gradient(135deg,#b91c1c,#164e63)', {region:'Turkey',language:'English'}),
  make('rt-america', 'RT America', 110, 'international', ['https://rt-usa.gcdn.co/live/rtusa/playlist.m3u8'], 'linear-gradient(135deg,#15803d,#020617)', {region:'USA',language:'English'}),
  make('cbs-news', 'CBS News', 111, 'international', ['https://cbsn-us-cedexis.cbsnstream.cbsnews.com/out/v1/55a8648e8f134e82a470f83d562deeca/master.m3u8'], 'linear-gradient(135deg,#1d4ed8,#0f172a)', {region:'USA',language:'English'}),
];

export const NATIONAL_COUNT = CHANNELS.filter((channel) => channel.category === 'national').length;
export const INTERNATIONAL_COUNT = CHANNELS.filter((channel) => channel.category === 'international').length;
