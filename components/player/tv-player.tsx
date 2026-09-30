"use client";
import Hls from "hls.js";
import { Radio, RotateCcw, Signal } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Channel, PlaybackStatus } from "@/types/tv";
import PlayerControls from "@/components/player/player-controls";
import PlayerStatus from "@/components/player/player-status";

type Props={channel:Channel|null;sources:string[]};

export default function TvPlayer({channel,sources}:Props){
 const videoRef=useRef<HTMLVideoElement>(null);
 const shellRef=useRef<HTMLDivElement>(null);
 const hlsRef=useRef<Hls|null>(null);
 const timerRef=useRef<ReturnType<typeof setTimeout>|null>(null);
 const failedRef=useRef(false);
 const [index,setIndex]=useState(0);
 const [status,setStatus]=useState<PlaybackStatus>("idle");
 const [message,setMessage]=useState("");
 const [playing,setPlaying]=useState(false);
 const [muted,setMuted]=useState(false);
 const active=useMemo(()=>sources[index]??null,[sources,index]);

 const clearTimer=()=>{if(timerRef.current){clearTimeout(timerRef.current);timerRef.current=null}};
 const reset=()=>{const v=videoRef.current;if(!v)return;v.pause();v.removeAttribute("src");v.load();v.onloadedmetadata=null;v.oncanplay=null;v.onerror=null;v.onplay=null;v.onpause=null};

 useEffect(()=>{
   setIndex(0);setPlaying(false);
   if(!channel){setStatus("error");setMessage("Tidak ada channel yang dipilih.");return}
   if(!channel.sources.length){setStatus("error");setMessage("Channel ini belum memiliki source HLS.");return}
   setStatus("connecting");setMessage("Menyiapkan source live...");
 },[channel?.id,channel?.sources.length]);

 useEffect(()=>{
   const video=videoRef.current;
   if(!video||!active)return;
   let disposed=false;
   failedRef.current=false;

   const cleanup=()=>{clearTimer();hlsRef.current?.destroy();hlsRef.current=null;reset()};
   const fail=(reason:string)=>{
     if(disposed||failedRef.current)return;
     failedRef.current=true;clearTimer();
     if(index<sources.length-1){setStatus("fallback");setMessage(reason);setIndex(v=>v+1)}
     else{setStatus("error");setMessage(reason)}
   };
   const ready=()=>{
     if(disposed)return;
     clearTimer();setStatus("playing");setMessage("");
     void video.play().then(()=>setPlaying(true)).catch(()=>{setPlaying(false);setStatus("paused");setMessage("Autoplay diblokir browser. Tekan tombol play untuk memulai.")});
   };

   setStatus(index>0?"fallback":"connecting");
   setMessage(index>0?"Mencoba source cadangan...":"Menghubungkan ke live stream...");
   setPlaying(false);
   timerRef.current=setTimeout(()=>fail("Source terlalu lama merespons. Beralih ke source berikutnya."),16000);
   video.onplay=()=>setPlaying(true);
   video.onpause=()=>setPlaying(false);

   if(Hls.isSupported()){
     const hls=new Hls({
       enableWorker:true,lowLatencyMode:true,backBufferLength:20,maxBufferLength:14,maxBufferHole:.8,
       liveSyncDurationCount:2,manifestLoadingTimeOut:10000,levelLoadingTimeOut:10000,fragLoadingTimeOut:10000,
       manifestLoadingMaxRetry:1,levelLoadingMaxRetry:1,fragLoadingMaxRetry:1
     });
     hlsRef.current=hls;
     hls.on(Hls.Events.MEDIA_ATTACHED,()=>hls.loadSource(active));
     hls.on(Hls.Events.MANIFEST_PARSED,ready);
     hls.on(Hls.Events.ERROR,(_event,data)=>{
       if(disposed||!data.fatal)return;
       if(data.type===Hls.ErrorTypes.MEDIA_ERROR){
         try{hls.recoverMediaError();return}catch{}
       }
       fail("Source HLS gagal diputar. Beralih ke source berikutnya.");
     });
     hls.attachMedia(video);
     return()=>{disposed=true;cleanup()};
   }

   if(video.canPlayType("application/vnd.apple.mpegurl")){
     video.onloadedmetadata=ready;video.oncanplay=ready;video.onerror=()=>fail("Browser gagal membaca source HLS.");
     video.src=active;video.load();
     return()=>{disposed=true;cleanup()};
   }

   setStatus("unsupported");setMessage("Browser ini tidak menyediakan dukungan HLS untuk pemutaran live.");
   return()=>{disposed=true;cleanup()};
 },[active,index,sources.length]);

 const retry=()=>{setIndex(0);setStatus("connecting");setMessage("Mengulang koneksi...")};
 const togglePlay=()=>{
   const v=videoRef.current;if(!v)return;
   if(v.paused){void v.play().then(()=>{setPlaying(true);setStatus("playing");setMessage("")}).catch(()=>{setStatus("paused");setMessage("Browser menahan playback. Tekan play lagi.")})}else v.pause();
 };
 const toggleMute=()=>{const v=videoRef.current;if(!v)return;v.muted=!v.muted;setMuted(v.muted)};
 const fullscreen=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await shellRef.current?.requestFullscreen()}catch{setMessage("Fullscreen tidak tersedia di browser ini.")}};

 return <div ref={shellRef} className="hz-card hz-scanlines relative overflow-hidden rounded-2xl bg-black">
  <div className="relative aspect-video w-full">
   <video ref={videoRef} playsInline preload="metadata" className="size-full bg-black object-contain" aria-label={"Pemutar "+(channel?.name??"HidzTv")}/>
   <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between bg-gradient-to-b from-black/80 to-transparent p-3 text-white sm:p-4">
    <div className="min-w-0">
     <div className="flex items-center gap-2"><span className="rounded-full bg-[var(--hz-accent)] px-2 py-1 text-[9px] font-black text-black">LIVE</span><span className="truncate text-xs font-black">{channel?.name??"HidzTv"}</span></div>
     {channel&&<div className="mt-1 text-[9px] font-bold uppercase tracking-[.16em] text-white/55">CH {String(channel.number).padStart(2,"0")} · {channel.region}</div>}
    </div>
    <div className="flex items-center gap-2 text-[9px] font-black text-white/70"><span className="rounded-full border border-white/20 bg-black/30 px-2 py-1">SRC {sources.length?index+1:0}/{sources.length}</span><Signal size={14}/></div>
   </div>
   <PlayerStatus status={status} message={message} onRetry={retry}/>
   <PlayerControls playing={playing} muted={muted} onPlayPause={togglePlay} onMute={toggleMute} onFullscreen={fullscreen}/>
  </div>
  <div className="flex items-center justify-between gap-3 border-t-2 border-white/15 bg-black px-3 py-2 text-[10px] font-black uppercase tracking-[.12em] text-white/55 sm:px-4">
   <div className="flex min-w-0 items-center gap-2"><Radio size={13} className="shrink-0 text-[var(--hz-accent)]"/><span className="truncate">{status==="playing"?"Signal active":status==="fallback"?"Failover":status==="error"?"Offline / upstream error":"Standby"}</span></div>
   <button type="button" onClick={retry} className="inline-flex shrink-0 items-center gap-1.5 text-white/70 hover:text-white" aria-label="Reload stream"><RotateCcw size={12}/>Retry</button>
  </div>
 </div>;
}
