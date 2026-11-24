import type { Metadata } from 'next';
import LegalDoc from '@/components/LegalDoc';

export const metadata: Metadata = { title: 'Supplier Fee Schedule', description: 'Asteria plans, commission rates and optional extras for suppliers.', alternates: { canonical: '/fee-schedule' } };

export default function Page() {
  return <LegalDoc file="fee-schedule.txt" self="/fee-schedule" />;
}
