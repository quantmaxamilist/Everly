import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';
export const dynamic = 'force-static';
export default function sitemap(): MetadataRoute.Sitemap {
  return ['', '/how-it-works', '/couples', '/suppliers', '/about', '/faq', '/contact', '/signup'].map((p) => ({ url: site.url + p, changeFrequency: 'monthly', priority: p === '' ? 1 : 0.7 }));
}
