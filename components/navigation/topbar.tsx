"use client";
import Image from "next/image";
import { Radio, Search } from "lucide-react";
import ThemeToggle from "@/components/ui/theme-toggle";
type Props={query:string;onQueryChange:(value:string)=>void};
const logoUrl=process.env.NEXT_PUBLIC_HIDZPROJECT_LOGO??"https://www.gobox.my.id/file/vVUoB.png";
export default function Topbar({query,onQueryChange}:Props){
 return <header className="sticky top-0 z-40 border-b-2 border-[var(--hz-border)] bg-[var(--hz-bg)]/95 backdrop-blur">
  <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-5">
   <div className="flex items-center gap-3">
    <div className="grid size-11 shrink-0 place-items-center rounded-xl border-2 border-[var(--hz-border)] bg-[var(--hz-accent)] p-1 shadow-[3px_3px_0_var(--hz-border)]">
     <Image src={logoUrl} alt="HIDZPROJECT" width={36} height={36} className="size-8 rounded-lg object-cover" unoptimized/>
    </div>
    <div className="leading-none"><div className="flex items-center gap-2"><span className="text-lg font-black tracking-tight">HIDZTV</span><span className="inline-flex items-center gap-1 rounded-full border border-[var(--hz-border)] px-2 py-1 text-[9px] font-black uppercase tracking-[.18em]"><Radio size={10}/>Live</span></div><span className="mt-1 block text-[10px] font-bold uppercase tracking-[.2em] text-[var(--hz-muted)]">HIDZPROJECT</span></div>
   </div>
   <div className="flex w-full items-center gap-2 lg:max-w-xl">
    <label className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--hz-muted)]"/><input aria-label="Cari channel" value={query} onChange={e=>onQueryChange(e.target.value)} placeholder="Cari channel, negara, bahasa..." className="hz-input rounded-lg py-3 pl-10 pr-3 text-sm"/></label>
    <ThemeToggle/>
   </div>
  </div>
 </header>
}
