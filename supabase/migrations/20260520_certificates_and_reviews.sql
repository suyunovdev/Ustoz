-- =============================================
-- CERTIFICATES JADVALI
-- =============================================

CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  certificate_number VARCHAR(20) UNIQUE NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT now(),
  verification_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, course_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_certificates_student ON certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course ON certificates(course_id);
CREATE INDEX IF NOT EXISTS idx_certificates_number ON certificates(certificate_number);

-- RLS
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sertifikatni faqat egasi ko'ra oladi"
  ON certificates FOR SELECT
  USING (
    auth.uid() = student_id
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- Verifikatsiya uchun hammaga ochiq (raqam bo'yicha)
CREATE POLICY "Verifikatsiya uchun ochiq"
  ON certificates FOR SELECT
  USING (true);

-- =============================================
-- KURS SHARHLARI (COURSE REVIEWS) JADVALI
-- =============================================

CREATE TABLE IF NOT EXISTS course_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  is_verified_purchase BOOLEAN DEFAULT true,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(course_id, student_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_reviews_course ON course_reviews(course_id);
CREATE INDEX IF NOT EXISTS idx_reviews_student ON course_reviews(student_id);

-- RLS
ALTER TABLE course_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sharhlarni hammа ko'ra oladi"
  ON course_reviews FOR SELECT USING (true);

CREATE POLICY "Faqat o'quvchi o'z sharhini yozadi"
  ON course_reviews FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Faqat o'quvchi o'z sharhini o'zgartiradi"
  ON course_reviews FOR UPDATE
  USING (auth.uid() = student_id);

-- =============================================
-- TRIGGER: Yangi sharh qo'shilganda courses.rating yangilanadi
-- =============================================

CREATE OR REPLACE FUNCTION update_course_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE courses
  SET
    rating = (
      SELECT ROUND(AVG(rating)::numeric, 1)
      FROM course_reviews
      WHERE course_id = COALESCE(NEW.course_id, OLD.course_id)
    ),
    review_count = (
      SELECT COUNT(*)
      FROM course_reviews
      WHERE course_id = COALESCE(NEW.course_id, OLD.course_id)
    )
  WHERE id = COALESCE(NEW.course_id, OLD.course_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_course_rating ON course_reviews;
CREATE TRIGGER trg_update_course_rating
  AFTER INSERT OR UPDATE OR DELETE ON course_reviews
  FOR EACH ROW EXECUTE FUNCTION update_course_rating();

-- =============================================
-- FUNKSIYA: Sertifikat raqami generatsiyasi
-- =============================================

CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TEXT AS $$
DECLARE
  v_year TEXT;
  v_number TEXT;
  v_full TEXT;
  v_exists BOOLEAN;
BEGIN
  v_year := EXTRACT(YEAR FROM now())::TEXT;
  LOOP
    v_number := LPAD(FLOOR(RANDOM() * 99999 + 1)::TEXT, 5, '0');
    v_full := 'USTOZ-' || v_year || '-' || v_number;
    SELECT EXISTS(SELECT 1 FROM certificates WHERE certificate_number = v_full) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_full;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGER: enrollment.progress = 100 bo'lganda sertifikat yaratish
-- =============================================

CREATE OR REPLACE FUNCTION auto_create_certificate()
RETURNS TRIGGER AS $$
DECLARE
  v_course_title TEXT;
  v_teacher_name TEXT;
  v_student_name TEXT;
  v_cert_number TEXT;
  v_app_url TEXT;
BEGIN
  -- Faqat progress 100 ga yetganda va avval yaratilmagan bo'lsa
  IF NEW.progress = 100 AND (OLD.progress IS NULL OR OLD.progress < 100) THEN
    IF NOT EXISTS (
      SELECT 1 FROM certificates
      WHERE student_id = NEW.student_id AND course_id = NEW.course_id
    ) THEN
      -- Kurs va o'qituvchi ma'lumotlarini olish
      SELECT c.title, up.full_name
      INTO v_course_title, v_teacher_name
      FROM courses c
      LEFT JOIN user_profiles up ON c.teacher_id = up.id
      WHERE c.id = NEW.course_id;

      -- O'quvchi ismini olish
      SELECT full_name INTO v_student_name
      FROM user_profiles
      WHERE id = NEW.student_id;

      v_cert_number := generate_certificate_number();
      v_app_url := COALESCE(current_setting('app.url', true), 'https://ustoz.uz');

      INSERT INTO certificates (
        student_id,
        course_id,
        certificate_number,
        verification_url,
        metadata
      ) VALUES (
        NEW.student_id,
        NEW.course_id,
        v_cert_number,
        v_app_url || '/verify/' || v_cert_number,
        jsonb_build_object(
          'course_title', v_course_title,
          'teacher_name', v_teacher_name,
          'student_name', v_student_name,
          'completed_at', now()
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_certificate ON enrollments;
CREATE TRIGGER trg_auto_certificate
  AFTER UPDATE OF progress ON enrollments
  FOR EACH ROW EXECUTE FUNCTION auto_create_certificate();
