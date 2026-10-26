import type { Metadata } from 'next';
import SupplierApp from '@/demo/SupplierApp';
export const metadata: Metadata = { title: 'Supplier preview', robots: { index: false } };
export default function Page() { return <SupplierApp />; }
