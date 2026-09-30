"use client";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
type Theme="dark"|"light";
export default function ThemeToggle(){
  const [theme,setTheme]=useState<Theme>("dark"); const [mounted,setMounted]=useState(false);
  useEffect(()=>{const saved=window.localStorage.getItem("hidztv-theme") as Theme|null;const initial=saved??(window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark");document.documentElement.dataset.theme=initial;setTheme(initial);setMounted(true)},[]);
  const toggle=()=>{const next:Theme=theme==="dark"?"light":"dark";document.documentElement.dataset.theme=next;window.localStorage.setItem("hidztv-theme",next);setTheme(next)};
  return <button type="button" className="hz-button grid size-12 shrink-0 place-items-center rounded-lg bg-[var(--hz-surface)]" onClick={toggle} aria-label="Ganti tema">{mounted&&theme==="dark"?<Sun size={18}/>:<Moon size={18}/>}</button>
}
