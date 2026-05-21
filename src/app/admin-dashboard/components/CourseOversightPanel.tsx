// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Icon from '@/components/ui/AppIcon';

interface Course {
  id: string;
  title: string;
  teacher_id: string;
  moderation_status: string;
  created_at: string;
  content_type: string;
}

const CourseOversightPanel = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0
  });
  const supabase = createClient();

  useEffect(() => {
    loadCourses();
  }, [filterStatus]);

  const loadCourses = async () => {
    setIsLoading(true);
    try {
      // Load statistics
      const { data: allCourses } = await supabase
        .from('course_materials')
        .select('moderation_status');

      const total = allCourses?.length || 0;
      const approved = allCourses?.filter(c => c.moderation_status === 'approved').length || 0;
      const pending = allCourses?.filter(c => c.moderation_status === 'pending').length || 0;
      const rejected = allCourses?.filter(c => c.moderation_status === 'rejected').length || 0;

      setStats({ total, approved, pending, rejected });

      // Load courses based on filter
      let query = supabase
        .from('course_materials')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (filterStatus !== 'all') {
        query = query.eq('moderation_status', filterStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      approved: { label: 'Tasdiqlangan', color: 'bg-success/10 text-success' },
      pending: { label: 'Kutilmoqda', color: 'bg-warning/10 text-warning' },
      rejected: { label: 'Rad etilgan', color: 'bg-destructive/10 text-destructive' },
      draft: { label: 'Qoralama', color: 'bg-muted text-muted-foreground' }
    };
    return config[status as keyof typeof config] || config.draft;
  };

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-md shadow-warm p-4">
          <p className="text-sm text-muted-foreground mb-1">Jami kurslar</p>
          <p className="text-2xl font-heading font-bold text-foreground">{stats.total}</p>
        </div>
        <div className="bg-card rounded-md shadow-warm p-4">
          <p className="text-sm text-muted-foreground mb-1">Tasdiqlangan</p>
          <p className="text-2xl font-heading font-bold text-success">{stats.approved}</p>
        </div>
        <div className="bg-card rounded-md shadow-warm p-4">
          <p className="text-sm text-muted-foreground mb-1">Kutilmoqda</p>
          <p className="text-2xl font-heading font-bold text-warning">{stats.pending}</p>
        </div>
        <div className="bg-card rounded-md shadow-warm p-4">
          <p className="text-sm text-muted-foreground mb-1">Rad etilgan</p>
          <p className="text-2xl font-heading font-bold text-destructive">{stats.rejected}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-md shadow-warm p-4">
        <div className="flex items-center space-x-2 overflow-x-auto">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-md transition-smooth whitespace-nowrap ${
              filterStatus === 'all' ?'bg-primary text-primary-foreground' :'bg-muted text-foreground hover:bg-muted/80'
            }`}
          >
            Barchasi
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-4 py-2 rounded-md transition-smooth whitespace-nowrap ${
              filterStatus === 'pending' ?'bg-primary text-primary-foreground' :'bg-muted text-foreground hover:bg-muted/80'
            }`}
          >
            Kutilmoqda
          </button>
          <button
            onClick={() => setFilterStatus('approved')}
            className={`px-4 py-2 rounded-md transition-smooth whitespace-nowrap ${
              filterStatus === 'approved' ?'bg-primary text-primary-foreground' :'bg-muted text-foreground hover:bg-muted/80'
            }`}
          >
            Tasdiqlangan
          </button>
          <button
            onClick={() => setFilterStatus('rejected')}
            className={`px-4 py-2 rounded-md transition-smooth whitespace-nowrap ${
              filterStatus === 'rejected' ?'bg-primary text-primary-foreground' :'bg-muted text-foreground hover:bg-muted/80'
            }`}
          >
            Rad etilgan
          </button>
        </div>
      </div>

      {/* Course List */}
      <div className="bg-card rounded-md shadow-warm p-6">
        <h3 className="text-xl font-heading font-semibold text-foreground mb-6">
          Kurslar ro'yxati ({courses.length})
        </h3>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded-md" />
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="BookOpenIcon" size={48} className="text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Kurslar topilmadi</p>
          </div>
        ) : (
          <div className="space-y-3">
            {courses.map((course) => {
              const statusBadge = getStatusBadge(course.moderation_status);
              return (
                <div
                  key={course.id}
                  className="flex items-center justify-between p-4 border border-border rounded-md hover:bg-muted transition-smooth"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-md">
                      <Icon name="BookOpenIcon" size={24} className="text-primary" />
                    </div>
                    <div>
                      <h4 className="font-heading font-semibold text-foreground">{course.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(course.created_at).toLocaleDateString('uz-UZ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                      {statusBadge.label}
                    </span>
                    <button className="p-2 hover:bg-muted rounded-md transition-smooth">
                      <Icon name="EyeIcon" size={20} className="text-muted-foreground" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseOversightPanel;