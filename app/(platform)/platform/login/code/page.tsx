import { CodeLoginView } from '@/platform/CodeLoginView';

export const metadata = { title: 'Sign in with a code' };
type P = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Page({ searchParams }: P) {
  return <CodeLoginView sp={await searchParams} />;
}
