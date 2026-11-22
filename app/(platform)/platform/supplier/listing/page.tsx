import Link from 'next/link';
import { redirect } from 'next/navigation';
import Icon from '@/components/Icon';
import { requireUser } from '@/platform/auth';
import { extrasOf, packagesOf, photosOf, supplierFor } from '@/platform/data';
import { saveDetails, addPhoto, removePhoto, makeCover, savePackage, deletePackage, saveExtra, deleteExtra, uploadBrochure, removeBrochure } from '@/platform/actions/supplier';
import { ConfirmSubmit, FileUpload, PhotoUpload, Submit } from '@/platform/client';
import { Flash, Head, Shell, s } from '@/platform/ui';
import { CATEGORIES, REGIONS, STYLES, gbp, type Pkg } from '@/platform/util';

export const metadata = { title: 'My listing' };
type P = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function PackageForm({ p }: { p?: Pkg }) {
  const id = p?.id ?? 'new';
  return (
    <form action={savePackage} className={s.form}>
      {p && <input type="hidden" name="id" value={p.id} />}
      <div className={s.f2}>
        <div className={s.field}><label htmlFor={`pn-${id}`}>Package name</label><input id={`pn-${id}`} name="name" className={s.input} defaultValue={p?.name} required placeholder="e.g. Full Day Exclusive" /></div>
        <div className={s.field}><label htmlFor={`ps-${id}`}>Short description</label><input id={`ps-${id}`} name="summary" className={s.input} defaultValue={p?.summary} placeholder="e.g. Exclusive use 10am – midnight" /></div>
      </div>
      <div className={`${s.f2} ${s.f3}`}>
        <div className={s.field}><label htmlFor={`pp-${id}`}>Price (£)</label><input id={`pp-${id}`} name="price" inputMode="numeric" className={s.input} defaultValue={p?.price} required /></div>
        <div className={s.field}><label htmlFor={`pd-${id}`}>Deposit %</label><input id={`pd-${id}`} name="deposit" inputMode="numeric" className={s.input} defaultValue={p?.deposit ?? 25} /></div>
        <div className={s.field}><label htmlFor={`pg-${id}`}>Max guests <small>(optional)</small></label><input id={`pg-${id}`} name="max_guests" inputMode="numeric" className={s.input} defaultValue={p?.max_guests ?? ''} /></div>
      </div>
      <label className={s.check}><input type="checkbox" name="per_guest" defaultChecked={p?.per_guest} /><span>Price is per guest</span></label>
      <div className={s.field}><label htmlFor={`ph-${id}`}>Hours / coverage <small>(optional)</small></label><input id={`ph-${id}`} name="hours" className={s.input} defaultValue={p?.hours} placeholder="e.g. 14 hours" /></div>
      <div className={s.field}><label htmlFor={`pi-${id}`}>What’s included <small>(one per line)</small></label><textarea id={`pi-${id}`} name="includes" className={s.input} defaultValue={p?.includes.join('\n')} placeholder={'Ceremony room\nTables, chairs & linen\nWedding coordinator'} /></div>
      <Submit className={s.sm}>{p ? 'Save package' : 'Add package'}</Submit>
    </form>
  );
}

