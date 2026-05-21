'use client';

import Icon from '@/components/ui/AppIcon';

interface TestQuestion {
  id: string;
  order: number;
  type: string;
  question: string;
  points: number;
}

interface TestConfig {
  title: string;
  description: string;
  passingScore: number;
  timeLimit: number;
  retakePolicy: 'unlimited' | 'limited' | 'once';
  maxRetakes: number;
  randomizeQuestions: boolean;
  showResults: boolean;
}

interface PublishingPanelProps {
  config: TestConfig;
  questions: TestQuestion[];
  onConfigUpdate: (config: TestConfig) => void;
  onPublish: () => void;
}

const PublishingPanel = ({ config, questions, onConfigUpdate, onPublish }: PublishingPanelProps) => {
  const handleChange = (field: keyof TestConfig, value: any) => {
    onConfigUpdate({ ...config, [field]: value });
  };

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
  const isValid = config.title && config.description && questions.length >= 5;

  return (
    <div className="space-y-6">
      {/* Test Information */}
      <div className="bg-card rounded-md shadow-warm p-6 space-y-6">
        <h3 className="text-xl font-heading font-semibold text-foreground">Test ma'lumotlari</h3>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Test nomi *
          </label>
          <input
            type="text"
            value={config.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Masalan: Dasturlash asoslari - Yakuniy test"
            className="w-full px-4 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Tavsif *
          </label>
          <textarea
            value={config.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Test haqida qisqacha ma'lumot..."
            rows={3}
            className="w-full px-4 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            required
          />
        </div>
      </div>

      {/* Test Settings */}
      <div className="bg-card rounded-md shadow-warm p-6 space-y-6">
        <h3 className="text-xl font-heading font-semibold text-foreground">Test sozlamalari</h3>

        {/* Passing Score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-foreground">
              O'tish bali (%) *
            </label>
            <span className="font-data text-sm text-primary">{config.passingScore}%</span>
          </div>
          <input
            type="range"
            min="50"
            max="100"
            step="5"
            value={config.passingScore}
            onChange={(e) => handleChange('passingScore', parseInt(e.target.value))}
            className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${config.passingScore}%, var(--color-muted) ${config.passingScore}%, var(--color-muted) 100%)`
            }}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="caption text-muted-foreground">50%</span>
            <span className="caption text-muted-foreground">100%</span>
          </div>
        </div>

        {/* Time Limit */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Vaqt limiti (daqiqa) *
          </label>
          <input
            type="number"
            min="5"
            max="180"
            value={config.timeLimit}
            onChange={(e) => handleChange('timeLimit', parseInt(e.target.value) || 60)}
            className="w-full px-4 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
          <p className="caption text-muted-foreground mt-2">
            Talabalar testni {config.timeLimit} daqiqada tugatishi kerak
          </p>
        </div>

        {/* Retake Policy */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            Qayta topshirish siyosati *
          </label>
          <div className="space-y-2">
            {[
              { value: 'unlimited', label: 'Cheksiz', description: 'Talabalar istalgan vaqtda qayta topshirishi mumkin' },
              { value: 'limited', label: 'Cheklangan', description: 'Belgilangan sondagina qayta topshirish' },
              { value: 'once', label: 'Bir marta', description: 'Faqat bir marta topshirish imkoniyati' }
            ].map((policy) => {
              const isSelected = config.retakePolicy === policy.value;
              return (
                <button
                  key={policy.value}
                  onClick={() => handleChange('retakePolicy', policy.value)}
                  className={`w-full text-left p-4 rounded-md border-2 transition-smooth ${
                    isSelected
                      ? 'border-primary bg-primary/10' :'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-primary' : 'border-border'
                    }`}>
                      {isSelected && <div className="w-3 h-3 rounded-full bg-primary" />}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                        {policy.label}
                      </p>
                      <p className="caption text-muted-foreground">{policy.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Max Retakes (if limited) */}
        {config.retakePolicy === 'limited' && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Maksimal qayta topshirish soni *
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={config.maxRetakes}
              onChange={(e) => handleChange('maxRetakes', parseInt(e.target.value) || 3)}
              className="w-full px-4 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        )}

        {/* Additional Options */}
        <div className="space-y-3">
          <label className="flex items-center space-x-3 p-4 bg-muted/50 rounded-md cursor-pointer hover:bg-muted transition-smooth">
            <input
              type="checkbox"
              checked={config.randomizeQuestions}
              onChange={(e) => handleChange('randomizeQuestions', e.target.checked)}
              className="w-5 h-5 text-primary focus:ring-2 focus:ring-ring rounded"
            />
            <div className="flex-1">
              <p className="font-medium text-foreground">Savollarni aralashtirish</p>
              <p className="caption text-muted-foreground">Har bir talaba uchun savollar tartibini o'zgartirish</p>
            </div>
          </label>

          <label className="flex items-center space-x-3 p-4 bg-muted/50 rounded-md cursor-pointer hover:bg-muted transition-smooth">
            <input
              type="checkbox"
              checked={config.showResults}
              onChange={(e) => handleChange('showResults', e.target.checked)}
              className="w-5 h-5 text-primary focus:ring-2 focus:ring-ring rounded"
            />
            <div className="flex-1">
              <p className="font-medium text-foreground">Natijalarni ko'rsatish</p>
              <p className="caption text-muted-foreground">Test tugagandan so'ng natijalarni darhol ko'rsatish</p>
            </div>
          </label>
        </div>
      </div>

      {/* Validation Checklist */}
      <div className="bg-card rounded-md shadow-warm p-6 space-y-4">
        <h3 className="text-lg font-heading font-semibold text-foreground">Nashr qilish tekshiruvi</h3>
        <div className="space-y-2">
          {[
            { label: 'Test nomi kiritilgan', checked: !!config.title },
            { label: 'Tavsif kiritilgan', checked: !!config.description },
            { label: 'Kamida 5 ta savol mavjud', checked: questions.length >= 5 },
            { label: 'Barcha savollar to\'ldirilgan', checked: questions.every(q => q.question) },
            { label: 'O\'tish bali belgilangan', checked: config.passingScore >= 50 }
          ].map((item, index) => (
            <div key={index} className="flex items-center space-x-3">
              <Icon
                name={item.checked ? 'CheckCircleIcon' : 'XCircleIcon'}
                size={20}
                className={item.checked ? 'text-success' : 'text-muted-foreground'}
              />
              <span className={`caption ${item.checked ? 'text-foreground' : 'text-muted-foreground'}`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Test Summary */}
      <div className="bg-card rounded-md shadow-warm p-6 space-y-4">
        <h3 className="text-lg font-heading font-semibold text-foreground">Test xulosasi</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-muted/50 rounded-md">
            <p className="caption text-muted-foreground mb-1">Jami savollar</p>
            <p className="text-2xl font-data font-bold text-foreground">{questions.length}</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-md">
            <p className="caption text-muted-foreground mb-1">Jami ball</p>
            <p className="text-2xl font-data font-bold text-primary">{totalPoints}</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-md">
            <p className="caption text-muted-foreground mb-1">O'tish bali</p>
            <p className="text-2xl font-data font-bold text-success">{Math.round(totalPoints * config.passingScore / 100)}</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-md">
            <p className="caption text-muted-foreground mb-1">Vaqt limiti</p>
            <p className="text-2xl font-data font-bold text-foreground">{config.timeLimit} daq</p>
          </div>
        </div>
      </div>

      {/* Publish Button */}
      <button
        onClick={onPublish}
        disabled={!isValid}
        className={`w-full flex items-center justify-center space-x-2 px-6 py-4 rounded-md transition-smooth font-medium text-lg ${
          isValid
            ? 'bg-primary text-primary-foreground hover:opacity-90 shadow-warm'
            : 'bg-muted text-muted-foreground cursor-not-allowed'
        }`}
      >
        <Icon name="PaperAirplaneIcon" size={24} />
        <span>Testni nashr qilish</span>
      </button>

      {!isValid && (
        <p className="text-center caption text-destructive">
          Testni nashr qilish uchun barcha majburiy maydonlarni to'ldiring va kamida 5 ta savol qo'shing
        </p>
      )}
    </div>
  );
};

export default PublishingPanel;