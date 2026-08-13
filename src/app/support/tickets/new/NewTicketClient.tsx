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
  { value: 'billing', labelKey: 'support.categoryBilling' },
  { value: 'technical', labelKey: 'support.categoryTechnical' },
  { value: 'course', labelKey: 'support.categoryCourse' },
  { value: 'account', labelKey: 'support.categoryAccount' },
  { value: 'other', labelKey: 'support.categoryOther' },
];

const PRIORITIES: { value: TicketPriorityDTO; labelKey: string; descKey: string }[] = [
  { value: 'low', labelKey: 'support.priorityLow', descKey: 'support.priorityLowDesc' },
  { value: 'normal', labelKey: 'support.priorityNormal', descKey: 'support.priorityNormalDesc' },
  { value: 'high', labelKey: 'support.priorityHigh', descKey: 'support.priorityHighDesc' },
  { value: 'urgent', labelKey: 'support.priorityUrgent', descKey: 'support.priorityUrgentDesc' },
];

export default function NewTicketClient() {
  const router = useRouter();
  const { t } = useI18n();
  const mut = useCreateTicketMutation();
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('technical');
  const [priority, setPriority] = useState<TicketPriorityDTO>('normal');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (subject.trim().length < 5) return toast.error(t('support.errSubjectMin'));
    if (message.trim().length < 10) return toast.error(t('support.errMessageMin'));

    mut.mutate(
      { subject: subject.trim(), category, priority, message: message.trim() },
      {
        onSuccess: ({ ticket }) => {
          toast.success(t('support.ticketSent'));
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
        {t('support.myTickets')}
      </Link>

      <h1 className="text-2xl font-heading font-semibold mb-2">{t('support.newTicket')}</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {t('support.newTicketSubtitle')}
      </p>

      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-md p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t('support.subjectLabel')} *</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            minLength={5}
            maxLength={200}
            placeholder={t('support.subjectPlaceholder')}
            className="w-full px-3 py-2 border border-border rounded-md text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t('support.categoryLabel')} *</label>
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
                {t(c.labelKey)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t('support.priorityLabel')} *</label>
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
                <p className="text-sm font-medium text-foreground">{t(p.labelKey)}</p>
                <p className="text-xs text-muted-foreground">{t(p.descKey)}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            {t('support.descriptionLabel')} * <span className="text-muted-foreground font-normal">{t('support.minCharsHint')}</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            minLength={10}
            rows={6}
            placeholder={t('support.messagePlaceholder')}
            className="w-full px-3 py-2 border border-border rounded-md text-sm resize-y"
          />
          <p className="text-xs text-muted-foreground mt-1">{t('support.charCount', { count: message.length })}</p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <Link
            href="/support/tickets"
            className="px-4 py-2 text-foreground hover:bg-muted rounded-md text-sm"
          >
            {t('support.cancel')}
          </Link>
          <button
            type="submit"
            disabled={mut.isPending}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {mut.isPending && (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
            {t('support.submit')}
          </button>
        </div>
      </form>
    </div>
  );
}
