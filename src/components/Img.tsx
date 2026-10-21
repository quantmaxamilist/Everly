import Image, { type ImageProps } from 'next/image';
import { asset } from '@/lib/site';
/** next/image wrapper — keeps paths working in the static preview build. */
export default function Img(props: ImageProps & { src: string }) {
  return <Image {...props} src={asset(props.src)} />;
}
