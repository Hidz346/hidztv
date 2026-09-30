import type { StreamSource } from "@/types/tv";
const protocols=new Set(["http:","https:"]);
export function isSupportedStreamUrl(value:string){try{const u=new URL(value);return protocols.has(u.protocol)}catch{return false}}
export function getProxyUrl(origin:string,sourceUrl:string){return origin+"/api/proxy?u="+encodeURIComponent(sourceUrl)}
export function buildCandidateSources(sources:readonly StreamSource[],origin?:string){const out:string[]=[];const seen=new Set<string>();const proxyEnabled=process.env.HIDZTV_PROXY_ENABLED!=="false";for(const item of sources){if(!isSupportedStreamUrl(item.url)||seen.has(item.url))continue;seen.add(item.url);out.push(item.url);if(origin&&proxyEnabled){const p=getProxyUrl(origin,item.url);if(!seen.has(p)){seen.add(p);out.push(p)}}}return out}