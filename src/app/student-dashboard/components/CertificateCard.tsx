import Icon from '@/components/ui/AppIcon';

interface Certificate {
  id: string;
  courseTitle: string;
  completionDate: string;
  certificateNumber: string;
}

interface CertificateCardProps {
  certificate: Certificate;
  onDownload: () => void;
}

const CertificateCard = ({ certificate, onDownload }: CertificateCardProps) => {
  return (
    <div className="p-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-md border border-primary/20">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-heading font-semibold text-foreground mb-0.5 line-clamp-2">
            {certificate.courseTitle}
          </h4>
          <p className="text-xs text-muted-foreground">
            Tugallangan: {certificate.completionDate}
          </p>
        </div>
        <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-md flex-shrink-0 ml-2">
          <Icon name="AcademicCapIcon" size={20} className="text-primary-foreground" variant="solid" />
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <span className="text-xs font-data text-muted-foreground">
          #{certificate.certificateNumber}
        </span>
        <button
          onClick={onDownload}
          className="flex items-center space-x-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-smooth text-xs font-medium"
        >
          <Icon name="ArrowDownTrayIcon" size={14} />
          <span>Yuklab olish</span>
        </button>
      </div>
    </div>
  );
};

export default CertificateCard;