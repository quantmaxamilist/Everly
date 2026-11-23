import type { Metadata } from 'next';
import LegalDoc from '@/components/LegalDoc';

export const metadata: Metadata = { title: 'Terms of Use', description: 'The terms that apply when you browse Asteria or use our wedding planning and booking features.', alternates: { canonical: '/terms' } };

export default function Page() {
  return <LegalDoc file="terms.txt" self="/terms" />;
}
