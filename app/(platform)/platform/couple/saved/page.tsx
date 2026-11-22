import Link from 'next/link';
import { requireUser } from '@/platform/auth';
import { weddingFor } from '@/platform/data';
import { cardsByIds, savedIds } from '@/platform/couple';
import { SupplierCards } from '@/platform/Cards';
import { Head, Shell, s } from '@/platform/ui';

export const metadata = { title: 'Saved' };

export default async function Page() {
  const u = await requireUser('couple');
  const w = await weddingFor(u.id);
  const saved = await savedIds(u.id);
  const cards = await cardsByIds([...saved]);
  return (
    <Shell user={u} active="saved">
      <Head title="Saved" kicker="Suppliers you’ve hearted" />
      {cards.length ? <SupplierCards cards={cards} saved={saved} back="/platform/couple/saved" guests={w?.guests ?? 100} /> : <div className={`${s.card} ${s.empty}`}>Tap the ♡ on any supplier to save it here. <Link href="/platform/couple/explore">Explore suppliers</Link></div>}
    </Shell>
  );
}
