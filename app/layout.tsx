import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

const logoUrl=process.env.NEXT_PUBLIC_HIDZPROJECT_LOGO??"https://www.gobox.my.id/file/vVUoB.png";

export const metadata:Metadata={
  title:"HidzTv — Live TV",
  description:"HidzTv · Live TV streaming dengan branding HIDZPROJECT.",
  icons:{icon:logoUrl,shortcut:logoUrl,apple:logoUrl},
  openGraph:{title:"HidzTv — Live TV",description:"Live TV dari HidzProject.",images:[logoUrl]}
};

export default function RootLayout({children}:{children:ReactNode}){
  return <html lang="id" data-theme="dark" suppressHydrationWarning><body>{children}</body></html>;
}
