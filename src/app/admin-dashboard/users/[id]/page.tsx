import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerT } from '@/lib/i18n/server';
import { getVerifiedSession } from '@/lib/auth-helpers';
import AdminUserDetailClient from './AdminUserDetailClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return {
    title: t('adminUserDetail.title'),
    robots: { index: false, follow: false },
  };
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getVerifiedSession();
  if (!session) redirect('/login?redirect=/admin-dashboard');
  if (session.role !== 'admin') redirect('/unauthorized');
  const { id } = await params;
  return <AdminUserDetailClient userId={id} />;
}
