import type { Metadata } from 'next';
import Form from '@/components/Form';
import Img from '@/components/Img';
import Icon from '@/components/Icon';
import { site } from '@/lib/site';
import s from '../inner.module.css';

export const metadata: Metadata = { title: 'Contact', description: 'Get in touch with Everly.' };

export default function Page() {
  return (
    <section className="section">
      <div className={`container ${s.formWrap}`}>
        <div className={s.formSide}>
          <p className="eyebrow">Contact</p>
          <h1>Say <em>hello</em></h1>
          <p className="lead">Questions about Everly, listing your business or partnering with us — send a message and we&rsquo;ll get back to you.</p>
          <a href={`mailto:${site.email}`} className="pill" style={{ justifySelf: 'start' }}><Icon name="mail" />{site.email}</a>
          <div className={s.formArch}><Img src="/images/bouquet.jpg" alt="" fill sizes="340px" /></div>
        </div>
        <div className={s.formCard}><Form kind="contact" /></div>
      </div>
    </section>
  );
}
