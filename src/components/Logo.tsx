import { asset } from '@/lib/site';
export default function Logo({ white = false, height = 40 }: { white?: boolean; height?: number }) {
  const w = Math.round((862 / 360) * height);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={asset(white ? '/brand/everly-logo-white.png' : '/brand/everly-logo.png')} alt="Everly." width={w} height={height} style={{ width: w, height }} />
  );
}
