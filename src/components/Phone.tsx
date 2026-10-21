import Icon from './Icon';
import Img from './Img';
import s from './Phone.module.css';

/** App-style "My Wedding" screen, drawn in HTML so it stays crisp. Example content. */
export default function Phone({ variant = 'wedding' }: { variant?: 'wedding' | 'plan' }) {
  return (
    <div className={s.phone} aria-hidden="true">
      <div className={s.notch} />
      <div className={s.screen}>
        <div className={s.status}><span>9:41</span><span className={s.sig}><i /><i /><i /></span></div>
        {variant === 'wedding' ? (
          <div className={s.body}>
            <p className={s.kick}>My Wedding</p>
            <p className={s.h}>Emma &amp; James</p>
            <div className={s.date}><Icon name="calendar" size={15} /> Sat 12 June 2027</div>
            <div className={s.hero}><Img src="/images/villa.jpg" alt="" fill sizes="240px" /><span>The Stone Villa</span></div>
            <div className={s.pay}>
              <div><small>Paid</small><b>£6,240</b></div>
              <div><small>Still to pay</small><b>£15,600</b></div>
            </div>
            <ul className={s.list}>
              <li><span className={s.ok}><Icon name="check" size={12} /></span>Venue<em>Deposit paid</em></li>
              <li><span className={s.ok}><Icon name="check" size={12} /></span>Photography<em>Contract signed</em></li>
              <li><span className={s.due} />Flowers<em>Balance due 1 May</em></li>
            </ul>
          </div>
        ) : (
          <div className={s.body}>
            <p className={s.h}>Your Wedding Plan</p>
            <p className={s.kick2}>4 of 6 complete</p>
            <div className={s.prog}><span style={{ width: '66%' }} /></div>
            <ul className={s.check}>
              {['Find a venue', 'Book photographer', 'Choose caterer', 'Book florist', 'Plan entertainment', 'Send invitations'].map((t, i) => (
                <li key={t} className={i < 4 ? s.done : ''}><span>{i < 4 && <Icon name="check" size={12} />}</span>{t}</li>
              ))}
            </ul>
          </div>
        )}
        <nav className={s.tabs}>
          {[['home', 'Home'], ['search', 'Search'], ['calendar', 'Plan'], ['checkbox', 'Bookings'], ['user', 'Profile']].map(([i, l], k) => (
            <span key={l} className={k === (variant === 'wedding' ? 3 : 2) ? s.act : ''}><Icon name={i} size={18} />{l}</span>
          ))}
        </nav>
      </div>
    </div>
  );
}
