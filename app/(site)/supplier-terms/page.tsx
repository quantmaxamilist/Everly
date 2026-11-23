import type { Metadata } from 'next';
import LegalDoc from '@/components/LegalDoc';

export const metadata: Metadata = { title: 'Supplier Terms', description: 'The agreement between Asteria Events Ltd and suppliers who list on Asteria.', alternates: { canonical: '/supplier-terms' } };

export default function Page() {
  return <LegalDoc file="supplier-terms.txt" self="/supplier-terms" />;
}
