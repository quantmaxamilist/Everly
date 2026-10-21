'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
/** Adds .in to .rv elements as they enter the viewport. */
export default function Reveal() {
  const path = usePathname();
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('.rv:not(.in)');
    if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return; }
    const io = new IntersectionObserver((ents) => ents.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [path]);
  return null;
}
