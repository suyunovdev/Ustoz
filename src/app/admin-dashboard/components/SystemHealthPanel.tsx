'use client';

import Icon from '@/components/ui/AppIcon';

interface SystemHealthPanelProps {
  systemHealth?: number;
  /** Future: expanded view (per-tab vs overview). Hozircha ishlatilmaydi. */
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

// TODO: replace with /api/admin/health real data (Phase 4)
const MOCK_METRICS: HealthMetrics = {
  serverStatus: 'online',
  databasePerformance: 95,
  apiResponseTime: 145,
  storageUsage: 68,
  activeConnections: 234,
  errorRate: 0.2,
};

const MOCK_ALERTS: Alert[] = [
  { id: '1', type: 'info', message: 'Tizim yangilanishi mavjud', time: '10 daqiqa oldin' },
  { id: '2', type: 'success', message: 'Backup muvaffaqiyatli yakunlandi', time: '2 soat oldin' },
];

const SystemHealthPanel = ({ systemHealth = 98 }: SystemHealthPanelProps) => {
  const healthMetrics = MOCK_METRICS;
  const alerts = MOCK_ALERTS;

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

  return (
    <div className="bg-card rounded-md shadow-warm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-heading font-semibold text-foreground">
          Tizim holati
        </h3>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-success rounded-full animate-pulse" />
          <span className="text-sm font-medium text-success">Online</span>
        </div>
      </div>

      {/* Overall Health */}
      <div className="mb-6 p-6 bg-gradient-to-r from-primary/10 to-success/10 rounded-md">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-muted-foreground">Umumiy holat</p>
          <Icon name="ServerIcon" size={24} className={getHealthColor(systemHealth)} />
        </div>
        <div className="flex items-end space-x-2">
          <h3 className={`text-4xl font-heading font-bold ${getHealthColor(systemHealth)}`}>
            {systemHealth}%
          </h3>
          <p className="text-sm text-muted-foreground mb-1">Sog'lom</p>
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
            <p className="text-sm text-muted-foreground">Ma'lumotlar bazasi</p>
          </div>
          <p className="text-2xl font-heading font-bold text-foreground">{healthMetrics.databasePerformance}%</p>
        </div>

        <div className="p-4 border border-border rounded-md">
          <div className="flex items-center space-x-2 mb-2">
            <Icon name="BoltIcon" size={18} className="text-warning" />
            <p className="text-sm text-muted-foreground">API javob vaqti</p>
          </div>
          <p className="text-2xl font-heading font-bold text-foreground">{healthMetrics.apiResponseTime}ms</p>
        </div>

        <div className="p-4 border border-border rounded-md">
          <div className="flex items-center space-x-2 mb-2">
            <Icon name="ServerStackIcon" size={18} className="text-secondary" />
            <p className="text-sm text-muted-foreground">Xotira</p>
          </div>
          <p className="text-2xl font-heading font-bold text-foreground">{healthMetrics.storageUsage}%</p>
        </div>

        <div className="p-4 border border-border rounded-md">
          <div className="flex items-center space-x-2 mb-2">
            <Icon name="UsersIcon" size={18} className="text-success" />
            <p className="text-sm text-muted-foreground">Ulanishlar</p>
          </div>
          <p className="text-2xl font-heading font-bold text-foreground">{healthMetrics.activeConnections}</p>
        </div>
      </div>

      {/* Alerts */}
      <div>
        <h4 className="text-sm font-heading font-semibold text-foreground mb-3">Xabarnomalar</h4>
        <div className="space-y-2">
          {alerts.length === 0 ? (
            <div className="text-center py-6">
              <Icon name="CheckCircleIcon" size={32} className="text-success mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Xabarnomalar yo'q</p>
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