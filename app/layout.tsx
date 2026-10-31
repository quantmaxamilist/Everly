import type { Metadata, Viewport } from 'next';
import '@fontsource/playfair-display/600.css';
import '@fontsource/playfair-display/400-italic.css';
import '@fontsource/playfair-display/500.css';
import '@fontsource/montserrat/400.css';
import '@fontsource/montserrat/500.css';
import '@fontsource/montserrat/600.css';
import './globals.css';
import Reveal from '@/components/Reveal';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `Asteria — ${site.tagline}`, template: '%s | Asteria' },
  description: site.description,
  openGraph: { type: 'website', siteName: 'Asteria', locale: 'en_GB', images: ['/images/hero.jpg'] },
  twitter: { card: 'summary_large_image' },
};
export const viewport: Viewport = { themeColor: '#F4EFE8', width: 'device-width', initialScale: 1 };

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Asteria',
  url: site.url,
  logo: `${site.url}/brand/asteria-icon-512.png`,
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
