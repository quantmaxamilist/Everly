import Icon from './Icon';
import Img from './Img';
import s from './Feature.module.css';
export default function Split({ eyebrow, title, text, points, img, alt = '', reverse, children }: { eyebrow: string; title: React.ReactNode; text: string; points?: string[]; img?: string; alt?: string; reverse?: boolean; children?: React.ReactNode }) {
  return (
    <div className={`${s.split} ${reverse ? s.rev : ''}`}>
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="rv">{title}</h2>
        <p className="lead">{text}</p>
        {points && <ul className={s.list}>{points.map((p) => <li key={p}><Icon name="check" size={18} />{p}</li>)}</ul>}
      </div>
      {children ?? (img && <div className={`${s.img} rv`}><Img src={img} alt={alt} fill sizes="(min-width: 900px) 560px, 92vw" /></div>)}
    </div>
  );
}
