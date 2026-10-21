import A from '@/components/A';
export default function NotFound() {
  return (
    <section className="section" style={{ textAlign: 'center' }}>
      <div className="container" style={{ display: 'grid', gap: '1rem', justifyItems: 'center' }}>
        <p className="eyebrow">404</p>
        <h1>This page <em>wandered off</em></h1>
        <p className="lead">Let&rsquo;s get you back to building.</p>
        <A to="/" className="btn">Back home</A>
      </div>
    </section>
  );
}
