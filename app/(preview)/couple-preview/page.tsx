import type { Metadata } from 'next';
import CoupleApp from '@/demo/CoupleApp';
export const metadata: Metadata = { title: 'Couple preview', robots: { index: false } };
export default function Page() { return <CoupleApp />; }
