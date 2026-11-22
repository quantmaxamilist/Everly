import type { Metadata } from 'next';

export const metadata: Metadata = { title: { default: 'Asteria platform', template: '%s | Asteria' }, robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return children;
}
