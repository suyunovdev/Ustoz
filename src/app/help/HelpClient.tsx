'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import {
  FAQS,
  CATEGORY_LABEL,
  searchFaqs,
  type FaqCategory,
} from '@/lib/data/faqs';

export default function HelpClient() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<FaqCategory | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const results = useMemo(() => searchFaqs(search, category), [search, category]);

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-primary/10 via-background to-warning/5 border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-12 text-center">
          <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
            Yordam markazi
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Tez-tez beriladigan savollar va javoblar
          </p>

          <div className="relative max-w-xl mx-auto">
            <Icon
              name="MagnifyingGlassIcon"
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Savol qidiring..."
              className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-2 mt-4 flex-wrap justify-center">
            <button
              onClick={() => setCategory(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                !category
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              Hammasi ({FAQS.length})
            </button>
            {(Object.entries(CATEGORY_LABEL) as [FaqCategory, { label: string; icon: string }][]).map(
              ([key, meta]) => {
                const count = FAQS.filter((f) => f.category === key).length;
                return (
                  <button
                    key={key}
                    onClick={() => setCategory(key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 ${
                      category === key
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card border border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon name={meta.icon} size={12} />
                    {meta.label} ({count})
                  </button>
                );
              },
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {results.length} ta savol topildi
          </p>
          <Link
            href="/support/tickets"
            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
          >
            <Icon name="ChatBubbleLeftRightIcon" size={14} />
            Mening murojaatlarim
          </Link>
        </div>

        {results.length === 0 ? (
          <div className="text-center py-16 bg-muted/30 rounded-md">
            <Icon
              name="QuestionMarkCircleIcon"
              size={48}
              className="text-muted-foreground mx-auto mb-3"
            />
            <p className="text-muted-foreground mb-3">
              Savol topilmadi. Boshqa kalit so'z bilan urinib ko'ring yoki yangi
              murojaat yozing.
            </p>
            <Link
              href="/support/tickets/new"
              className="inline-flex items-center gap-1 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
            >
              <Icon name="PlusIcon" size={14} />
              Yangi murojaat
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {results.map((f) => {
              const isOpen = openId === f.id;
              return (
                <div
                  key={f.id}
                  className="bg-card border border-border rounded-md overflow-hidden"
                >
                  <button
                    onClick={() => setOpenId(isOpen ? null : f.id)}
                    className="w-full text-left p-4 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon
                        name={CATEGORY_LABEL[f.category].icon}
                        size={14}
                        className="text-primary shrink-0"
                      />
                      <p className="font-medium text-foreground">{f.question}</p>
                    </div>
                    <Icon
                      name={isOpen ? 'ChevronUpIcon' : 'ChevronDownIcon'}
                      size={16}
                      className="text-muted-foreground shrink-0"
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-sm text-muted-foreground whitespace-pre-wrap border-t border-border bg-muted/20">
                      {f.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 p-6 bg-primary/5 border border-primary/30 rounded-md text-center">
          <h2 className="font-medium text-foreground mb-1">Javob topa olmadingizmi?</h2>
          <p className="text-sm text-muted-foreground mb-3">
            Bizning support jamoamiz sizga yordam beradi
          </p>
          <Link
            href="/support/tickets/new"
            className="inline-flex items-center gap-1 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
          >
            <Icon name="ChatBubbleLeftRightIcon" size={14} />
            Murojaat yuborish
          </Link>
        </div>
      </div>
    </div>
  );
}
