import Img from './Img';
import s from './PageHero.module.css';
export default function PageHero({ eyebrow, title, lead, img, children }: { eyebrow: string; title: React.ReactNode; lead: string; img?: string; children?: React.ReactNode }) {
  return (
    <section className={s.hero}>
      <div className={`container ${s.in} ${img ? s.withImg : ''}`}>
        <div className={s.copy}>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="lead">{lead}</p>
          {children && <div className={s.ctas}>{children}</div>}
        </div>
        {img && <div className={s.arch}><Img src={img} alt="" fill priority sizes="(min-width: 900px) 420px, 90vw" /></div>}
      </div>
    </section>
  );
}
