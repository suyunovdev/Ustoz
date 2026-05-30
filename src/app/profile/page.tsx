import { Suspense } from 'react';
import ProfileClient from './ProfileClient';

export const dynamic = 'force-dynamic';

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="p-8">Yuklanmoqda…</div>}>
      <ProfileClient />
    </Suspense>
  );
}
