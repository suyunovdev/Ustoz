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
  submissionCount: number;
  gradedCount: number;
  createdAt: string;
}

interface Course {
  id: string;
  title: string;
}

interface Submission {
  id: string;
  studentName: string;
  studentEmail: string;
  submittedAt: string;
  submissionText: string;
  submissionUrl: string | null;
  grade: number | null;
  feedback: string | null;
  gradedAt: string | null;
}

const AssignmentManagementInteractive = () => {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'grade'>('list');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    courseId: '',
    title: '',
    description: '',
    dueDate: '',
    maxScore: 100,
    fileRequirements: 'PDF, DOCX, ZIP (max 50MB)'
  });

  // Grading state
  const [gradingData, setGradingData] = useState<{
    submissionId: string;
    grade: number;
    feedback: string;
  } | null>(null);

  useEffect(() => {
    setIsHydrated(true);
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      const meRes = await fetch('/api/auth/me', { credentials: 'include' });
      if (!meRes.ok) {
        router.push('/login?redirect=/assignment-management');
        return;
      }
      const me = await meRes.json();
      setUserId(me.user.id);
      await Promise.all([loadCourses(), loadAssignments()]);
    } catch (err: unknown) {
      console.error('Auth check error:', err);
      setError(err instanceof Error ? err.message : 'Autentifikatsiya xatoligi');
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const res = await fetch('/api/teacher/courses', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      setCourses((data.courses || []).map((c: { id: string; title: string }) => ({ id: c.id, title: c.title })));
    } catch (err: unknown) {
      console.error('Error loading courses:', err);
    }
  };

  const loadAssignments = async () => {
    try {
      const res = await fetch('/api/teacher/assignments', { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAssignments(data.assignments || []);
    } catch (err: unknown) {
      console.error('Error loading assignments:', err);
      setError(err instanceof Error ? err.message : 'Topshiriqlarni yuklashda xatolik');
    }
  };

  const loadSubmissions = async (assignmentId: string) => {
    try {
      const res = await fetch(`/api/teacher/assignments/${assignmentId}/submissions`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSubmissions(data.submissions || []);
    } catch (err: unknown) {
      console.error('Error loading submissions:', err);
      setError(err instanceof Error ? err.message : 'Topshiriqlarni yuklashda xatolik');
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/teacher/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          courseId: formData.courseId,
          title: formData.title,
          description: formData.description,
          dueDate: formData.dueDate,
          maxScore: formData.maxScore,
          fileRequirements: formData.fileRequirements,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `HTTP ${res.status}`);
      }

      setFormData({
        courseId: '',
        title: '',
        description: '',
        dueDate: '',
        maxScore: 100,
        fileRequirements: 'PDF, DOCX, ZIP (max 50MB)',
      });

      await loadAssignments();
      setActiveTab('list');
    } catch (err: unknown) {
      console.error('Error creating assignment:', err);
      setError(err instanceof Error ? err.message : 'Topshiriq yaratishda xatolik');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGradeSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingData || !userId || !selectedAssignment) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/teacher/assignments/${selectedAssignment.id}/submissions/${gradingData.submissionId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            grade: gradingData.grade,
            feedback: gradingData.feedback,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `HTTP ${res.status}`);
      }

      await loadSubmissions(selectedAssignment.id);
      setGradingData(null);
    } catch (err: unknown) {
      console.error('Error grading submission:', err);
      setError(err instanceof Error ? err.message : 'Baholashda xatolik');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewSubmissions = async (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    await loadSubmissions(assignment.id);
    setActiveTab('grade');
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

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  if (!isHydrated) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <RoleBasedHeader userRole="teacher" currentPath="/assignment-management" />
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
      <RoleBasedHeader userRole="teacher" currentPath="/assignment-management" />
      
      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
              Topshiriqlar boshqaruvi
            </h1>
            <p className="text-muted-foreground">
              Topshiriqlar yarating, tarqating va talabalarning ishlarini baholang
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-md">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-card rounded-md shadow-warm p-2 mb-6">
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('list')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-md transition-smooth ${
                  activeTab === 'list' ?'bg-primary text-primary-foreground shadow-warm' :'text-foreground hover:bg-muted'
                }`}
              >
                <Icon name="ListBulletIcon" size={20} />
                <span className="font-medium">Topshiriqlar</span>
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-md transition-smooth ${
                  activeTab === 'create' ?'bg-primary text-primary-foreground shadow-warm' :'text-foreground hover:bg-muted'
                }`}
              >
                <Icon name="PlusCircleIcon" size={20} />
                <span className="font-medium">Yangi topshiriq</span>
              </button>
              {selectedAssignment && (
                <button
                  onClick={() => setActiveTab('grade')}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-md transition-smooth ${
                    activeTab === 'grade' ?'bg-primary text-primary-foreground shadow-warm' :'text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon name="AcademicCapIcon" size={20} />
                  <span className="font-medium">Baholash</span>
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          {activeTab === 'list' && (
            <div className="space-y-4">
              {assignments.length === 0 ? (
                <div className="bg-card rounded-md shadow-warm p-12 text-center">
                  <Icon name="DocumentTextIcon" size={48} className="mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-heading font-semibold text-foreground mb-2">
                    Topshiriqlar yo'q
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Hali topshiriq yaratilmagan. Yangi topshiriq yaratish uchun yuqoridagi tugmani bosing.
                  </p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-smooth"
                  >
                    Birinchi topshiriqni yaratish
                  </button>
                </div>
              ) : (
                assignments.map((assignment) => (
                  <div key={assignment.id} className="bg-card rounded-md shadow-warm p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-heading font-semibold text-foreground mb-2">
                          {assignment.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {assignment.courseTitle}
                        </p>
                        <p className="text-foreground mb-4">{assignment.description}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          isOverdue(assignment.dueDate)
                            ? 'bg-destructive/10 text-destructive' :'bg-success/10 text-success'
                        }`}
                      >
                        {isOverdue(assignment.dueDate) ? 'Muddati o\'tgan' : 'Faol'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
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
                        <p className="text-xs text-muted-foreground mb-1">Topshirildi</p>
                        <p className="text-sm font-medium text-foreground">{assignment.submissionCount}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Baholandi</p>
                        <p className="text-sm font-medium text-foreground">{assignment.gradedCount}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        Fayl talablari: {assignment.fileRequirements}
                      </p>
                      <button
                        onClick={() => handleViewSubmissions(assignment)}
                        className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-smooth"
                      >
                        <Icon name="EyeIcon" size={16} />
                        <span className="text-sm font-medium">Topshiriqlarni ko'rish</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'create' && (
            <div className="bg-card rounded-md shadow-warm p-6">
              <h2 className="text-2xl font-heading font-bold text-foreground mb-6">
                Yangi topshiriq yaratish
              </h2>
              <form onSubmit={handleCreateAssignment} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Kurs
                  </label>
                  <select
                    value={formData.courseId}
                    onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Kursni tanlang</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Topshiriq nomi
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Masalan: Birinchi modul bo'yicha loyiha"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Tavsif
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={4}
                    placeholder="Topshiriq haqida batafsil ma'lumot..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Topshirish muddati
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full px-4 py-3 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Maksimal ball
                    </label>
                    <input
                      type="number"
                      value={formData.maxScore}
                      onChange={(e) => setFormData({ ...formData, maxScore: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      min="1"
                      max="1000"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Fayl talablari
                  </label>
                  <input
                    type="text"
                    value={formData.fileRequirements}
                    onChange={(e) => setFormData({ ...formData, fileRequirements: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="PDF, DOCX, ZIP (max 50MB)"
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-smooth disabled:opacity-50"
                  >
                    {submitting ? 'Yaratilmoqda...' : 'Topshiriq yaratish'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('list')}
                    className="px-6 py-3 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-smooth"
                  >
                    Bekor qilish
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'grade' && selectedAssignment && (
            <div className="space-y-6">
              <div className="bg-card rounded-md shadow-warm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
                      {selectedAssignment.title}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {selectedAssignment.courseTitle} • {submissions.length} ta topshiriq
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab('list');
                      setSelectedAssignment(null);
                    }}
                    className="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-smooth"
                  >
                    Orqaga
                  </button>
                </div>
              </div>

              {submissions.length === 0 ? (
                <div className="bg-card rounded-md shadow-warm p-12 text-center">
                  <Icon name="InboxIcon" size={48} className="mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-heading font-semibold text-foreground mb-2">
                    Topshiriqlar yo'q
                  </h3>
                  <p className="text-muted-foreground">
                    Hali hech kim topshiriq topshirmagan.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <div key={submission.id} className="bg-card rounded-md shadow-warm p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-heading font-semibold text-foreground mb-1">
                            {submission.studentName}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2">{submission.studentEmail}</p>
                          <p className="text-sm text-muted-foreground">
                            Topshirildi: {formatDate(submission.submittedAt)}
                          </p>
                        </div>
                        {submission.grade !== null ? (
                          <div className="text-right">
                            <p className="text-2xl font-bold text-success">
                              {submission.grade}/{selectedAssignment.maxScore}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Baholandi: {submission.gradedAt ? formatDate(submission.gradedAt) : ''}
                            </p>
                          </div>
                        ) : (
                          <span className="px-3 py-1 bg-warning/10 text-warning rounded-full text-xs font-medium">
                            Baholanmagan
                          </span>
                        )}
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-medium text-foreground mb-2">Topshiriq matni:</p>
                        <p className="text-foreground bg-muted p-4 rounded-md">
                          {submission.submissionText || 'Matn kiritilmagan'}
                        </p>
                      </div>

                      {submission.submissionUrl && (
                        <div className="mb-4">
                          <a
                            href={submission.submissionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-primary hover:underline"
                          >
                            <Icon name="PaperClipIcon" size={16} />
                            <span className="text-sm">Yuklangan faylni ko'rish</span>
                          </a>
                        </div>
                      )}

                      {submission.feedback && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-foreground mb-2">Izoh:</p>
                          <p className="text-foreground bg-muted p-4 rounded-md">{submission.feedback}</p>
                        </div>
                      )}

                      {gradingData?.submissionId === submission.id ? (
                        <form onSubmit={handleGradeSubmission} className="space-y-4 pt-4 border-t border-border">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-2">
                                Ball (maksimal: {selectedAssignment.maxScore})
                              </label>
                              <input
                                type="number"
                                value={gradingData.grade}
                                onChange={(e) =>
                                  setGradingData({ ...gradingData, grade: parseInt(e.target.value) })
                                }
                                className="w-full px-4 py-3 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                min="0"
                                max={selectedAssignment.maxScore}
                                required
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Izoh</label>
                            <textarea
                              value={gradingData.feedback}
                              onChange={(e) => setGradingData({ ...gradingData, feedback: e.target.value })}
                              className="w-full px-4 py-3 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                              rows={3}
                              placeholder="Talabaga izoh yozing..."
                              required
                            />
                          </div>

                          <div className="flex items-center space-x-4">
                            <button
                              type="submit"
                              disabled={submitting}
                              className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-smooth disabled:opacity-50"
                            >
                              {submitting ? 'Saqlanmoqda...' : 'Baholash'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setGradingData(null)}
                              className="px-6 py-3 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-smooth"
                            >
                              Bekor qilish
                            </button>
                          </div>
                        </form>
                      ) : (
                        submission.grade === null && (
                          <button
                            onClick={() =>
                              setGradingData({
                                submissionId: submission.id,
                                grade: selectedAssignment.maxScore,
                                feedback: ''
                              })
                            }
                            className="mt-4 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-smooth"
                          >
                            Baholash
                          </button>
                        )
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AssignmentManagementInteractive;