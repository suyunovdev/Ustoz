import type { Metadata } from 'next';
import { Suspense } from 'react';
import MessagesClient from './MessagesClient';

export const metadata: Metadata = {
  title: 'Xabarlar',
  description: 'O\'qituvchilar va talabalar bilan xabar almashing. Shaxsiy yozishmalar va guruh muloqotlari.',
};

export const dynamic = 'force-dynamic';

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="p-8">Yuklanmoqda…</div>}>
      <MessagesClient />
    </Suspense>
  );
}
