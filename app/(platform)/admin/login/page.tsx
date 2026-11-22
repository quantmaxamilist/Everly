import { LoginView } from '@/platform/LoginView';

export const metadata = { title: 'Admin log in' };
type P = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Page({ searchParams }: P) {
  return <LoginView sp={await searchParams} admin />;
}
