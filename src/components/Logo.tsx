import { asset } from '@/lib/site';
/** Asteria wordmark (vector, traced from the brand pack). */
export default function Logo({ white = false, height = 30 }: { white?: boolean; height?: number }) {
  const w = Math.round((4914 / 1085) * height);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={asset(white ? '/brand/asteria-logo-white.svg' : '/brand/asteria-logo.svg')} alt="Asteria" width={w} height={height} style={{ width: w, height }} />
  );
}
