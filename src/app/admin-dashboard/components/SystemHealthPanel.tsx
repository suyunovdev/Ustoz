'use client';

import { useState, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';

interface SystemHealthPanelProps {
  systemHealth?: number;
  expanded?: boolean;
}

interface HealthMetrics {
  serverStatus: 'online' | 'offline' | 'degraded';
  databasePerformance: number;
  apiResponseTime: number;
  storageUsage: number;
  activeConnections: number;
  errorRate: number;
}

interface Alert {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  time: string;
}

const SystemHealthPanel = ({ systemHealth: initialHealth = 98 }: SystemHealthPanelProps) => {
  const { t } = useI18n();
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics>({
    serverStatus: 'online',
    databasePerformance: 0,
    apiResponseTime: 0,
    storageUsage: 0,
    activeConnections: 0,
    errorRate: 0,
  });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [systemHealth, setSystemHealth] = useState(initialHealth);
  const [loading, setLoading] = useState(true);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/health', { credentials: 'include' });
      const data = await res.json();

      const dbOk = data.database?.status === 'ok';
      const configOk = data.config?.status === 'ok';
      const latency = data.latency_ms || 0;

      const uptimeHours = Math.round((data.uptime || 0) / 3600);

      setHealthMetrics({
        serverStatus: data.status === 'ok' ? 'online' : 'degraded',
        databasePerformance: dbOk ? Math.max(80, 100 - latency / 10) : 0,
        apiResponseTime: latency,
        storageUsage: data.database?.storage_usage_percent ?? 0,
        activeConnections: uptimeHours,
        errorRate: data.status === 'ok' ? 0 : 1,
      });

      const newAlerts: Alert[] = [];
      if (dbOk) {
        newAlerts.push({ id: 'db', type: 'success', message: t('admin.dbWorking'), time: `${latency}ms` });
      } else {
        newAlerts.push({ id: 'db', type: 'error', message: t('admin.dbProblem'), time: t('admin.now') });
      }
      if (!configOk) {
        newAlerts.push({ id: 'cfg', type: 'warning', message: `${t('admin.envVarsMissing')}: ${data.config?.missing?.join(', ')}`, time: t('admin.now') });
      }

      setAlerts(newAlerts);
      setSystemHealth(data.status === 'ok' ? (dbOk ? Math.round(Math.max(80, 100 - latency / 5)) : 50) : 30);
    } catch {
      setHealthMetrics((prev) => ({ ...prev, serverStatus: 'offline' }));
      setAlerts([{ id: 'err', type: 'error', message: t('admin.healthEndpointFailed'), time: t('admin.now') }]);
      setSystemHealth(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const getHealthColor = (value: number) => {
    if (value >= 95) return 'text-success';
    if (value >= 80) return 'text-warning';
    return 'text-destructive';
  };

  const getAlertIcon = (type: string) => {
    const icons = {
      info: 'InformationCircleIcon',
      success: 'CheckCircleIcon',
      warning: 'ExclamationTriangleIcon',
      error: 'XCircleIcon'
    };
    return icons[type as keyof typeof icons] || 'InformationCircleIcon';
  };

  const getAlertColor = (type: string) => {
    const colors = {
      info: 'text-secondary',
      success: 'text-success',
      warning: 'text-warning',
      error: 'text-destructive'
    };
    return colors[type as keyof typeof colors] || 'text-muted-foreground';
  };

  if (loading) {
    return (
      <div className="bg-card rounded-md shadow-warm p-6 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-6" />
        <div className="h-32 bg-muted rounded mb-6" />
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-muted rounded-md" />
          ))}
        </div>
        <div className="h-24 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-md shadow-warm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-heading font-semibold text-foreground">
          {t('admin.systemStatus')}
        </h3>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-success rounded-full animate-pulse" />
          <span className="text-sm font-medium text-success">{t('admin.online')}</span>
        </div>
      </div>

      {/* Overall Health */}
      <div className="mb-6 p-6 bg-gradient-to-r from-primary/10 to-success/10 rounded-md">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-muted-foreground">{t('admin.overallHealth')}</p>
          <Icon name="ServerIcon" size={24} className={getHealthColor(systemHealth)} />
        </div>
        <div className="flex items-end space-x-2">
          <h3 className={`text-4xl font-heading font-bold ${getHealthColor(systemHealth)}`}>
            {systemHealth}%
          </h3>
          <p className="text-sm text-muted-foreground mb-1">{t('admin.healthy')}</p>
        </div>
        <div className="mt-3 w-full bg-muted rounded-full h-2">
          <div
            className="bg-success h-2 rounded-full transition-all duration-500"
            style={{ width: `${systemHealth}%` }}
          />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 border border-border rounded-md">
          <div className="flex items-center space-x-2 mb-2">
            <Icon name="CircleStackIcon" size={18} className="text-primary" />
            <p className="text-sm text-muted-foreground">{t('admin.database')}</p>
          </div>
          <p className="text-2xl font-heading font-bold text-foreground">{healthMetrics.databasePerformance}%</p>
        </div>

        <div className="p-4 border border-border rounded-md">
          <div className="flex items-center space-x-2 mb-2">
            <Icon name="BoltIcon" size={18} className="text-warning" />
            <p className="text-sm text-muted-foreground">{t('admin.apiResponseTime')}</p>
          </div>
          <p className="text-2xl font-heading font-bold text-foreground">{healthMetrics.apiResponseTime}ms</p>
        </div>

        <div className="p-4 border border-border rounded-md">
          <div className="flex items-center space-x-2 mb-2">
            <Icon name="ServerStackIcon" size={18} className="text-secondary" />
            <p className="text-sm text-muted-foreground">{t('admin.storage')}</p>
          </div>
          <p className="text-2xl font-heading font-bold text-foreground">{healthMetrics.storageUsage}%</p>
        </div>

        <div className="p-4 border border-border rounded-md">
          <div className="flex items-center space-x-2 mb-2">
            <Icon name="UsersIcon" size={18} className="text-success" />
            <p className="text-sm text-muted-foreground">{t('admin.uptimeHours')}</p>
          </div>
          <p className="text-2xl font-heading font-bold text-foreground">{healthMetrics.activeConnections} {t('admin.uptimeHours')}</p>
        </div>
      </div>

      {/* Alerts */}
      <div>
        <h4 className="text-sm font-heading font-semibold text-foreground mb-3">{t('admin.alerts')}</h4>
        <div className="space-y-2">
          {alerts.length === 0 ? (
            <div className="text-center py-6">
              <Icon name="CheckCircleIcon" size={32} className="text-success mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{t('admin.noAlerts')}</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start space-x-3 p-3 border border-border rounded-md hover:bg-muted transition-smooth"
              >
                <Icon name={getAlertIcon(alert.type) as any} size={20} className={getAlertColor(alert.type)} />
                <div className="flex-1">
                  <p className="text-sm text-foreground">{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemHealthPanel;