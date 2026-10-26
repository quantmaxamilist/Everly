import A from './A';
import Icon from './Icon';
import Img from './Img';
import s from './CtaBand.module.css';
export default function CtaBand({ title = 'Start building your wedding', text = 'Free for couples. Build as many versions as you like, then book the one you love.' }: { title?: string; text?: string }) {
  return (
    <section className={`section ${s.band}`}>
      <div className={`container ${s.in}`}>
        <div className={`${s.card} rv`}>
          <div className={s.copy}>
            <p className="eyebrow">Everly.</p>
            <h2>{title}</h2>
            <p className="lead">{text}</p>
            <div className={s.ctas}>
              <A to="/start" className="btn btn--light">Start building <Icon name="arrow" /></A>
              <A to="/start" className="btn btn--ghost">List your business</A>
            </div>
          </div>
          <div className={s.arch}><Img src="/images/arch.jpg" alt="Outdoor ceremony with a floral arch" fill sizes="(min-width: 900px) 380px, 80vw" /></div>
        </div>
      </div>
    </section>
  );
}
