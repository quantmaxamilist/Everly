import Link from 'next/link';
import { href } from '@/lib/site';
const PREVIEW = process.env.NEXT_PUBLIC_PREVIEW === '1';
/** Internal link: next/link normally, a plain <a> in the static preview. */
export default function A({ to, children, ...rest }: { to: string; children: React.ReactNode } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) {
  if (PREVIEW) return <a href={href(to)} {...rest}>{children}</a>;
  return <Link href={to} {...rest}>{children}</Link>;
}
