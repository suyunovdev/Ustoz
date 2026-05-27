-- AlterTable
ALTER TABLE "enrollments" ADD COLUMN     "last_accessed_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "enrollments_student_id_last_accessed_at_idx" ON "enrollments"("student_id", "last_accessed_at" DESC);
