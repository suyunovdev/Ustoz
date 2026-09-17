import type { Metadata } from 'next';
import { getServerT } from '@/lib/i18n/server';
import BecomeTeacherForm from './BecomeTeacherForm';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return {
    title: t('becomeTeacher.title'),
    description: t('becomeTeacher.subtitle'),
  };
}

export default function BecomeTeacherPage() {
  return <BecomeTeacherForm />;
}
