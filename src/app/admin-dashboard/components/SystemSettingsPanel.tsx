'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';
import { toast } from '@/components/common/Toaster';

interface SettingsState {
  bunny: {
    libraryId: string;
    apiKeySet: boolean;
    apiKeyMasked: string;
    tokenKeySet: boolean;
    configured: boolean;
  };
  subscriberDiscountPct: number;
}

const SystemSettingsPanel = () => {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<SettingsState | null>(null);

  // Forma qiymatlari (maxfiy kalitlar bo'sh boshlanadi — o'zgartirilmasa saqlanmaydi)
  const [libraryId, setLibraryId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [tokenKey, setTokenKey] = useState('');
  const [discount, setDiscount] = useState('0');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/settings', { credentials: 'include' });
        if (!res.ok) throw new Error();
        const j: SettingsState = await res.json();
        setData(j);
        setLibraryId(j.bunny.libraryId || '');
        setDiscount(String(j.subscriberDiscountPct ?? 0));
      } catch {
        toast.error(t('admin.settingsLoadError'));
      } finally {
        setLoading(false);
      }
    })();
  }, [t]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          bunnyLibraryId: libraryId,
          bunnyApiKey: apiKey,
          bunnyTokenKey: tokenKey,
          subscriberDiscountPct: Number(discount) || 0,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(t('admin.settingsSaved'));
      // Maxfiy inputlarni tozalab, holatni qayta yuklaymiz
      setApiKey('');
      setTokenKey('');
      const fresh = await fetch('/api/admin/settings', { credentials: 'include' });
      if (fresh.ok) {
        const j: SettingsState = await fresh.json();
        setData(j);
        setLibraryId(j.bunny.libraryId || '');
      }
    } catch {
      toast.error(t('admin.settingsSaveError'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const StatusBadge = ({ ok }: { ok: boolean }) => (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
        ok ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'
      }`}
    >
      <Icon name={ok ? 'CheckCircleIcon' : 'ExclamationCircleIcon'} size={13} />
      {ok ? t('admin.settingsConfigured') : t('admin.settingsNotSet')}
    </span>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Video (Bunny Stream) */}
      <section className="bg-card rounded-lg border border-border p-6 space-y-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon name="VideoCameraIcon" size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-foreground">{t('admin.settingsBunnyTitle')}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">{t('admin.settingsBunnyDesc')}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">{t('admin.settingsLibraryId')}</label>
            <input
              type="text"
              value={libraryId}
              onChange={(e) => setLibraryId(e.target.value)}
              placeholder="123456"
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-foreground">{t('admin.settingsApiKey')}</label>
              <StatusBadge ok={!!data?.bunny.apiKeySet} />
            </div>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={data?.bunny.apiKeySet ? `${data.bunny.apiKeyMasked} — ${t('admin.settingsKeepEmpty')}` : t('admin.settingsEnterKey')}
              autoComplete="new-password"
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-foreground">{t('admin.settingsTokenKey')}</label>
              <StatusBadge ok={!!data?.bunny.tokenKeySet} />
            </div>
            <input
              type="password"
              value={tokenKey}
              onChange={(e) => setTokenKey(e.target.value)}
              placeholder={data?.bunny.tokenKeySet ? t('admin.settingsKeepEmpty') : t('admin.settingsEnterKey')}
              autoComplete="new-password"
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <p className="text-xs text-muted-foreground flex items-start gap-1.5">
            <Icon name="InformationCircleIcon" size={14} className="mt-0.5 flex-shrink-0" />
            {t('admin.settingsBunnyHelp')}
          </p>
        </div>
      </section>

      {/* Umumiy */}
      <section className="bg-card rounded-lg border border-border p-6 space-y-4">
        <h3 className="font-heading font-semibold text-foreground">{t('admin.settingsGeneralTitle')}</h3>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">{t('admin.settingsDiscount')}</label>
          <div className="relative w-40">
            <input
              type="number"
              min={0}
              max={100}
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="w-full px-3 py-2 pr-8 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth disabled:opacity-50 font-medium"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
          ) : (
            <Icon name="CheckIcon" size={18} />
          )}
          {t('admin.settingsSave')}
        </button>
      </div>
    </div>
  );
};

export default SystemSettingsPanel;
