import fs from 'node:fs';
import path from 'node:path';
import Link from 'next/link';
import s from './LegalDoc.module.css';

/**
 * Renders one of Asteria's legal documents from content/legal/*.txt
 * Format: first line = title, "Effective…/Version…" line = date line, "## " = section heading,
 * "• " = bullet, [table] … [/table] with " | " between columns, anything else = paragraph.
 */
type Block =
  | { t: 'h'; text: string; id: string; n: number }
  | { t: 'p'; text: string }
  | { t: 'ul'; items: string[] }
  | { t: 'table'; head: string[]; rows: string[][] };

const slug = (x: string) => x.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function parse(file: string) {
  const raw = fs.readFileSync(path.join(process.cwd(), 'content/legal', file), 'utf8').replace(/\r/g, '');
  const lines = raw.split('\n');
  const title = lines.shift()!.trim();
  let meta = '';
  const blocks: Block[] = [];
  let n = 0;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!l) continue;
    if (!meta && /^(Effective|Version)/.test(l)) { meta = l; continue; }
    if (l.startsWith('## ')) { const text = l.slice(3); blocks.push({ t: 'h', text, id: slug(text), n: ++n }); continue; }
    if (l === '[table]') {
      const rows: string[][] = [];
      for (i++; i < lines.length && lines[i].trim() !== '[/table]'; i++) if (lines[i].trim()) rows.push(lines[i].split(' | ').map((c) => c.trim()));
      blocks.push({ t: 'table', head: rows[0], rows: rows.slice(1) });
      continue;
    }
    if (l.startsWith('•')) {
      const item = l.replace(/^•\s*/, '');
      const last = blocks[blocks.length - 1];
      if (last?.t === 'ul') last.items.push(item); else blocks.push({ t: 'ul', items: [item] });
      continue;
    }
    blocks.push({ t: 'p', text: l });
  }
  return { title, meta, blocks };
}

/* inline: emails, links to the other documents, bold lead-ins like "Commission." */
const LINKS: [RegExp, string][] = [
  [/(Privacy Notice)/, '/privacy'],
  [/(separate supplier agreement)/, '/supplier-terms'],
  [/(Stripe’s Privacy Policy)/, 'https://stripe.com/gb/privacy'],
  [/(Information Commissioner’s Office)/, 'https://ico.org.uk/make-a-complaint/'],
];
function inline(text: string, self: string, key = 0): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const lead = text.match(/^([A-Z][a-z]+(?: [a-z]+){0,2})\. (?=[A-Z])/);
  if (lead) { out.push(<b key={`l${key}`}>{lead[1]}.</b>, ' '); text = text.slice(lead[0].length); }
  const parts = text.split(/([\w.+-]+@[\w-]+\.[\w.-]*\w)/g);
  parts.forEach((part, i) => {
    if (i % 2) { out.push(<a key={`e${i}`} href={`mailto:${part}`}>{part}</a>); return; }
    let rest: React.ReactNode[] = [part];
    for (const [re, href] of LINKS) {
      if (href === self) continue;
      rest = rest.flatMap((r, j): React.ReactNode[] => {
        if (typeof r !== 'string') return [r];
        const bits = r.split(re);
        return bits.map((b, k) => (k % 2 ? (href.startsWith('/') ? <Link key={`${href}${i}${j}${k}`} href={href}>{b}</Link> : <a key={`${href}${i}${j}${k}`} href={href} target="_blank" rel="noreferrer">{b}</a>) : b));
      });
    }
    out.push(...rest);
  });
  return out;
}

export default function LegalDoc({ file, self }: { file: string; self: string }) {
  const { title, meta, blocks } = parse(file);
  const heads = blocks.filter((b): b is Extract<Block, { t: 'h' }> => b.t === 'h');
  return (
    <section className="section">
      <div className={`container ${s.wrap}`}>
        <header className={s.top}>
          <p className="eyebrow">Legal</p>
          <h1>{title}</h1>
          {meta && <p className={s.meta}>{meta}</p>}
        </header>
        <div className={s.layout}>
          <nav className={s.toc} aria-label="Contents">
            <p>Contents</p>
            <ol>{heads.map((h) => <li key={h.id}><a href={`#${h.id}`}>{h.text}</a></li>)}</ol>
            <div className={s.other}>
              {self !== '/terms' && <Link href="/terms">Terms of Use</Link>}
              {self !== '/privacy' && <Link href="/privacy">Privacy Notice</Link>}
              {self !== '/supplier-terms' && <Link href="/supplier-terms">Supplier Terms</Link>}
            </div>
          </nav>
          <article className={s.body}>
            {blocks.map((b, i) => {
              if (b.t === 'h') return <h2 key={i} id={b.id}><span>{b.n}.</span> {b.text}</h2>;
              if (b.t === 'ul') return <ul key={i}>{b.items.map((x, j) => <li key={j}>{inline(x, self, j)}</li>)}</ul>;
              if (b.t === 'table') return (
                <div key={i} className={s.tableWrap}>
                  <table>
                    <thead><tr>{b.head.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
                    <tbody>{b.rows.map((r, j) => <tr key={j}>{r.map((c, k) => <td key={k} data-label={b.head[k]}>{inline(c, self)}</td>)}</tr>)}</tbody>
                  </table>
                </div>
              );
              return <p key={i}>{inline(b.text, self, i)}</p>;
            })}
            <footer className={s.foot}>
              Asteria Events Ltd · Company number 17554727 · Registered office: Unit 3-4 Cranmere Court, Lustleigh Close, Marsh Barton Trading Estate, Exeter, England, EX2 8PW · <a href="mailto:support@asteria-events.com">support@asteria-events.com</a>
            </footer>
          </article>
        </div>
      </div>
    </section>
  );
}
