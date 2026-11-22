import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/platform/auth';
import { bookingById, markRead, supplierById } from '@/platform/data';
import { BookingView } from '@/platform/BookingView';
import { Flash, Head, Shell, s } from '@/platform/ui';

export const metadata = { title: 'Booking' };
type P = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Page({ params, searchParams }: P) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const u = await requireUser('couple');
  const b = await bookingById(id);
  if (!b || b.couple_user_id !== u.id) notFound();
  const sup = (await supplierById(b.supplier_id))!;
  await markRead(b.id, 'couple');
  return (
    <Shell user={u} active="messages">
      <Link href="/platform/couple/messages" className={s.muted}>← All messages</Link>
      <Head title={sup.name} kicker={`${sup.category} · request A-${b.ref_no}`} />
      <Flash sp={sp} />
      <BookingView b={b} sup={sup} side="couple" meId={u.id} />
    </Shell>
  );
}
