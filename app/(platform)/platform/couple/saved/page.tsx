import Link from 'next/link';
import { requireUser } from '@/platform/auth';
import { weddingFor } from '@/platform/data';
import { cardsByIds, savedIds } from '@/platform/couple';
import { SupplierCards } from '@/platform/Cards';
import { Head, Shell, s } from '@/platform/ui';
import { isPlus } from '@/platform/plus';

export const metadata = { title: 'Saved' };

export default async function Page() {
  const u = await requireUser('couple');
  const w = await weddingFor(u.id);
  const saved = await savedIds(u.id);
  const cards = await cardsByIds([...saved]);
  const plus = await isPlus(u.id);
  return (
    <Shell user={u} active="saved">
      <Head title="Saved" kicker="Suppliers you’ve hearted" />
      <div className={s.notice} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <span className={s.plusBadge}>Plus</span>
        {plus ? <span>Price watch is on — we’ll tell you when any of these suppliers change their prices.</span>
          : <span>Want to know when these suppliers change their prices? <Link href="/platform/couple/plus">Price watch comes with Asteria Plus</Link>.</span>}
      </div>
      {cards.length ? <SupplierCards cards={cards} saved={saved} back="/platform/couple/saved" guests={w?.guests ?? 100} /> : <div className={`${s.card} ${s.empty}`}>Tap the ♡ on any supplier to save it here. <Link href="/platform/couple/explore">Explore suppliers</Link></div>}
    </Shell>
  );
}
