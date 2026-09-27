import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HidzTV — Live TV Universe',
  description: 'HidzTV live channel directory with resilient HLS playback.',
  applicationName: 'HidzTV',
  icons: {
    icon: 'https://www.gobox.my.id/file/IcHjU.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#090909',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
