'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';

interface WatermarkConfig {
  enabled: boolean;
  text: string;
  opacity: number;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
}

interface WatermarkSettingsProps {
  config: WatermarkConfig;
  onConfigUpdate: (config: WatermarkConfig) => void;
}

const WatermarkSettings = ({ config, onConfigUpdate }: WatermarkSettingsProps) => {
  const { t } = useI18n();
  const [localConfig, setLocalConfig] = useState<WatermarkConfig>(config);

  const handleChange = (field: keyof WatermarkConfig, value: any) => {
    const updatedConfig = { ...localConfig, [field]: value };
    setLocalConfig(updatedConfig);
    onConfigUpdate(updatedConfig);
  };

  const positions = [
    { value: 'top-left', label: t('content.topLeft'), icon: 'ArrowUpLeftIcon' },
    { value: 'top-right', label: t('content.topRight'), icon: 'ArrowUpRightIcon' },
    { value: 'center', label: t('content.center'), icon: 'Square2StackIcon' },
    { value: 'bottom-left', label: t('content.bottomLeft'), icon: 'ArrowDownLeftIcon' },
    { value: 'bottom-right', label: t('content.bottomRight'), icon: 'ArrowDownRightIcon' }
  ];

  return (
    <div className="space-y-6">
      {/* Watermark Settings */}
      <div className="bg-card rounded-md shadow-warm p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-heading font-semibold text-foreground">{t('content.watermarkSettings')}</h3>
            <p className="caption text-muted-foreground mt-1">{t('content.watermarkSettingsDesc')}</p>
          </div>
          <button
            onClick={() => handleChange('enabled', !localConfig.enabled)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-smooth ${
              localConfig.enabled
                ? 'bg-success text-success-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            <Icon name={localConfig.enabled ? 'ShieldCheckIcon' : 'ShieldExclamationIcon'} size={20} />
            <span className="font-medium">{localConfig.enabled ? t('content.enabled') : t('content.disabled')}</span>
          </button>
        </div>

        {/* Watermark Text */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">{t('content.watermarkText')}</label>
          <input
            type="text"
            value={localConfig.text}
            onChange={(e) => handleChange('text', e.target.value)}
            placeholder={t('content.watermarkTextPlaceholder')}
            disabled={!localConfig.enabled}
            className="w-full px-4 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="caption text-muted-foreground mt-2">{t('content.watermarkTextHint')}</p>
        </div>

        {/* Opacity Control */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-foreground">{t('content.opacity')}</label>
            <span className="font-data text-sm text-muted-foreground">{localConfig.opacity}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            step="10"
            value={localConfig.opacity}
            onChange={(e) => handleChange('opacity', parseInt(e.target.value))}
            disabled={!localConfig.enabled}
            className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: localConfig.enabled
                ? `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${localConfig.opacity}%, var(--color-muted) ${localConfig.opacity}%, var(--color-muted) 100%)`
                : undefined
            }}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="caption text-muted-foreground">{t('content.transparent')}</span>
            <span className="caption text-muted-foreground">{t('content.fullyVisible')}</span>
          </div>
        </div>

        {/* Position Selection */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">{t('content.position')}</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {positions.map((position) => {
              const isSelected = localConfig.position === position.value;
              return (
                <button
                  key={position.value}
                  onClick={() => handleChange('position', position.value)}
                  disabled={!localConfig.enabled}
                  className={`flex items-center space-x-2 p-4 rounded-md border-2 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed ${
                    isSelected
                      ? 'border-primary bg-primary/10' :'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <Icon name={position.icon as any} size={20} className={isSelected ? 'text-primary' : 'text-muted-foreground'} />
                  <span className={`font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                    {position.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-card rounded-md shadow-warm p-6 space-y-4">
        <h3 className="text-lg font-heading font-semibold text-foreground">{t('content.preview')}</h3>
        <div className="relative aspect-video bg-muted rounded-md overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon name="VideoCameraIcon" size={64} className="text-muted-foreground" />
          </div>
          {localConfig.enabled && (
            <div
              className={`absolute ${
                localConfig.position === 'top-left' ? 'top-4 left-4' :
                localConfig.position === 'top-right' ? 'top-4 right-4' :
                localConfig.position === 'bottom-left' ? 'bottom-4 left-4' :
                localConfig.position === 'bottom-right'? 'bottom-4 right-4' : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
              }`}
              style={{ opacity: localConfig.opacity / 100 }}
            >
              <div className="px-4 py-2 bg-card/90 text-foreground rounded-md font-medium shadow-lg">
                {localConfig.text || t('content.watermarkTextDefault')}
              </div>
            </div>
          )}
        </div>
        <p className="caption text-muted-foreground text-center">{t('content.watermarkPreviewHint')}</p>
      </div>

      {/* Info */}
      <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-md">
        <Icon name="InformationCircleIcon" size={24} className="text-muted-foreground mt-0.5" />
        <div>
          <p className="font-medium text-foreground">{t('content.watermarkAbout')}</p>
          <p className="caption text-muted-foreground mt-1">{t('content.watermarkAboutDesc')}</p>
        </div>
      </div>
    </div>
  );
};

export default WatermarkSettings;