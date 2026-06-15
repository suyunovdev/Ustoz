import type { Metadata } from 'next';
import { Suspense } from 'react';
import HelpClient from './HelpClient';

export const metadata: Metadata = {
  title: 'Yordam markazi',
  description: 'Ko\'p beriladigan savollar, qo\'llanmalar va texnik yordam. Ustoz platformasidan foydalanish bo\'yicha yordam.',
};

export const dynamic = 'force-dynamic';

export default function HelpPage() {
  return (
    <Suspense fallback={<div className="p-8">Yuklanmoqda…</div>}>
      <HelpClient />
    </Suspense>
  );
}
