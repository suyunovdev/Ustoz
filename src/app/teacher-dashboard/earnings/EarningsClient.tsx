'use client';

import { useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import ConfirmModal from '@/components/common/ConfirmModal';
import { toast } from '@/components/common/Toaster';
import {
  useTeacherBalance,
  useTeacherPayments,
  useTeacherWithdrawals,
  usePayoutSettings,
  type PaymentStatusDTO,
  type WithdrawalDTO,
  type WithdrawalStatusDTO,
  type WithdrawalMethodDTO,
} from '@/hooks/queries/useTeacherEarnings';
import {
  useRequestWithdrawalMutation,
  useCancelWithdrawalMutation,
  useUpdatePayoutSettingsMutation,
} from '@/hooks/mutations/useEarningsMutations';
import { useI18n } from '@/contexts/I18nContext';

function fmtUzs(s: string): string {
  const n = BigInt(s);
  return n.toLocaleString('uz-UZ').replace(/,/g, ' ');
}

const PAYMENT_STATUS_KEYS: Record<
  PaymentStatusDTO,
  { labelKey: string; color: string }
> = {
  pending: { labelKey: 'teacher.earningsPaymentPending', color: 'bg-muted text-muted-foreground' },
  processing: { labelKey: 'teacher.earningsPaymentProcessing', color: 'bg-warning/10 text-warning' },
  completed: { labelKey: 'teacher.earningsPaymentCompleted', color: 'bg-success/10 text-success' },
  failed: { labelKey: 'teacher.earningsPaymentFailed', color: 'bg-destructive/10 text-destructive' },
  cancelled: { labelKey: 'teacher.earningsPaymentCancelled', color: 'bg-muted text-muted-foreground' },
  refunded: { labelKey: 'teacher.earningsPaymentRefunded', color: 'bg-warning/10 text-warning' },
};

const WITHDRAWAL_STATUS_KEYS: Record<
  WithdrawalStatusDTO,
  { labelKey: string; color: string; icon: string }
> = {
  pending: {
    labelKey: 'teacher.earningsWithdrawalPending',
    color: 'bg-warning/10 text-warning',
    icon: 'ClockIcon',
  },
  processing: {
    labelKey: 'teacher.earningsWithdrawalProcessing',
    color: 'bg-primary/10 text-primary',
    icon: 'ArrowPathIcon',
  },
  completed: {
    labelKey: 'teacher.earningsWithdrawalCompleted',
    color: 'bg-success/10 text-success',
    icon: 'CheckCircleIcon',
  },
  rejected: {
    labelKey: 'teacher.earningsWithdrawalRejected',
    color: 'bg-destructive/10 text-destructive',
    icon: 'XCircleIcon',
  },
  cancelled: {
    labelKey: 'teacher.earningsWithdrawalCancelled',
    color: 'bg-muted text-muted-foreground',
    icon: 'NoSymbolIcon',
  },
};

export default function EarningsClient() {
  const { t } = useI18n();
  const balance = useTeacherBalance();
  const withdrawals = useTeacherWithdrawals();
  const [tab, setTab] = useState<'payments' | 'withdrawals' | 'settings'>(
    'payments',
  );
  const [paymentStatus, setPaymentStatus] = useState<
    PaymentStatusDTO | undefined
  >();
  const payments = useTeacherPayments({ status: paymentStatus });
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [pendingCancel, setPendingCancel] = useState<WithdrawalDTO | null>(null);
  const cancelMut = useCancelWithdrawalMutation();

  const b = balance.data?.balance;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/teacher-dashboard"
            className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-2"
          >
            <Icon name="ArrowLeftIcon" size={14} />
            Dashboard
          </Link>
          <h1 className="text-2xl font-heading font-semibold">{t('teacher.earningsPageTitle')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('teacher.earningsPageSubtitle')}
          </p>
        </div>
        <button
          onClick={() => setWithdrawOpen(true)}
          disabled={!b || BigInt(b.availableUzs) === BigInt(0)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 flex items-center gap-2 text-sm font-medium disabled:opacity-50"
        >
          <Icon name="BanknotesIcon" size={16} />
          {t('teacher.earningsWithdraw')}
        </button>
      </div>

      {b && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <BalanceCard
            label={t('teacher.earningsAvailableBalance')}
            value={fmtUzs(b.availableUzs)}
            sub="UZS"
            highlight
            icon="WalletIcon"
          />
          <BalanceCard
            label={t('teacher.earningsGrossRevenue')}
            value={fmtUzs(b.grossRevenueUzs)}
            sub={`${b.completedPaymentCount} ${t('teacher.earningsPaymentCount')}`}
            icon="ArrowTrendingUpIcon"
          />
          <BalanceCard
            label={t('teacher.earningsWithdrawn')}
            value={fmtUzs(b.withdrawnUzs)}
            sub={`${t('teacher.earningsPendingLabel')}: ${fmtUzs(b.pendingWithdrawalUzs)}`}
            icon="BanknotesIcon"
          />
          <BalanceCard
            label={t('teacher.earningsPlatformFee')}
            value={`${b.platformFeePct}%`}
            sub={fmtUzs(b.platformFeeUzs) + ' UZS'}
            icon="ReceiptPercentIcon"
            warning
          />
        </div>
      )}

      {b && BigInt(b.refundedUzs) > BigInt(0) && (
        <div className="mb-4 p-3 bg-warning/10 text-warning rounded-md text-sm flex items-center gap-2">
          <Icon name="ExclamationTriangleIcon" size={14} />
          <span>
            <strong>{b.refundedPaymentCount}</strong> {t('teacher.earningsRefundWarning')} —{' '}
            {fmtUzs(b.refundedUzs)} UZS
          </span>
        </div>
      )}

      <div className="flex items-center gap-1 bg-muted/50 rounded-md p-1 mb-4 w-fit">
        {([
          { id: 'payments', labelKey: 'teacher.earningsTabPayments' },
          { id: 'withdrawals', labelKey: 'teacher.earningsTabWithdrawals' },
          { id: 'settings', labelKey: 'teacher.earningsTabSettings' },
        ] as const).map((tabItem) => (
          <button
            key={tabItem.id}
            onClick={() => setTab(tabItem.id)}
            className={`px-4 py-1.5 rounded text-sm font-medium ${
              tab === tabItem.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {t(tabItem.labelKey)}
          </button>
        ))}
      </div>

      {tab === 'payments' && (
        <div>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <button
              onClick={() => setPaymentStatus(undefined)}
              className={`px-3 py-1 rounded-full text-xs ${
                !paymentStatus
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {t('teacher.earningsFilterAll')}
            </button>
            {(['completed', 'refunded', 'failed', 'pending'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setPaymentStatus(s)}
                className={`px-3 py-1 rounded-full text-xs ${
                  paymentStatus === s
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {t(PAYMENT_STATUS_KEYS[s].labelKey)}
              </button>
            ))}
          </div>

          {payments.isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse h-16 bg-muted rounded-md" />
              ))}
            </div>
          ) : (payments.data?.payments.length ?? 0) === 0 ? (
            <p className="text-center text-muted-foreground py-12 italic">
              {t('teacher.earningsNoPaymentsFound')}
            </p>
          ) : (
            <div className="space-y-2">
              {payments.data?.payments.map((p) => (
                <div
                  key={p.id}
                  className="bg-card border border-border rounded-md p-3 flex items-center gap-3"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      PAYMENT_STATUS_KEYS[p.status].color
                    }`}
                  >
                    <Icon
                      name={
                        p.status === 'completed'
                          ? 'CheckIcon'
                          : p.status === 'refunded'
                          ? 'ArrowUturnLeftIcon'
                          : 'ClockIcon'
                      }
                      size={16}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-foreground truncate">
                        {p.studentName}
                      </p>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${
                          PAYMENT_STATUS_KEYS[p.status].color
                        }`}
                      >
                        {t(PAYMENT_STATUS_KEYS[p.status].labelKey)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {p.courseTitle} · {p.paymentMethod}
                    </p>
                    {p.refundReason && (
                      <p className="text-xs text-warning mt-1">
                        {t('teacher.earningsRefundReason')}: {p.refundReason}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`font-bold ${
                        p.status === 'completed'
                          ? 'text-success'
                          : p.status === 'refunded'
                          ? 'text-warning line-through'
                          : 'text-foreground'
                      }`}
                    >
                      {fmtUzs(p.amountUzs)} {p.currency}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(p.createdAt).toLocaleDateString('uz-UZ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'withdrawals' && (
        <div className="space-y-2">
          {withdrawals.isLoading ? (
            [1, 2].map((i) => (
              <div key={i} className="animate-pulse h-24 bg-muted rounded-md" />
            ))
          ) : (withdrawals.data?.withdrawals.length ?? 0) === 0 ? (
            <p className="text-center text-muted-foreground py-12 italic">
              {t('teacher.earningsNoWithdrawals')}
            </p>
          ) : (
            withdrawals.data?.withdrawals.map((w) => {
              const stat = WITHDRAWAL_STATUS_KEYS[w.status];
              return (
                <div
                  key={w.id}
                  className="bg-card border border-border rounded-md p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-lg font-bold text-foreground">
                        {fmtUzs(w.amountUzs)} UZS
                      </p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${stat.color}`}
                      >
                        <Icon name={stat.icon} size={10} />
                        {t(stat.labelKey)}
                      </span>
                    </div>
                    {w.status === 'pending' && (
                      <button
                        onClick={() => setPendingCancel(w)}
                        className="text-xs text-destructive hover:underline"
                      >
                        {t('teacher.earningsCancelRequest')}
                      </button>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p>
                      {w.method === 'bank_transfer'
                        ? `${w.bankName} · ${w.bankAccountNumber}`
                        : `Karta ${w.cardNumber}`}
                    </p>
                    <p>{t('teacher.earningsRecipient')}: {w.recipientName}</p>
                    {w.note && <p>{t('teacher.earningsNote')}: {w.note}</p>}
                    {w.adminNote && (
                      <p className="text-primary">{t('teacher.earningsAdminNote')}: {w.adminNote}</p>
                    )}
                    {w.rejectionReason && (
                      <p className="text-destructive">
                        {t('teacher.earningsRejectionReason')}: {w.rejectionReason}
                      </p>
                    )}
                    <p>
                      {t('teacher.earningsRequestDate')}:{' '}
                      {new Date(w.requestedAt).toLocaleString('uz-UZ')}
                      {w.completedAt &&
                        ` · ${t('teacher.earningsPaidDate')}: ${new Date(
                          w.completedAt,
                        ).toLocaleString('uz-UZ')}`}
                      {w.cancelledAt &&
                        ` · ${t('teacher.earningsCancelledDate')}: ${new Date(
                          w.cancelledAt,
                        ).toLocaleString('uz-UZ')}`}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === 'settings' && <PayoutSettingsPanel />}

      {withdrawOpen && b && (
        <WithdrawalModal
          available={b.availableUzs}
          onClose={() => setWithdrawOpen(false)}
        />
      )}

      {pendingCancel && (
        <ConfirmModal
          open={true}
          title={t('teacher.earningsCancelTitle')}
          message={`${fmtUzs(pendingCancel.amountUzs)} ${t('teacher.earningsCancelMessage')}`}
          confirmLabel={t('teacher.earningsCancelBtn')}
          variant="danger"
          isLoading={cancelMut.isPending}
          onConfirm={() => {
            cancelMut.mutate(pendingCancel.id, {
              onSuccess: () => {
                toast.success(t('teacher.earningsCancelled'));
                setPendingCancel(null);
              },
              onError: (err) => toast.error(err.message),
            });
          }}
          onCancel={() => !cancelMut.isPending && setPendingCancel(null)}
        />
      )}
    </div>
  );
}

function BalanceCard({
  label,
  value,
  sub,
  icon,
  highlight,
  warning,
}: {
  label: string;
  value: string;
  sub: string;
  icon: string;
  highlight?: boolean;
  warning?: boolean;
}) {
  return (
    <div
      className={`rounded-md p-4 border ${
        highlight
          ? 'bg-primary/5 border-primary/30'
          : warning
          ? 'bg-warning/5 border-warning/20'
          : 'bg-card border-border'
      }`}
    >
      <Icon
        name={icon}
        size={20}
        className={`mb-2 ${
          highlight ? 'text-primary' : warning ? 'text-warning' : 'text-muted-foreground'
        }`}
      />
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`text-xl font-bold ${
          highlight ? 'text-primary' : 'text-foreground'
        }`}
      >
        {value}
      </p>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
    </div>
  );
}

function WithdrawalModal({
  available,
  onClose,
}: {
  available: string;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [method, setMethod] = useState<WithdrawalMethodDTO>('bank_transfer');
  const [amount, setAmount] = useState('100000');
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [note, setNote] = useState('');
  const mut = useRequestWithdrawalMutation();
  const settings = usePayoutSettings();

  // Sozlamalardan to'ldirish
  const useSettings = () => {
    const s = settings.data?.settings;
    if (!s) return;
    if (s.payoutBankName) setBankName(s.payoutBankName);
    if (s.payoutAccountNumber) setBankAccount(s.payoutAccountNumber);
    if (s.payoutRecipientName) setRecipientName(s.payoutRecipientName);
    toast.info(t('teacher.withdrawModalFilledFromSettings'));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mut.mutate(
      {
        amountUzs: amount,
        method,
        bankName: bankName.trim() || undefined,
        bankAccountNumber: bankAccount.trim() || undefined,
        cardNumber: cardNumber.trim() || undefined,
        recipientName: recipientName.trim(),
        note: note.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success(t('teacher.withdrawModalSuccess'));
          onClose();
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={() => !mut.isPending && onClose()}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-card rounded-md shadow-warm-lg max-w-md w-full p-6 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-heading font-semibold flex items-center gap-2">
            <Icon name="BanknotesIcon" size={18} />
            {t('teacher.withdrawModalTitle')}
          </h3>
          <button type="button" onClick={onClose} className="p-1 hover:bg-muted rounded">
            <Icon name="XMarkIcon" size={20} />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          {t('teacher.withdrawModalAvailable')}:{' '}
          <strong className="text-primary">{fmtUzs(available)} UZS</strong>
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">{t('teacher.withdrawModalAmountLabel')}</label>
            <input
              type="number"
              min={100_000}
              max={Number(available)}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full px-3 py-2 border border-border rounded-md text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t('teacher.withdrawModalAmountMin')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('teacher.withdrawModalMethodLabel')}</label>
            <div className="grid grid-cols-2 gap-2">
              {(['bank_transfer', 'card'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`p-3 rounded-md border text-sm flex items-center justify-center gap-2 ${
                    method === m
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  <Icon
                    name={m === 'bank_transfer' ? 'BuildingLibraryIcon' : 'CreditCardIcon'}
                    size={14}
                  />
                  {m === 'bank_transfer' ? t('teacher.withdrawModalBank') : t('teacher.withdrawModalCard')}
                </button>
              ))}
            </div>
          </div>

          {method === 'bank_transfer' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">{t('teacher.withdrawModalBankName')}</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  required
                  placeholder="Hamkorbank"
                  className="w-full px-3 py-2 border border-border rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('teacher.withdrawModalAccountNumber')}</label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  required
                  placeholder="2020 8000 1234 5678"
                  className="w-full px-3 py-2 border border-border rounded-md text-sm font-mono"
                />
              </div>
            </>
          )}

          {method === 'card' && (
            <div>
              <label className="block text-sm font-medium mb-1">{t('teacher.withdrawModalCardNumber')}</label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                required
                placeholder="8600 1234 5678 9012"
                className="w-full px-3 py-2 border border-border rounded-md text-sm font-mono"
                maxLength={19}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">
              {t('teacher.withdrawModalRecipient')}
            </label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              required
              placeholder="Ali Valiyev"
              className="w-full px-3 py-2 border border-border rounded-md text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t('teacher.withdrawModalNote')}
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="May 2026 maoshi"
              className="w-full px-3 py-2 border border-border rounded-md text-sm"
            />
          </div>

          {settings.data?.settings.payoutBankName && (
            <button
              type="button"
              onClick={useSettings}
              className="text-xs text-primary hover:underline"
            >
              📋 {t('teacher.withdrawModalFillFromSettings')}
            </button>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={mut.isPending}
            className="px-4 py-2 text-foreground hover:bg-muted rounded-md text-sm disabled:opacity-50"
          >
            {t('teacher.withdrawModalCancel')}
          </button>
          <button
            type="submit"
            disabled={mut.isPending}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {mut.isPending && (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
            {t('teacher.withdrawModalSubmit')}
          </button>
        </div>
      </form>
    </div>
  );
}

function PayoutSettingsPanel() {
  const { t } = useI18n();
  const settings = usePayoutSettings();
  const mut = useUpdatePayoutSettingsMutation();

  const [bankName, setBankName] = useState('');
  const [account, setAccount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [editing, setEditing] = useState(false);

  if (settings.isLoading) return <div className="p-8">{t('teacher.payoutSettingsLoading')}</div>;

  const s = settings.data?.settings;

  const startEdit = () => {
    setBankName(s?.payoutBankName ?? '');
    setAccount(s?.payoutAccountNumber ?? '');
    setRecipient(s?.payoutRecipientName ?? '');
    setCardNumber('');
    setEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    mut.mutate(
      {
        payoutBankName: bankName.trim() || null,
        payoutAccountNumber: account.trim() || null,
        payoutRecipientName: recipient.trim() || null,
        ...(cardNumber.trim() && { payoutCardNumber: cardNumber.trim() }),
      },
      {
        onSuccess: () => {
          toast.success(t('teacher.payoutSettingsSaved'));
          setEditing(false);
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  if (!editing) {
    return (
      <div className="bg-card border border-border rounded-md p-6 max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">{t('teacher.payoutSettingsTitle')}</h3>
          <button
            onClick={startEdit}
            className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs"
          >
            <Icon name="PencilIcon" size={12} className="inline mr-1" />
            {t('teacher.payoutSettingsEdit')}
          </button>
        </div>
        <dl className="space-y-2 text-sm">
          <Row label={t('teacher.payoutSettingsBankName')} value={s?.payoutBankName} />
          <Row label={t('teacher.payoutSettingsAccountNumber')} value={s?.payoutAccountNumber} mono />
          <Row label={t('teacher.payoutSettingsRecipient')} value={s?.payoutRecipientName} />
          <Row label={t('teacher.payoutSettingsCard')} value={s?.payoutCardNumber} mono />
        </dl>
        <p className="text-xs text-muted-foreground mt-3">
          {t('teacher.payoutSettingsNote')}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="bg-card border border-border rounded-md p-6 max-w-2xl space-y-3">
      <h3 className="font-medium mb-3">{t('teacher.payoutSettingsUpdateTitle')}</h3>
      <div>
        <label className="block text-sm font-medium mb-1">{t('teacher.payoutSettingsBankName')}</label>
        <input
          type="text"
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
          placeholder="Hamkorbank"
          className="w-full px-3 py-2 border border-border rounded-md text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">{t('teacher.payoutSettingsAccountNumber')}</label>
        <input
          type="text"
          value={account}
          onChange={(e) => setAccount(e.target.value)}
          placeholder="2020 8000 1234 5678"
          className="w-full px-3 py-2 border border-border rounded-md text-sm font-mono"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">{t('teacher.payoutSettingsRecipient')}</label>
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="Ali Valiyev"
          className="w-full px-3 py-2 border border-border rounded-md text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">
          {t('teacher.payoutSettingsCardHint')}
        </label>
        <input
          type="text"
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
          placeholder="8600 1234 5678 9012"
          maxLength={19}
          className="w-full px-3 py-2 border border-border rounded-md text-sm font-mono"
        />
      </div>
      <div className="flex items-center gap-2 pt-3">
        <button
          type="submit"
          disabled={mut.isPending}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm disabled:opacity-50"
        >
          {t('teacher.payoutSettingsSave')}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          disabled={mut.isPending}
          className="px-4 py-2 text-foreground hover:bg-muted rounded-md text-sm"
        >
          {t('teacher.payoutSettingsCancel')}
        </button>
      </div>
    </form>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={`text-sm text-foreground ${mono ? 'font-mono' : ''} ${
          !value ? 'text-muted-foreground italic' : ''
        }`}
      >
        {value || '—'}
      </dd>
    </div>
  );
}
