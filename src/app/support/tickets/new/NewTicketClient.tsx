'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { toast } from '@/components/common/Toaster';
import { useCreateTicketMutation } from '@/hooks/mutations/useUserTicketMutations';
import type { TicketPriorityDTO } from '@/hooks/queries/useSupportTickets';
import { useI18n } from '@/contexts/I18nContext';

const CATEGORIES = [
  { value: 'billing', label: "To'lovlar" },
  { value: 'technical', label: 'Texnik muammo' },
  { value: 'course', label: 'Kurs masalasi' },
  { value: 'account', label: 'Hisob' },
  { value: 'other', label: 'Boshqa' },
];

const PRIORITIES: { value: TicketPriorityDTO; label: string; desc: string }[] = [
  { value: 'low', label: 'Past', desc: 'Tezkor javob shart emas' },
  { value: 'normal', label: 'Oddiy', desc: '1-3 ish kuni ichida' },
  { value: 'high', label: 'Yuqori', desc: '24 soat ichida' },
  { value: 'urgent', label: 'Shoshilinch', desc: 'Tezkor javob kerak' },
];

export default function NewTicketClient() {
  const router = useRouter();
  const mut = useCreateTicketMutation();
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('technical');
  const [priority, setPriority] = useState<TicketPriorityDTO>('normal');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
  const { t } = useI18n();
    e.preventDefault();
    if (subject.trim().length < 5) return toast.error("Sarlavha kamida 5 belgi");
    if (message.trim().length < 10) return toast.error("Tavsif kamida 10 belgi");

    mut.mutate(
      { subject: subject.trim(), category, priority, message: message.trim() },
      {
        onSuccess: ({ ticket }) => {
          toast.success("Murojaat yuborildi");
          router.push(`/support/tickets/${ticket.id}`);
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Link
        href="/support/tickets"
        className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-3"
      >
        <Icon name="ArrowLeftIcon" size={14} />
        Mening murojaatlarim
      </Link>

      <h1 className="text-2xl font-heading font-semibold mb-2">Yangi murojaat</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Mavzuni aniq tasvirlang — bu javobni tezroq olishingizga yordam beradi
      </p>

      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-md p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Sarlavha *</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            minLength={5}
            maxLength={200}
            placeholder="Qisqacha sarlavha"
            className="w-full px-3 py-2 border border-border rounded-md text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Kategoriya *</label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                className={`p-2 rounded-md border text-xs ${
                  category === c.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:bg-muted'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Muhimligi *</label>
          <div className="grid grid-cols-2 gap-2">
            {PRIORITIES.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPriority(p.value)}
                className={`p-2.5 rounded-md border text-left ${
                  priority === p.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:bg-muted'
                }`}
              >
                <p className="text-sm font-medium text-foreground">{p.label}</p>
                <p className="text-xs text-muted-foreground">{p.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Batafsil tavsif * <span className="text-muted-foreground font-normal">(min 10 belgi)</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            minLength={10}
            rows={6}
            placeholder="Muammo nima? Qanday harakatlar amalga oshirgansiz? Qanday natija kutgan edingiz?"
            className="w-full px-3 py-2 border border-border rounded-md text-sm resize-y"
          />
          <p className="text-xs text-muted-foreground mt-1">{message.length} belgi</p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <Link
            href="/support/tickets"
            className="px-4 py-2 text-foreground hover:bg-muted rounded-md text-sm"
          >
            Bekor
          </Link>
          <button
            type="submit"
            disabled={mut.isPending}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {mut.isPending && (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
            Yuborish
          </button>
        </div>
      </form>
    </div>
  );
}
