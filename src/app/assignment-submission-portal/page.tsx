'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RoleBasedHeader from '@/components/common/RoleBasedHeader';
import Icon from '@/components/ui/AppIcon';

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  fileRequirements: string;
  courseId: string;
  courseTitle: string;
  teacherName: string;
  createdAt: string;
}

interface Submission {
  id: string;
  assignmentId: string;
  submissionText: string;
  submissionUrl: string | null;
  submittedAt: string;
  grade: number | null;
  feedback: string | null;
  gradedAt: string | null;
}

const AssignmentSubmissionPortalInteractive = () => {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Form state
  const [submissionText, setSubmissionText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    setIsHydrated(true);
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });

      if (!res.ok) {
        router.push('/login');
        return;
      }

      const { user } = await res.json();
      if (!user) {
        router.push('/login');
        return;
      }

      setUserId(user.id);
      await Promise.all([loadAssignments(user.id), loadSubmissions(user.id)]);
    } catch (err: unknown) {
      console.error('Auth check error:', err);
      setError(err instanceof Error ? err.message : 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async (_studentId: string) => {
    try {
      const res = await fetch('/api/assignments/my', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      setAssignments(data.assignments || []);
      setSubmissions(data.submissions || []);
    } catch (err) {
      console.error('Error loading assignments:', err);
    }
  };

  const loadSubmissions = async (_studentId: string) => {
    // Submissions are loaded together with assignments in loadAssignments
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError('Fayl hajmi 50MB dan oshmasligi kerak');
      return;
    }

    setSelectedFile(file);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !selectedAssignment) return;

    // TODO: add POST /api/assignments/[id]/submit endpoint (with file upload support).
    alert("Tez orada qo'shiladi");

    // Reset form
    setSubmissionText('');
    setSelectedFile(null);
    setSelectedAssignment(null);
  };

  const getSubmissionForAssignment = (assignmentId: string): Submission | undefined => {
    return submissions.find((s) => s.assignmentId === assignmentId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysRemaining = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = due.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const isOverdue = (dueDate: string) => {
    return getDaysRemaining(dueDate) < 0;
  };

  const isUrgent = (dueDate: string) => {
    const days = getDaysRemaining(dueDate);
    return days >= 0 && days <= 3;
  };

  if (!isHydrated) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <RoleBasedHeader userRole="student" currentPath="/assignment-submission-portal" />
        <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <RoleBasedHeader userRole="student" currentPath="/assignment-submission-portal" />
      
      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
              Topshiriqlar portali
            </h1>
            <p className="text-muted-foreground">
              Topshiriqlarni ko'ring, bajarish va topshiring
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-md">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          {/* Submission Form Modal */}
          {selectedAssignment && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-card rounded-md shadow-warm max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
                        {selectedAssignment.title}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {selectedAssignment.courseTitle} • {selectedAssignment.teacherName}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedAssignment(null);
                        setSubmissionText('');
                        setSelectedFile(null);
                        setError(null);
                      }}
                      className="p-2 hover:bg-muted rounded-md transition-smooth"
                    >
                      <Icon name="XMarkIcon" size={24} />
                    </button>
                  </div>

                  <div className="mb-6">
                    <p className="text-foreground mb-4">{selectedAssignment.description}</p>
                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-md">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Muddat</p>
                        <p className="text-sm font-medium text-foreground">
                          {formatDate(selectedAssignment.dueDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Maksimal ball</p>
                        <p className="text-sm font-medium text-foreground">{selectedAssignment.maxScore}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground mb-1">Fayl talablari</p>
                        <p className="text-sm font-medium text-foreground">
                          {selectedAssignment.fileRequirements}
                        </p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Topshiriq matni
                      </label>
                      <textarea
                        value={submissionText}
                        onChange={(e) => setSubmissionText(e.target.value)}
                        className="w-full px-4 py-3 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        rows={6}
                        placeholder="Topshiriq haqida yozing, havolalar qo'shing..."
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Fayl yuklash (ixtiyoriy)
                      </label>
                      <div className="border-2 border-dashed border-border rounded-md p-6 text-center">
                        <input
                          type="file"
                          onChange={handleFileSelect}
                          className="hidden"
                          id="file-upload"
                          accept=".pdf,.doc,.docx,.zip,.jpg,.jpeg,.png,.gif,.txt"
                        />
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <Icon name="CloudArrowUpIcon" size={48} className="mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-foreground mb-1">
                            Faylni tanlash uchun bosing
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PDF, DOCX, ZIP, rasm (max 50MB)
                          </p>
                        </label>
                        {selectedFile && (
                          <div className="mt-4 flex items-center justify-center space-x-2">
                            <Icon name="PaperClipIcon" size={16} className="text-primary" />
                            <span className="text-sm text-foreground">{selectedFile.name}</span>
                            <button
                              type="button"
                              onClick={() => setSelectedFile(null)}
                              className="text-destructive hover:underline text-sm"
                            >
                              O'chirish
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}

                    <div className="flex items-center space-x-4">
                      <button
                        type="submit"
                        disabled={uploading}
                        className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-smooth disabled:opacity-50"
                      >
                        {uploading ? 'Yuklanmoqda...' : 'Topshiriq topshirish'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAssignment(null);
                          setSubmissionText('');
                          setSelectedFile(null);
                        }}
                        className="px-6 py-3 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-smooth"
                      >
                        Bekor qilish
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Assignments List */}
          {assignments.length === 0 ? (
            <div className="bg-card rounded-md shadow-warm p-12 text-center">
              <Icon name="DocumentTextIcon" size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-heading font-semibold text-foreground mb-2">
                Topshiriqlar yo'q
              </h3>
              <p className="text-muted-foreground">
                Hozircha sizga topshiriq berilmagan. Kurslarga yoziling va topshiriqlarni kuting.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => {
                const submission = getSubmissionForAssignment(assignment.id);
                const daysRemaining = getDaysRemaining(assignment.dueDate);
                const overdue = isOverdue(assignment.dueDate);
                const urgent = isUrgent(assignment.dueDate);

                return (
                  <div
                    key={assignment.id}
                    className={`bg-card rounded-md shadow-warm p-6 border-l-4 ${
                      submission?.grade !== null
                        ? 'border-success'
                        : overdue
                        ? 'border-destructive'
                        : urgent
                        ? 'border-warning' :'border-primary'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-heading font-semibold text-foreground mb-2">
                          {assignment.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {assignment.courseTitle} • {assignment.teacherName}
                        </p>
                        <p className="text-foreground mb-4">{assignment.description}</p>
                      </div>
                      <div className="text-right">
                        {submission?.grade !== null ? (
                          <div>
                            <p className="text-2xl font-bold text-success">
                              {submission?.grade}/{assignment.maxScore}
                            </p>
                            <p className="text-xs text-muted-foreground">Baholandi</p>
                          </div>
                        ) : submission ? (
                          <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-medium">
                            Topshirildi
                          </span>
                        ) : overdue ? (
                          <span className="px-3 py-1 bg-destructive/10 text-destructive rounded-full text-xs font-medium">
                            Muddati o'tgan
                          </span>
                        ) : urgent ? (
                          <span className="px-3 py-1 bg-warning/10 text-warning rounded-full text-xs font-medium">
                            {daysRemaining} kun qoldi
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                            {daysRemaining} kun qoldi
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Muddat</p>
                        <p className="text-sm font-medium text-foreground">
                          {formatDate(assignment.dueDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Maksimal ball</p>
                        <p className="text-sm font-medium text-foreground">{assignment.maxScore}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Fayl talablari</p>
                        <p className="text-sm font-medium text-foreground">{assignment.fileRequirements}</p>
                      </div>
                    </div>

                    {submission && (
                      <div className="mb-4 p-4 bg-muted rounded-md">
                        <p className="text-sm font-medium text-foreground mb-2">Sizning topshiriqingiz:</p>
                        <p className="text-sm text-foreground mb-2">{submission.submissionText}</p>
                        {submission.submissionUrl && (
                          <a
                            href={submission.submissionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-primary hover:underline text-sm"
                          >
                            <Icon name="PaperClipIcon" size={16} />
                            <span>Yuklangan fayl</span>
                          </a>
                        )}
                        {submission.feedback && (
                          <div className="mt-4 pt-4 border-t border-border">
                            <p className="text-sm font-medium text-foreground mb-2">O'qituvchi izohi:</p>
                            <p className="text-sm text-foreground">{submission.feedback}</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center space-x-4">
                      {submission?.grade === null && !overdue && (
                        <button
                          onClick={() => setSelectedAssignment(assignment)}
                          className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-smooth"
                        >
                          {submission ? 'Qayta topshirish' : 'Topshiriq topshirish'}
                        </button>
                      )}
                      {submission?.grade !== null && (
                        <div className="flex items-center space-x-2 text-success">
                          <Icon name="CheckCircleIcon" size={20} />
                          <span className="text-sm font-medium">Baholangan</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AssignmentSubmissionPortalInteractive;