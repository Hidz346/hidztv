import type { Channel, ChannelCategory } from "@/types/tv";
const source=(url:string,label="Direct")=>({url,label});
export const CHANNELS: readonly Channel[]=[
{id:"rcti",number:1,name:"RCTI HD",shortName:"RCTI",category:"national",region:"Indonesia",language:"Indonesia",sources:[source("https://mncmedia.malingtv.workers.dev/rcti.m3u8"),source("https://live.rctiplus.id/rctiplus/rcti_360p.m3u8","Backup")]},
{id:"mnctv",number:2,name:"MNC TV HD",shortName:"MNCTV",category:"national",region:"Indonesia",language:"Indonesia",sources:[source("https://mncmedia.malingtv.workers.dev/mnctv.m3u8"),source("https://live.rctiplus.id/rctiplus/mnctv_720p.m3u8","Backup")]},
{id:"gtv",number:3,name:"GTV HD",shortName:"GTV",category:"national",region:"Indonesia",language:"Indonesia",sources:[source("https://mncmedia.malingtv.workers.dev/gtv.m3u8"),source("https://live.rctiplus.id/rctiplus/gtv_360p.m3u8","Backup")]},
{id:"sctv",number:4,name:"SCTV HD",shortName:"SCTV",category:"national",region:"Indonesia",language:"Indonesia",sources:[source("http://op-group1-swiftservehd-1.dens.tv/h/h217/02.m3u8")]},
{id:"indosiar",number:5,name:"Indosiar HD",shortName:"IND",category:"national",region:"Indonesia",language:"Indonesia",sources:[source("http://op-group1-swiftservehd-1.dens.tv/h/h207/index.m3u8")]},
{id:"transtv",number:6,name:"Trans TV HD",shortName:"TRANS",category:"national",region:"Indonesia",language:"Indonesia",sources:[source("https://video.detik.com/transtv/smil:transtv.smil/index.m3u8")]},
{id:"trans7",number:7,name:"Trans7 HD",shortName:"T7",category:"national",region:"Indonesia",language:"Indonesia",sources:[source("https://video.detik.com/trans7/smil:trans7.smil/index.m3u8")]},
{id:"antv",number:8,name:"ANTV HD",shortName:"ANTV",category:"national",region:"Indonesia",language:"Indonesia",sources:[source("http://op-group1-swiftservehd-1.dens.tv/s/s07/index.m3u8?app_type=web&userid=lite&chname=antv")]},
{id:"inews",number:9,name:"iNews HD",shortName:"iNews",category:"national",region:"Indonesia",language:"Indonesia",sources:[source("https://live.i-news.tv/hls/1/stream.m3u8")]},
{id:"cnn-indonesia",number:10,name:"CNN Indonesia",shortName:"CNN",category:"national",region:"Indonesia",language:"Indonesia",sources:[source("https://live.cnnindonesia.com/livecnn/smil:cnntv.smil/playlist.m3u8")]},
{id:"cnbc-indonesia",number:11,name:"CNBC Indonesia",shortName:"CNBC",category:"national",region:"Indonesia",language:"Indonesia",sources:[source("https://live.cnbcindonesia.com/livecnbc/smil:cnbctv.smil/master.m3u8")]},
{id:"cna",number:12,name:"CNA",shortName:"CNA",category:"international",region:"Singapore",language:"English",sources:[]},
{id:"nhk-world",number:13,name:"NHK World Japan",shortName:"NHK",category:"international",region:"Japan",language:"English",sources:[]},
{id:"dw-english",number:14,name:"DW English",shortName:"DW",category:"international",region:"Germany",language:"English",sources:[]},
{id:"trt-world",number:15,name:"TRT World",shortName:"TRT",category:"international",region:"Türkiye",language:"English",sources:[]},
{id:"red-bull",number:16,name:"Red Bull TV",shortName:"RBT",category:"entertainment",region:"International",language:"English",sources:[]},
{id:"cartoon-network",number:17,name:"Cartoon Network",shortName:"CN",category:"kids",region:"International",language:"English",sources:[]},
{id:"moonbug",number:18,name:"Moonbug Kids",shortName:"MOON",category:"kids",region:"International",language:"English",sources:[]},
{id:"ahsan-tv",number:19,name:"Ahsan TV",shortName:"AHSAN",category:"religion",region:"Indonesia",language:"Indonesia",sources:[]},
{id:"salam-tv",number:20,name:"Salam TV",shortName:"SALAM",category:"religion",region:"Indonesia",language:"Indonesia",sources:[]},
];
export const CATEGORY_LABELS:Record<"all"|ChannelCategory,string>={all:"Semua",national:"Nasional",international:"Internasional",entertainment:"Hiburan & Sport",kids:"Kids",religion:"Religi"};
export function getChannels(){return CHANNELS}
export function getCategoryCounts():Record<"all"|ChannelCategory,number>{return {all:CHANNELS.length,national:CHANNELS.filter(c=>c.category==="national").length,international:CHANNELS.filter(c=>c.category==="international").length,entertainment:CHANNELS.filter(c=>c.category==="entertainment").length,kids:CHANNELS.filter(c=>c.category==="kids").length,religion:CHANNELS.filter(c=>c.category==="religion").length}}