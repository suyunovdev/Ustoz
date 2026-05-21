// @ts-nocheck
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Notification {
  id: string;
  recipient_id: string;
  sender_id: string | null;
  type: 'enrollment' | 'quiz_completion' | 'assignment_submission' | 'course_update' | 'achievement';
  title: string;
  message: string;
  status: 'unread' | 'read' | 'archived';
  related_course_id: string | null;
  related_entity_id: string | null;
  metadata: any;
  created_at: string;
  read_at: string | null;
}

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  enrolled_at: string;
  progress: number;
  completed_at: string | null;
  is_active: boolean;
}

export interface QuizCompletion {
  id: string;
  student_id: string;
  course_id: string;
  quiz_id: string;
  score: number;
  max_score: number;
  percentage: number;
  completed_at: string;
  time_taken: number | null;
}

export interface AssignmentSubmission {
  id: string;
  student_id: string;
  course_id: string;
  assignment_id: string;
  submission_url: string | null;
  submission_text: string | null;
  submitted_at: string;
  grade: number | null;
  feedback: string | null;
  graded_at: string | null;
  graded_by: string | null;
}

class NotificationService {
  private supabase = createClient();
  private channels: Map<string, RealtimeChannel> = new Map();

  // Subscribe to real-time notifications
  subscribeToNotifications(
    userId: string,
    onNotification: (notification: Notification) => void
  ): () => void {
    const channelName = `notifications:${userId}`;
    
    // Remove existing channel if any
    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
      this.channels.delete(channelName);
    }

    // Create new channel
    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          onNotification(payload.new as Notification);
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);

    // Return cleanup function
    return () => {
      channel.unsubscribe();
      this.channels.delete(channelName);
    };
  }

  // Subscribe to enrollments (for teacher dashboard)
  subscribeToEnrollments(
    courseIds: string[],
    onEnrollment: (enrollment: Enrollment) => void
  ): () => void {
    const channelName = `enrollments:${courseIds.join(',')}`;
    
    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
      this.channels.delete(channelName);
    }

    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'enrollments',
        },
        (payload) => {
          const enrollment = payload.new as Enrollment;
          if (courseIds.includes(enrollment.course_id)) {
            onEnrollment(enrollment);
          }
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);

    return () => {
      channel.unsubscribe();
      this.channels.delete(channelName);
    };
  }

  // Subscribe to quiz completions (for teacher dashboard)
  subscribeToQuizCompletions(
    courseIds: string[],
    onCompletion: (completion: QuizCompletion) => void
  ): () => void {
    const channelName = `quiz_completions:${courseIds.join(',')}`;
    
    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
      this.channels.delete(channelName);
    }

    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'quiz_completions',
        },
        (payload) => {
          const completion = payload.new as QuizCompletion;
          if (courseIds.includes(completion.course_id)) {
            onCompletion(completion);
          }
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);

    return () => {
      channel.unsubscribe();
      this.channels.delete(channelName);
    };
  }

  // Subscribe to assignment submissions (for teacher dashboard)
  subscribeToAssignmentSubmissions(
    courseIds: string[],
    onSubmission: (submission: AssignmentSubmission) => void
  ): () => void {
    const channelName = `assignment_submissions:${courseIds.join(',')}`;
    
    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
      this.channels.delete(channelName);
    }

    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'assignment_submissions',
        },
        (payload) => {
          const submission = payload.new as AssignmentSubmission;
          if (courseIds.includes(submission.course_id)) {
            onSubmission(submission);
          }
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);

    return () => {
      channel.unsubscribe();
      this.channels.delete(channelName);
    };
  }

  // Fetch notifications
  async fetchNotifications(userId: string, limit: number = 20): Promise<Notification[]> {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }

    return data || [];
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await this.supabase.rpc('mark_notification_read', {
      notification_id: notificationId,
    });

    if (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Mark all notifications as read
  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .update({ status: 'read', read_at: new Date().toISOString() })
      .eq('recipient_id', userId)
      .eq('status', 'unread');

    if (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  // Get unread count
  async getUnreadCount(userId: string): Promise<number> {
    const { data, error } = await this.supabase.rpc('get_unread_notification_count');

    if (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }

    return data || 0;
  }

  // Create enrollment
  async createEnrollment(studentId: string, courseId: string): Promise<Enrollment | null> {
    const { data, error } = await this.supabase
      .from('enrollments')
      .insert({
        student_id: studentId,
        course_id: courseId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating enrollment:', error);
      return null;
    }

    return data;
  }

  // Create quiz completion
  async createQuizCompletion(
    studentId: string,
    courseId: string,
    quizId: string,
    score: number,
    maxScore: number,
    timeTaken?: number
  ): Promise<QuizCompletion | null> {
    const percentage = (score / maxScore) * 100;

    const { data, error } = await this.supabase
      .from('quiz_completions')
      .insert({
        student_id: studentId,
        course_id: courseId,
        quiz_id: quizId,
        score,
        max_score: maxScore,
        percentage,
        time_taken: timeTaken,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating quiz completion:', error);
      return null;
    }

    return data;
  }

  // Create assignment submission
  async createAssignmentSubmission(
    studentId: string,
    courseId: string,
    assignmentId: string,
    submissionUrl?: string,
    submissionText?: string
  ): Promise<AssignmentSubmission | null> {
    const { data, error } = await this.supabase
      .from('assignment_submissions')
      .insert({
        student_id: studentId,
        course_id: courseId,
        assignment_id: assignmentId,
        submission_url: submissionUrl,
        submission_text: submissionText,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating assignment submission:', error);
      return null;
    }

    return data;
  }

  // Cleanup all subscriptions
  cleanup(): void {
    this.channels.forEach((channel) => {
      channel.unsubscribe();
    });
    this.channels.clear();
  }
}

export const notificationService = new NotificationService();