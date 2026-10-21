import Icon from './Icon';
import s from './Feature.module.css';
export default function Features({ items }: { items: { icon: string; t: string; d: string }[] }) {
  return (
    <div className={s.grid}>
      {items.map((f, i) => (
        <article key={f.t} className={`${s.item} rv`} style={{ transitionDelay: `${(i % 3) * 70}ms` }}>
          <span className={s.icon}><Icon name={f.icon} /></span>
          <h3>{f.t}</h3>
          <p>{f.d}</p>
        </article>
      ))}
    </div>
  );
}