export default async function Page({ searchParams }: P) {
  const sp = await searchParams;
  const u = await requireUser('supplier');
  const sup = await supplierFor(u.id);
  if (!sup) redirect('/platform/login');
  const [photos, pkgs, extras] = await Promise.all([photosOf(sup.id), packagesOf(sup.id, true), extrasOf(sup.id)]);
  const from = pkgs.length ? Math.min(...pkgs.map((p) => p.price)) : 0;

  return (
    <Shell user={u} active="listing">
      <Head title="My listing" kicker="What couples see when they find you">
        {sup.status === 'approved' && <Link href={`/platform/couple/s/${sup.id}`} className={`${s.btn} ${s.ghost} ${s.sm}`}>View as a couple</Link>}
        <span className={`${s.tag} ${sup.status === 'approved' ? s.t_ok : sup.status === 'pending' ? s.t_new : s.t_warn}`}>{sup.status === 'approved' ? 'Live on Asteria' : sup.status === 'pending' ? 'Waiting for approval' : 'Hidden'}</span>
      </Head>
      <Flash sp={sp} />
      <div className={s.split}>
        <div className={s.stack} style={{ gap: 16 }}>
          <div className={s.card}>
            <div className={s.row}><b className={s.h3}>Photos</b><span className={s.muted}>{photos.length} of 30 · the first is your cover</span></div>
            <div className={s.photoGrid}>
              {photos.map((p, i) => (
                <div key={p.id} className={s.photo}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt="" />
                  <div className={s.pActs}>
                    {i === 0 ? <span className={`${s.pBtn} ${s.cover}`}>Cover</span> : <form action={makeCover}><input type="hidden" name="id" value={p.id} /><button className={s.pBtn}>Make cover</button></form>}
                    <form action={removePhoto}><input type="hidden" name="id" value={p.id} /><button className={s.pBtn} aria-label="Remove photo">✕</button></form>
                  </div>
                </div>
              ))}
            </div>
            {!photos.length && <p className={s.muted}>Add photos of your venue or work — listings with 6+ photos get far more enquiries.</p>}
            <PhotoUpload action={addPhoto} />
          </div>

          <form action={saveDetails} className={`${s.card} ${s.form}`}>
            <b className={s.h3}>Details</b>
            <div className={s.f2}>
              <div className={s.field}><label htmlFor="d-n">Business name</label><input id="d-n" name="name" className={s.input} defaultValue={sup.name} required /></div>
              <div className={s.field}><label htmlFor="d-c">Category</label><select id="d-c" name="category" className={s.input} defaultValue={sup.category}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
              <div className={s.field}><label htmlFor="d-t">Town</label><input id="d-t" name="town" className={s.input} defaultValue={sup.town} /></div>
              <div className={s.field}><label htmlFor="d-r">Region</label><select id="d-r" name="region" className={s.input} defaultValue={sup.region}><option value="">Choose…</option>{REGIONS.map((c) => <option key={c}>{c}</option>)}</select></div>
              <div className={s.field}><label htmlFor="d-s">Style</label><select id="d-s" name="style" className={s.input} defaultValue={sup.style}><option value="">—</option>{STYLES.map((c) => <option key={c}>{c}</option>)}</select></div>
              <div className={s.field}><label htmlFor="d-cap">Max guests <small>(venues)</small></label><input id="d-cap" name="capacity" inputMode="numeric" className={s.input} defaultValue={sup.capacity ?? ''} /></div>
              <div className={s.field}><label htmlFor="d-p">Phone <small>(shown after booking)</small></label><input id="d-p" name="phone" className={s.input} defaultValue={sup.phone} /></div>
              <div className={s.field}><label htmlFor="d-w">Website or Instagram</label><input id="d-w" name="website" className={s.input} defaultValue={sup.website} /></div>
            </div>
            <label className={s.check}><input type="checkbox" name="travels" defaultChecked={sup.travels} /><span>We travel UK-wide (show us to couples in every region)</span></label>
            <div className={s.field}><label htmlFor="d-a">About — what you offer</label><textarea id="d-a" name="about" className={s.input} style={{ minHeight: 160 }} defaultValue={sup.about} /></div>
            <Submit className={s.sm}>Save details</Submit>
          </form>

          <div className={s.card} id="packages">
            <div className={s.row}><b className={s.h3}>Packages</b><span className={s.muted}>{pkgs.length ? `From ${gbp(from)}` : 'Add at least one so couples can book'}</span></div>
            {pkgs.map((p) => (
              <div key={p.id} className={s.pkg}>
                <div className={s.row}><b>{p.name}</b><span>{gbp(p.price)}{p.per_guest ? ' pp' : ''}</span></div>
                <span className={s.muted}>{p.summary}{p.summary ? ' · ' : ''}{p.deposit}% deposit{p.max_guests ? ` · up to ${p.max_guests}` : ''}{p.hours ? ` · ${p.hours}` : ''}</span>
                {p.includes.length > 0 && <ul className={s.ticks}>{p.includes.map((x) => <li key={x}><Icon name="check" />{x}</li>)}</ul>}
                <details className={s.box}><summary>Edit</summary><PackageForm p={p} />
                  <form action={deletePackage} style={{ marginTop: 10 }}><input type="hidden" name="id" value={p.id} /><ConfirmSubmit className={`${s.ghost} ${s.sm}`} confirm="Remove this package">Remove package</ConfirmSubmit></form>
                </details>
              </div>
            ))}
            <details className={s.box} open={!pkgs.length}><summary>+ Add a package</summary><PackageForm /></details>
          </div>

          <div className={s.card} id="extras">
            <div className={s.row}><b className={s.h3}>Extras</b><span className={s.muted}>Add-ons couples can tick when they enquire</span></div>
            <div className={s.list}>
              {extras.map((x) => (
                <div key={x.id} className={s.li} style={{ gridTemplateColumns: '1fr' }}>
                  <form action={saveExtra} className={s.btnRow}>
                    <input type="hidden" name="id" value={x.id} />
                    <input name="name" className={s.input} defaultValue={x.name} aria-label="Extra" style={{ flex: '2 1 160px' }} />
                    <input name="price" inputMode="numeric" className={s.input} defaultValue={x.price} aria-label="Price" style={{ flex: '1 1 80px' }} />
                    <label className={s.check}><input type="checkbox" name="per_guest" defaultChecked={x.per_guest} />per guest</label>
                    <Submit className={`${s.ghost} ${s.sm}`}>Save</Submit>
                    <button formAction={deleteExtra} className={`${s.btn} ${s.ghost} ${s.sm}`}>Remove</button>
                  </form>
                </div>
              ))}
            </div>
            <form action={saveExtra} className={s.btnRow}>
              <input name="name" className={s.input} placeholder="e.g. Table decoration" aria-label="New extra" style={{ flex: '2 1 160px' }} required />
              <input name="price" inputMode="numeric" className={s.input} placeholder="£" aria-label="Price" style={{ flex: '1 1 80px' }} />
              <label className={s.check}><input type="checkbox" name="per_guest" />per guest</label>
              <Submit className={s.sm}>Add extra</Submit>
            </form>
          </div>
        </div>

        <div className={s.stack} style={{ gap: 16 }}>
          <div className={s.card} style={{ padding: 0, overflow: 'hidden' }}>
            <div className={s.sImg}>{photos[0] ? (/* eslint-disable-next-line @next/next/no-img-element */ <img src={photos[0].url} alt="" />) : <span className={s.noImg}><Icon name="camera" size={32} /></span>}{sup.featured && <span className={`${s.tag} ${s.t_feat}`}>★ Featured</span>}</div>
            <div className={s.sInfo}>
              <span className={s.muted} style={{ fontSize: '.7rem', letterSpacing: '.1em', textTransform: 'uppercase' }}>{sup.category}</span>
              <b>{sup.name}</b>
              <span className={s.muted}>{[sup.town, sup.region].filter(Boolean).join(', ')}{sup.capacity ? ` · up to ${sup.capacity}` : ''}</span>
              {pkgs.length > 0 && <span>From {gbp(from)}{pkgs.find((p) => p.price === from)?.per_guest ? ' / guest' : ''}</span>}
            </div>
            <p className={s.muted} style={{ padding: '0 14px 14px' }}>How your card looks in search.</p>
          </div>
          <div className={s.card}>
            <b className={s.h3}>Brochure</b>
            {sup.brochure_url ? (
              <div className={s.row}>
                <a href={sup.brochure_url} target="_blank" rel="noreferrer" className={s.muted}>{sup.brochure_name || 'Brochure.pdf'}</a>
                <form action={removeBrochure}><button className={`${s.btn} ${s.ghost} ${s.sm}`}>Remove</button></form>
              </div>
            ) : <p className={s.muted}>Upload a PDF brochure (up to 4 MB) — couples can download it from your listing.</p>}
            <FileUpload action={uploadBrochure} accept="application/pdf" label={sup.brochure_url ? 'Replace brochure' : 'Upload brochure'} />
          </div>
        </div>
      </div>
    </Shell>
  );
}
