import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { requireUser } from '@/platform/auth';
import { bookingById, markRead, supplierFor } from '@/platform/data';
import { BookingView } from '@/platform/BookingView';
import { Flash, Head, Shell, s } from '@/platform/ui';

export const metadata = { title: 'Booking' };
type P = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Page({ params, searchParams }: P) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const u = await requireUser('supplier');
  const sup = await supplierFor(u.id);
  if (!sup) redirect('/platform/login');
  const b = await bookingById(id);
  if (!b || b.supplier_id !== sup.id) notFound();
  await markRead(b.id, 'supplier');
  return (
    <Shell user={u} active="enquiries">
      <Link href="/platform/supplier/enquiries" className={s.muted}>← All enquiries</Link>
      <Head title={b.couple_name} kicker={`${b.source === 'direct' ? 'Direct booking' : 'Enquiry'} A-${b.ref_no}`} />
      <Flash sp={sp} />
      <BookingView b={b} sup={sup} side="supplier" meId={u.id} />
    </Shell>
  );
}
