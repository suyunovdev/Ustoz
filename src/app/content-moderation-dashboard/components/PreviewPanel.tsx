'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Icon from '@/components/ui/AppIcon';

interface ContentItem {
  id: string;
  type: 'material' | 'link' | 'test';
  title: string;
  contentType?: string;
  url?: string;
  fileSize?: number;
}

interface PreviewPanelProps {
  item: ContentItem;
}

const PreviewPanel = ({ item }: PreviewPanelProps) => {
  const [testQuestions, setTestQuestions] = useState<any[]>([]);
  const [linkDetails, setLinkDetails] = useState<any>(null);
  const [materialDetails, setMaterialDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadItemDetails();
  }, [item.id]);

  const loadItemDetails = async () => {
    setIsLoading(true);
    try {
      if (item.type === 'test') {
        const { data } = await supabase
          .from('test_questions')
          .select('*')
          .eq('test_id', item.id)
          .order('question_order');
        setTestQuestions(data || []);
      } else if (item.type === 'link') {
        const { data } = await supabase
          .from('external_links')
          .select('*')
          .eq('id', item.id)
          .single();
        setLinkDetails(data);
      } else if (item.type === 'material') {
        const { data } = await supabase
          .from('content_materials')
          .select('*')
          .eq('id', item.id)
          .single();
        setMaterialDetails(data);
      }
    } catch (error) {
      console.error('Error loading item details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-md shadow-warm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-3/4" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-md shadow-warm p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-heading font-semibold text-foreground">Ko'rib chiqish</h3>
        <span className="caption px-3 py-1 bg-muted text-muted-foreground rounded-md uppercase">
          {item.type === 'material' ? 'Material' : item.type === 'link' ? 'Havola' : 'Test'}
        </span>
      </div>

      {/* Material Preview */}
      {item.type === 'material' && materialDetails && (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-foreground mb-2">{materialDetails.title}</h4>
            {materialDetails.description && (
              <p className="text-muted-foreground">{materialDetails.description}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted/50 rounded-md">
              <p className="caption text-muted-foreground mb-1">Fayl turi</p>
              <p className="font-medium text-foreground uppercase">{materialDetails.content_type}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-md">
              <p className="caption text-muted-foreground mb-1">Fayl hajmi</p>
              <p className="font-medium text-foreground">{formatFileSize(materialDetails.file_size)}</p>
            </div>
          </div>
          {materialDetails.watermark_enabled && (
            <div className="flex items-center space-x-3 p-4 bg-success/10 rounded-md">
              <Icon name="ShieldCheckIcon" size={24} className="text-success" />
              <div>
                <p className="font-medium text-success">Watermark himoyasi yoqilgan</p>
                <p className="caption text-muted-foreground">Matn: {materialDetails.watermark_text}</p>
              </div>
            </div>
          )}
          {materialDetails.file_url && (
            <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
              {materialDetails.content_type === 'video' ? (
                <video controls className="w-full h-full rounded-md">
                  <source src={materialDetails.file_url} />
                </video>
              ) : materialDetails.content_type === 'audio' ? (
                <audio controls className="w-full">
                  <source src={materialDetails.file_url} />
                </audio>
              ) : (
                <a
                  href={materialDetails.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth"
                >
                  <Icon name="DocumentTextIcon" size={20} />
                  <span className="font-medium">Hujjatni ochish</span>
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* Link Preview */}
      {item.type === 'link' && linkDetails && (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-foreground mb-2">{linkDetails.title}</h4>
            {linkDetails.description && (
              <p className="text-muted-foreground">{linkDetails.description}</p>
            )}
          </div>
          <div className="p-4 bg-muted/50 rounded-md">
            <p className="caption text-muted-foreground mb-2">Havola</p>
            <a
              href={linkDetails.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-primary hover:underline"
            >
              <span className="break-all">{linkDetails.url}</span>
              <Icon name="ArrowTopRightOnSquareIcon" size={16} />
            </a>
          </div>
          <div className="p-4 bg-muted/50 rounded-md">
            <p className="caption text-muted-foreground mb-1">Havola turi</p>
            <p className="font-medium text-foreground uppercase">{linkDetails.link_type}</p>
          </div>
        </div>
      )}

      {/* Test Preview */}
      {item.type === 'test' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-md">
            <div>
              <p className="caption text-muted-foreground">Jami savollar</p>
              <p className="text-2xl font-heading font-bold text-foreground">{testQuestions.length}</p>
            </div>
            <Icon name="AcademicCapIcon" size={40} className="text-primary" />
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {testQuestions.map((q, index) => (
              <div key={q.id} className="p-4 bg-muted/50 rounded-md space-y-3">
                <div className="flex items-start space-x-2">
                  <span className="font-data text-sm text-muted-foreground mt-1">{index + 1}.</span>
                  <p className="font-medium text-foreground flex-1">{q.question_text}</p>
                </div>
                <div className="space-y-2 ml-6">
                  {[q.option_a, q.option_b, q.option_c, q.option_d].map((option, optIndex) => (
                    <div
                      key={optIndex}
                      className={`flex items-center space-x-2 p-2 rounded-md ${
                        q.correct_answer === optIndex
                          ? 'bg-success/10 border border-success' :'bg-background'
                      }`}
                    >
                      {q.correct_answer === optIndex && (
                        <Icon name="CheckCircleIcon" size={16} className="text-success" />
                      )}
                      <span className="text-sm text-foreground">{option}</span>
                    </div>
                  ))}
                </div>
                {q.explanation && (
                  <div className="ml-6 p-3 bg-primary/5 rounded-md">
                    <p className="caption text-muted-foreground mb-1">Tushuntirish:</p>
                    <p className="text-sm text-foreground">{q.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PreviewPanel;