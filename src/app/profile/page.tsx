import type { Metadata } from 'next';
import { Suspense } from 'react';
import ProfileClient from './ProfileClient';

export const metadata: Metadata = {
  title: 'Profil',
  description: 'Shaxsiy ma\'lumotlaringizni tahrirlang, profil rasmingizni yangilang va akkaunt sozlamalarini boshqaring.',
};

export const dynamic = 'force-dynamic';

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="p-8">Yuklanmoqda…</div>}>
      <ProfileClient />
    </Suspense>
  );
}
