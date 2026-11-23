import type { Metadata } from 'next';
import LegalDoc from '@/components/LegalDoc';

export const metadata: Metadata = { title: 'Privacy Notice', description: 'How Asteria Events Ltd collects, uses and protects personal information.', alternates: { canonical: '/privacy' } };

export default function Page() {
  return <LegalDoc file="privacy.txt" self="/privacy" />;
}
