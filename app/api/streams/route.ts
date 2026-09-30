import { NextResponse } from "next/server";
import { CHANNELS } from "@/lib/channels";
import { buildCandidateSources } from "@/lib/stream-engine";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:Request){
 const {searchParams,origin}=new URL(request.url);
 const channelId=searchParams.get("channel");
 if(!channelId)return NextResponse.json({error:"channel query is required"},{status:400});
 const channel=CHANNELS.find(c=>c.id===channelId);
 if(!channel)return NextResponse.json({error:"channel not found"},{status:404});
 return NextResponse.json({channelId:channel.id,name:channel.name,sources:buildCandidateSources(channel.sources,origin)},{headers:{"Cache-Control":"no-store"}});
}
