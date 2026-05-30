/**
 * Markaziy query key factory.
 * Mutation'larda invalidate qilish uchun yagona manba.
 */

export const queryKeys = {
  studentDashboard: ['student-dashboard'] as const,
  streak: ['student-streak'] as const,
  activity: (days: number) => ['student-activity', days] as const,
  categories: ['categories'] as const,
  recommendations: (excludeKey: string) => ['recommendations', excludeKey] as const,
  courseProgress: (courseId: string) => ['course-progress', courseId] as const,

  // Admin
  adminStats: ['admin-stats'] as const,
  adminUsers: (filters: { role?: string; search?: string; cursor?: string | null }) =>
    ['admin-users', filters.role ?? 'all', filters.search ?? '', filters.cursor ?? null] as const,
  adminAuditLog: (targetType?: string, targetId?: string) =>
    ['admin-audit-log', targetType ?? null, targetId ?? null] as const,
  adminCourses: (filters: {
    status?: string;
    search?: string;
    featuredOnly?: boolean;
    suspendedOnly?: boolean;
    cursor?: string | null;
  }) =>
    [
      'admin-courses',
      filters.status ?? 'all',
      filters.search ?? '',
      filters.featuredOnly ?? false,
      filters.suspendedOnly ?? false,
      filters.cursor ?? null,
    ] as const,
  adminPayments: (filters: {
    status?: string;
    method?: string;
    search?: string;
    cursor?: string | null;
  }) =>
    [
      'admin-payments',
      filters.status ?? 'all',
      filters.method ?? 'all',
      filters.search ?? '',
      filters.cursor ?? null,
    ] as const,
  adminReviews: (filters: {
    status?: string;
    rating?: number | 'all';
    search?: string;
    cursor?: string | null;
  }) =>
    [
      'admin-reviews',
      filters.status ?? 'all',
      filters.rating ?? 'all',
      filters.search ?? '',
      filters.cursor ?? null,
    ] as const,
  adminCampaigns: ['admin-campaigns'] as const,
  adminTeacherApplications: (filters: {
    status?: string;
    search?: string;
    cursor?: string | null;
  }) =>
    [
      'admin-teacher-applications',
      filters.status ?? 'all',
      filters.search ?? '',
      filters.cursor ?? null,
    ] as const,
  adminModeration: (filters: {
    status?: string;
    contentType?: string;
    search?: string;
    cursor?: string | null;
  }) =>
    [
      'admin-moderation',
      filters.status ?? 'all',
      filters.contentType ?? 'all',
      filters.search ?? '',
      filters.cursor ?? null,
    ] as const,
  adminTickets: (filters: {
    status?: string;
    priority?: string;
    search?: string;
    assignedToMe?: boolean;
    cursor?: string | null;
  }) =>
    [
      'admin-tickets',
      filters.status ?? 'all',
      filters.priority ?? 'all',
      filters.search ?? '',
      filters.assignedToMe ?? false,
      filters.cursor ?? null,
    ] as const,
  adminTicket: (id: string) => ['admin-ticket', id] as const,
  adminAuditLogList: (filters: {
    action?: string;
    targetType?: string;
    adminId?: string;
    search?: string;
    from?: string;
    to?: string;
    cursor?: string | null;
  }) =>
    [
      'admin-audit-log-list',
      filters.action ?? '',
      filters.targetType ?? '',
      filters.adminId ?? '',
      filters.search ?? '',
      filters.from ?? '',
      filters.to ?? '',
      filters.cursor ?? null,
    ] as const,
  adminAuditLogMeta: ['admin-audit-log-meta'] as const,

  // Teacher
  teacherDashboard: ['teacher-dashboard'] as const,
  teacherCourse: (id: string) => ['teacher-course', id] as const,
  teacherCourseTopics: (courseId: string) => ['teacher-course-topics', courseId] as const,
  topicMaterials: (topicId: string) => ['topic-materials', topicId] as const,
  teacherTests: (filters: { courseId?: string; topicId?: string; status?: string }) =>
    [
      'teacher-tests',
      filters.courseId ?? 'all',
      filters.topicId ?? 'all',
      filters.status ?? 'all',
    ] as const,
  teacherTest: (id: string) => ['teacher-test', id] as const,
  teacherTestAttempts: (id: string) => ['teacher-test-attempts', id] as const,
  teacherAssignments: (filters: { courseId?: string; topicId?: string; status?: string }) =>
    [
      'teacher-assignments',
      filters.courseId ?? 'all',
      filters.topicId ?? 'all',
      filters.status ?? 'all',
    ] as const,
  teacherAssignment: (id: string) => ['teacher-assignment', id] as const,
  assignmentSubmissions: (id: string, status?: string) =>
    ['assignment-submissions', id, status ?? 'all'] as const,
  studentAssignments: ['student-assignments'] as const,
  studentAssignment: (id: string) => ['student-assignment', id] as const,
  myAssignmentSubmission: (id: string) => ['my-assignment-submission', id] as const,
  teacherStudents: (filters: { courseId?: string; search?: string; activeOnly?: boolean }) =>
    [
      'teacher-students',
      filters.courseId ?? 'all',
      filters.search ?? '',
      filters.activeOnly ?? false,
    ] as const,
  teacherStudent: (id: string) => ['teacher-student', id] as const,
  teacherGroups: (filters: { courseId?: string; status?: string; search?: string }) =>
    [
      'teacher-groups',
      filters.courseId ?? 'all',
      filters.status ?? 'all',
      filters.search ?? '',
    ] as const,
  teacherGroup: (id: string) => ['teacher-group', id] as const,
  teacherGroupMembers: (id: string) => ['teacher-group-members', id] as const,
  teacherAnalytics: (days: number) => ['teacher-analytics', days] as const,
  courseAnalytics: (id: string) => ['course-analytics', id] as const,
  teacherBalance: ['teacher-balance'] as const,
  teacherPayments: (filters: { status?: string; courseId?: string; cursor?: string | null }) =>
    [
      'teacher-payments',
      filters.status ?? 'all',
      filters.courseId ?? 'all',
      filters.cursor ?? null,
    ] as const,
  teacherWithdrawals: (status?: string) => ['teacher-withdrawals', status ?? 'all'] as const,
  payoutSettings: ['payout-settings'] as const,
  conversations: ['conversations'] as const,
  conversation: (id: string) => ['conversation', id] as const,
  conversationMessages: (id: string) => ['conversation-messages', id] as const,
  teacherReviews: (filters: {
    courseId?: string;
    rating?: number;
    withoutReply?: boolean;
    sort?: string;
  }) =>
    [
      'teacher-reviews',
      filters.courseId ?? 'all',
      filters.rating ?? 0,
      filters.withoutReply ?? false,
      filters.sort ?? 'newest',
    ] as const,
  courseReviewStats: (courseId: string) =>
    ['course-review-stats', courseId] as const,
  teacherCertificates: (filters: {
    courseId?: string;
    status?: string;
    search?: string;
  }) =>
    [
      'teacher-certificates',
      filters.courseId ?? 'all',
      filters.status ?? 'all',
      filters.search ?? '',
    ] as const,
  notifications: (filters: { status?: string; type?: string }) =>
    ['notifications', filters.status ?? 'all', filters.type ?? 'all'] as const,
  notificationBadge: ['notification-badge'] as const,
  myProfile: ['my-profile'] as const,
  publicTeacher: (id: string) => ['public-teacher', id] as const,
  publicTeacherCourses: (id: string) => ['public-teacher-courses', id] as const,
  myTickets: ['my-tickets'] as const,
  ticket: (id: string) => ['ticket', id] as const,
  myReferral: ['my-referral'] as const,
  myReferralEarnings: (status?: string) =>
    ['my-referral-earnings', status ?? 'all'] as const,
} as const;
