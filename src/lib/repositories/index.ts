/**
 * Repository barrel — namespace imports uchun.
 *
 * Foydalanish:
 *   import { enrollmentRepo, topicRepo } from '@/lib/repositories';
 *   await enrollmentRepo.findByStudentAndCourse(...);
 */

export * as enrollmentRepo from './enrollment.repository';
export * as courseRepo from './course.repository';
export * as topicRepo from './topic.repository';
export * as topicCompletionRepo from './topic-completion.repository';
export * as activityRepo from './activity.repository';
export * as certificateRepo from './certificate.repository';
export * as categoryRepo from './category.repository';
export * as userRepo from './user.repository';
export * as auditLogRepo from './audit-log.repository';
export * as paymentRepo from './payment.repository';
export * as reviewRepo from './review.repository';
export * as campaignRepo from './campaign.repository';
export * as teacherApplicationRepo from './teacher-application.repository';
export * as moderationRepo from './moderation.repository';
export * as ticketRepo from './ticket.repository';
export * as teacherRepo from './teacher.repository';
export * as courseTopicRepo from './course-topic.repository';
export * as contentMaterialRepo from './content-material.repository';
export * as testRepo from './test.repository';
export * as assignmentRepo from './assignment.repository';
export * as studentRepo from './student.repository';
export * as groupRepo from './group.repository';
export * as analyticsRepo from './analytics.repository';
export * as earningsRepo from './earnings.repository';
export * as conversationRepo from './conversation.repository';
export * as courseReviewRepo from './course-review.repository';
export * as notificationRepo from './notification.repository';
export * as userProfileRepo from './user-profile.repository';
export * as referralRepo from './referral.repository';

// Type re-exports
export type {
  EnrollmentBasic,
  EnrollmentWithCourse,
} from './enrollment.repository';
export type {
  CourseWithCategoryAndTeacher,
  CourseWithAdminInfo,
  AdminCourseFilters,
} from './course.repository';
export type { StudentCertificateRow } from './certificate.repository';
export type { AdminUserRow, ListUsersOptions } from './user.repository';
export type { AuditLogRow, CreateAuditLogInput } from './audit-log.repository';
export type {
  AdminTransactionRow,
  ListTransactionsFilters,
} from './payment.repository';
export type {
  AdminReviewRow,
  AdminReviewsFilters,
  ReviewStatusFilter,
} from './review.repository';
export type {
  CampaignRow,
  CampaignStatus,
  CreateCampaignInput,
  RecipientFilter,
} from './campaign.repository';
export type {
  TeacherApplicationRow,
  ApplicationStatus,
  AdminApplicationsFilters,
  CreateApplicationInput,
} from './teacher-application.repository';
export type {
  ModerationQueueRow,
  ModerationQueueFilters,
  ModerationStatusFilter,
} from './moderation.repository';
export type {
  TicketListRow,
  TicketDetailRow,
  TicketStatus,
  TicketPriority,
  TicketFilters,
  CreateTicketInput,
} from './ticket.repository';
export type {
  TeacherCourseRow,
  TeacherCourseWithRevenue,
  TeacherCourseFilters,
} from './teacher.repository';
export type {
  CourseTopicRow,
  CreateTopicInput,
  UpdateTopicInput,
} from './course-topic.repository';
export type {
  ContentMaterialRow,
  CreateMaterialInput,
  UpdateMaterialInput,
  MaterialType,
  RecordViewInput,
  MaterialViewStats,
} from './content-material.repository';
export type {
  TestRow,
  QuestionRow,
  AttemptRow,
  QuestionOption,
  QuestionType,
  TestStatus,
  AttemptStatus,
  CreateTestInput,
  UpdateTestInput,
  CreateQuestionInput,
  UpdateQuestionInput,
  StartAttemptInput,
  SubmitAttemptInput,
} from './test.repository';
export type {
  AssignmentRow,
  SubmissionRow,
  AssignmentStatus,
  SubmissionStatus,
  SubmissionType,
  AttachmentJSON,
  CreateAssignmentInput,
  UpdateAssignmentInput,
  ListAssignmentsFilters,
  CreateSubmissionInput,
  GradeSubmissionInput,
} from './assignment.repository';
export type {
  TeacherStudentRow,
  StudentEnrollmentDetail,
  StudentDetailRow,
  NotifyInput,
} from './student.repository';
export type {
  GroupRow,
  GroupStatus,
  GroupColor,
  MemberRow,
  CreateGroupInput,
  UpdateGroupInput,
  ListGroupsFilters,
} from './group.repository';
export type {
  TeacherBalance,
  TeacherPaymentRow,
  WithdrawalRow,
  WithdrawalStatus,
  WithdrawalMethod,
  PaymentStatusFilter,
  CreateWithdrawalInput,
  PayoutSettings,
} from './earnings.repository';
export type {
  ConversationListItemRow,
  ConversationDetailRow,
  MessageRow,
  Side,
} from './conversation.repository';
export type {
  CourseReviewRow,
  ReviewStats,
  ListReviewsFilters,
  UpsertReviewInput,
} from './course-review.repository';
export type {
  CertificateRow,
  CertificateStatus,
  IssueSource,
  IssueCertificateInput,
  RevokeInput,
  ListTeacherCertsFilters,
} from './certificate.repository';
export type {
  NotificationRow,
  NotificationTypeFilter,
  NotificationStatusFilter,
  ListFilters as NotificationListFilters,
  CountsByTypeRow,
} from './notification.repository';
export type {
  EarningStatus,
  EarningRow,
  ReferralStats,
  ReferralCodeInfo,
  CreateEarningInput,
} from './referral.repository';
