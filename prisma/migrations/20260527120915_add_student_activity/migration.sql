-- CreateTable
CREATE TABLE "student_activities" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "topics_completed" INTEGER NOT NULL DEFAULT 0,
    "minutes_spent" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "student_activities_student_id_date_idx" ON "student_activities"("student_id", "date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "student_activities_student_id_date_key" ON "student_activities"("student_id", "date");

-- AddForeignKey
ALTER TABLE "student_activities" ADD CONSTRAINT "student_activities_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
