'use client';
import { useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import s from './p.module.css';

/** Submit button that shows a pending state. */
export function Submit({ children, className = '', pending = 'Saving…', name, value, formAction }: { children: React.ReactNode; className?: string; pending?: string; name?: string; value?: string; formAction?: (fd: FormData) => void }) {
  const st = useFormStatus();
  return <button className={`${s.btn} ${className}`} disabled={st.pending} name={name} value={value} formAction={formAction}>{st.pending ? pending : children}</button>;
}

/** Two-step button for destructive actions (no browser dialogs). */
export function ConfirmSubmit({ children, confirm = 'Are you sure?', className = '', name, value }: { children: React.ReactNode; confirm?: string; className?: string; name?: string; value?: string }) {
  const [armed, setArmed] = useState(false);
  const st = useFormStatus();
  useEffect(() => { if (!armed) return; const t = setTimeout(() => setArmed(false), 5000); return () => clearTimeout(t); }, [armed]);
  if (!armed) return <button type="button" className={`${s.btn} ${className}`} onClick={() => setArmed(true)}>{children}</button>;
  return <button className={`${s.btn} ${s.danger} ${className}`} name={name} value={value} disabled={st.pending}>{st.pending ? 'Working…' : confirm}</button>;
}

/** Re-fetches server data every few seconds (for message threads). */
export function AutoRefresh({ every = 15000 }: { every?: number }) {
  const r = useRouter();
  useEffect(() => { const t = setInterval(() => { if (document.visibilityState === 'visible') r.refresh(); }, every); return () => clearInterval(t); }, [r, every]);
  return null;
}

/** Scrolls a thread to the newest message. */
export function ScrollEnd() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const el = ref.current?.parentElement; if (el) el.scrollTop = el.scrollHeight; });
  return <div ref={ref} />;
}

/** Shrinks photos in the browser before upload (keeps them under the 4 MB upload limit). */
async function shrink(file: File, max = 2000): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;
  try {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    if (k === 1 && file.size < 1.5e6) return file;
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
    const blob: Blob | null = await new Promise((res) => c.toBlob(res, 'image/jpeg', 0.85));
    return blob ? new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' }) : file;
  } catch { return file; }
}

/** Photo picker: compresses each image, then submits them one by one to the given server action. */
export function PhotoUpload({ action, label = 'Add photos' }: { action: (fd: FormData) => Promise<{ error?: string } | void>; label?: string }) {
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const r = useRouter();
  const onPick = async (files: FileList | null) => {
    if (!files?.length) return;
    setErr('');
    const list = [...files];
    for (let i = 0; i < list.length; i++) {
      setBusy(`Uploading ${i + 1} of ${list.length}…`);
      const fd = new FormData(); fd.append('file', await shrink(list[i]));
      const res = await action(fd);
      if (res && 'error' in res && res.error) { setErr(res.error); break; }
    }
    setBusy(''); r.refresh();
  };
  return (
    <div className={s.stack}>
      <label className={`${s.btn} ${s.ghost} ${s.sm}`} style={{ justifySelf: 'start', cursor: busy ? 'default' : 'pointer' }}>
        {busy || label}
        <input type="file" accept="image/*" multiple hidden disabled={!!busy} onChange={(e) => { onPick(e.target.files); e.target.value = ''; }} />
      </label>
      {err && <p className={s.alert}>{err}</p>}
    </div>
  );
}

/** Single file upload (brochure). */
export function FileUpload({ action, accept, label }: { action: (fd: FormData) => Promise<{ error?: string } | void>; accept: string; label: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const r = useRouter();
  return (
    <div className={s.stack}>
      <label className={`${s.btn} ${s.ghost} ${s.sm}`} style={{ justifySelf: 'start', cursor: 'pointer' }}>
        {busy ? 'Uploading…' : label}
        <input type="file" accept={accept} hidden disabled={busy} onChange={async (e) => {
          const f = e.target.files?.[0]; e.target.value = ''; if (!f) return;
          setBusy(true); setErr('');
          const fd = new FormData(); fd.append('file', f);
          const res = await action(fd);
          if (res && 'error' in res && res.error) setErr(res.error);
          setBusy(false); r.refresh();
        }} />
      </label>
      {err && <p className={s.alert}>{err}</p>}
    </div>
  );
}

/** Live total on the enquiry form (package + extras × guests). */
export function EnquiryTotal({ pkgs, extras, guests: g0 }: { pkgs: { id: string; price: number; per_guest: boolean; deposit: number }[]; extras: { id: string; price: number; per_guest: boolean }[]; guests: number }) {
  const [t, setT] = useState({ total: 0, dep: 0 });
  useEffect(() => {
    const form = document.getElementById('enquiry') as HTMLFormElement | null;
    if (!form) return;
    const calc = () => {
      const fd = new FormData(form);
      const guests = parseInt(String(fd.get('guests') || g0), 10) || 0;
      const p = pkgs.find((x) => x.id === fd.get('package_id'));
      const ex = fd.getAll('extras').map(String);
      let total = p ? (p.per_guest ? p.price * guests : p.price) : 0;
      for (const x of extras) if (ex.includes(x.id)) total += x.per_guest ? x.price * guests : x.price;
      setT({ total, dep: Math.round((total * (p?.deposit ?? 0)) / 100) });
    };
    calc(); form.addEventListener('input', calc); form.addEventListener('change', calc);
    return () => { form.removeEventListener('input', calc); form.removeEventListener('change', calc); };
  }, [pkgs, extras, g0]);
  return <div className={s.row}><span className={s.muted}>Estimated total · deposit £{t.dep.toLocaleString('en-GB')}</span><b className={s.big} style={{ fontSize: '1.5rem' }}>£{t.total.toLocaleString('en-GB')}</b></div>;
}
