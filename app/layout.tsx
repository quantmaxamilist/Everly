import type { Metadata, Viewport } from 'next';
import '@fontsource/playfair-display/600.css';
import '@fontsource/playfair-display/400-italic.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import './globals.css';
import Reveal from '@/components/Reveal';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `Everly. — ${site.tagline}`, template: '%s | Everly.' },
  description: site.description,
  openGraph: { type: 'website', siteName: 'Everly.', locale: 'en_GB', images: ['/images/hero.jpg'] },
  twitter: { card: 'summary_large_image' },
};
export const viewport: Viewport = { themeColor: '#FAF6F2', width: 'device-width', initialScale: 1 };

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Everly',
  url: site.url,
  logo: `${site.url}/brand/everly-icon-512.png`,
  description: site.description,
  areaServed: 'GB',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <head>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js');setTimeout(function(){if(!document.querySelector('.rv.in'))document.documentElement.classList.add('rv-off')},3000)" }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body>
        {children}
        <Reveal />
      </body>
    </html>
  );
}
