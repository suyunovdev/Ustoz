'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import RoleBasedHeader from '@/components/common/RoleBasedHeader';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';

interface PopularCourse {
  id: string;
  title: string;
  instructor: string;
  coverImage: string;
  rating: number;
  enrollmentCount: number;
  price: number;
}

interface Teacher {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  courseCount: number;
  studentCount: number;
}

// ─── Scroll Animation Hook ───
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

// ─── Counter Animation Hook ───
function useCountUp(target: number, duration = 1500, active = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active || target === 0) { setCount(0); return; }
    let start = 0;
    const step = Math.max(1, Math.ceil(target / (duration / 16)));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, active]);
  return count;
}

// ─── FAQ Item ───
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-md overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/50 transition-smooth"
        aria-expanded={open}
      >
        <span className="font-medium text-foreground pr-4">{q}</span>
        <Icon name={open ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={20} className="text-muted-foreground flex-shrink-0" />
      </button>
      {open && (
        <div className="px-5 pb-5 text-muted-foreground" role="region">{a}</div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════
const LandingPageInteractive = () => {
  useAuth(); // provider ichida bo'lish kerak
  const { t } = useI18n();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ totalCourses: 0, activeStudents: 0, successfulTeachers: 0, certificatesAwarded: 0 });
  const [popularCourses, setPopularCourses] = useState<PopularCourse[]>([]);
  const [featuredTeachers, setFeaturedTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  const CATEGORIES = useMemo(() => [
    { label: t('landing.catProgramming'), icon: 'CodeBracketIcon', key: 'programming' },
    { label: t('landing.catMath'), icon: 'CalculatorIcon', key: 'mathematics' },
    { label: t('landing.catEnglish'), icon: 'LanguageIcon', key: 'english_language' },
    { label: t('landing.catDesign'), icon: 'PaintBrushIcon', key: 'design' },
    { label: t('landing.catBusiness'), icon: 'BriefcaseIcon', key: 'business_management' },
    { label: t('landing.catPhysics'), icon: 'BeakerIcon', key: 'physics' },
    { label: t('landing.catHistory'), icon: 'BookOpenIcon', key: 'history' },
    { label: t('landing.catAI'), icon: 'CpuChipIcon', key: 'artificial_intelligence' },
  ], [t]);

  const FAQ_DATA = useMemo(() => [
    { q: t('landing.faq1Q'), a: t('landing.faq1A') },
    { q: t('landing.faq2Q'), a: t('landing.faq2A') },
    { q: t('landing.faq3Q'), a: t('landing.faq3A') },
    { q: t('landing.faq4Q'), a: t('landing.faq4A') },
    { q: t('landing.faq5Q'), a: t('landing.faq5A') },
    { q: t('landing.faq6Q'), a: t('landing.faq6A') },
  ], [t]);

  // Scroll reveal refs
  const heroReveal = useScrollReveal();
  const howItWorksReveal = useScrollReveal();
  const categoriesReveal = useScrollReveal();
  const coursesReveal = useScrollReveal();
  const statsReveal = useScrollReveal();
  const teachersReveal = useScrollReveal();
  const testimonialsReveal = useScrollReveal();
  const faqReveal = useScrollReveal();
  const aboutReveal = useScrollReveal();
  const ctaBannerReveal = useScrollReveal();
  const studentWorksReveal = useScrollReveal();
  const partnersReveal = useScrollReveal();

  // Counter animations
  const c1 = useCountUp(stats.totalCourses, 1200, statsReveal.isVisible);
  const c2 = useCountUp(stats.activeStudents, 1200, statsReveal.isVisible);
  const c3 = useCountUp(stats.successfulTeachers, 1200, statsReveal.isVisible);
  const c4 = useCountUp(stats.certificatesAwarded, 1200, statsReveal.isVisible);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesRes, statsRes] = await Promise.all([
          fetch('/api/courses?limit=6&sortBy=enrollments', { credentials: 'include' }),
          fetch('/api/stats'),
        ]);

        if (coursesRes.ok) {
          const { courses } = await coursesRes.json();
          setPopularCourses(
            (courses || []).slice(0, 6).map((c: Record<string, string | number>) => ({
              id: c.id,
              title: c.title,
              instructor: c.teacherName || 'Ustoz',
              coverImage: c.coverImage || '/assets/images/no_image.png',
              rating: Number(c.rating) || 0,
              enrollmentCount: Number(c.enrollmentCount) || 0,
              price: parseInt(String(c.priceUzs), 10) || 0,
            })),
          );
        }

        if (statsRes.ok) {
          const s = await statsRes.json();
          setStats({
            totalCourses: s.totalCourses || 0,
            activeStudents: s.activeStudents || 0,
            successfulTeachers: s.successfulTeachers || 0,
            certificatesAwarded: s.certificatesAwarded || 0,
          });

          // Featured teachers placeholder from stats
          setFeaturedTeachers([
            { id: '1', fullName: 'Aziza Karimova', avatarUrl: null, courseCount: 5, studentCount: 120 },
            { id: '2', fullName: 'Sardor Rahimov', avatarUrl: null, courseCount: 3, studentCount: 89 },
            { id: '3', fullName: 'Jasur Yusupov', avatarUrl: null, courseCount: 7, studentCount: 230 },
            { id: '4', fullName: 'Nilufar Azimova', avatarUrl: null, courseCount: 4, studentCount: 156 },
          ]);
        }
      } catch (error) {
        console.error('Error fetching landing page data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/course-marketplace?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  }, [searchQuery, router]);

  const animClass = (visible: boolean) =>
    `transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`;

  return (
    <div className="min-h-screen bg-background scroll-smooth">
      <RoleBasedHeader userRole={null} currentPath="/landing-page" />

      <main className="pt-16">
        {/* ═══ HERO ═══ */}
        <section className="relative bg-gradient-to-br from-primary via-secondary to-primary text-primary-foreground py-20 md:py-28 overflow-hidden">
          {/* Animated bg circles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full animate-pulse" />
            <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-white/5 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          <div ref={heroReveal.ref} className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 ${animClass(heroReveal.isVisible)}`}>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center px-4 py-2 bg-white/10 rounded-full text-sm mb-6 backdrop-blur-sm">
                  <Icon name="SparklesIcon" size={16} className="mr-2" />
                  {t('landing.badge')}
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold mb-6 leading-tight">
                  {t('landing.heroTitle')}
                </h1>
                <p className="text-lg md:text-xl mb-8 opacity-90">
                  {t('landing.heroDesc')}
                </p>

                {/* Hero Search */}
                <form onSubmit={handleSearch} className="flex bg-white/10 backdrop-blur-sm rounded-lg p-2 mb-8 border border-white/20" role="search">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('landing.searchPlaceholder')}
                    aria-label={t('landing.searchPlaceholder')}
                    className="flex-1 bg-transparent text-primary-foreground placeholder-white/60 px-4 py-3 outline-none text-base"
                  />
                  <button
                    type="submit"
                    aria-label={t('common.search')}
                    className="px-6 py-3 bg-accent text-accent-foreground rounded-md font-medium hover:opacity-90 transition-smooth flex-shrink-0"
                  >
                    <Icon name="MagnifyingGlassIcon" size={20} />
                  </button>
                </form>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center px-8 py-4 bg-accent text-accent-foreground rounded-md font-medium hover:scale-105 transition-smooth shadow-warm-lg"
                  >
                    <Icon name="AcademicCapIcon" size={24} className="mr-2" />
                    {t('landing.startFree')}
                  </Link>
                  <a
                    href="#courses"
                    className="inline-flex items-center justify-center px-8 py-4 bg-white/10 backdrop-blur-sm text-primary-foreground rounded-md font-medium hover:bg-white/20 transition-smooth border border-white/20"
                  >
                    {t('landing.viewCourses')}
                  </a>
                </div>
              </div>

              {/* Hero Stats Card */}
              <div className="hidden md:block">
                <div className="bg-primary-foreground rounded-xl p-8 shadow-warm-2xl">
                  <div className="grid grid-cols-2 gap-6">
                    {[
                      { icon: 'BookOpenIcon', value: `${stats.totalCourses}+`, label: t('landing.statCourses'), bg: 'bg-primary', color: 'text-primary' },
                      { icon: 'UserGroupIcon', value: `${stats.activeStudents}+`, label: t('landing.statStudents'), bg: 'bg-secondary', color: 'text-secondary' },
                      { icon: 'UserIcon', value: `${stats.successfulTeachers}+`, label: t('landing.statTeachers'), bg: 'bg-accent', color: 'text-accent-foreground' },
                      { icon: 'TrophyIcon', value: `${stats.certificatesAwarded}+`, label: t('landing.statCertificates'), bg: 'bg-success', color: 'text-success' },
                    ].map((s, i) => (
                      <div key={i} className="text-center">
                        <div className={`flex items-center justify-center w-14 h-14 ${s.bg} rounded-lg mb-3 mx-auto`}>
                          <Icon name={s.icon} size={28} className="text-primary-foreground" variant="solid" />
                        </div>
                        <div className={`text-2xl font-heading font-bold ${s.color}`}>{s.value}</div>
                        <div className="text-xs text-muted-foreground">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ HOW IT WORKS ═══ */}
        <section className="py-16 md:py-24">
          <div ref={howItWorksReveal.ref} className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${animClass(howItWorksReveal.isVisible)}`}>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">{t('landing.howItWorksTitle')}</h2>
              <p className="text-lg text-muted-foreground">{t('landing.howItWorksDesc')}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { step: '1', title: t('landing.step1Title'), desc: t('landing.step1Desc'), icon: 'UserPlusIcon', color: 'bg-primary' },
                { step: '2', title: t('landing.step2Title'), desc: t('landing.step2Desc'), icon: 'MagnifyingGlassIcon', color: 'bg-secondary' },
                { step: '3', title: t('landing.step3Title'), desc: t('landing.step3Desc'), icon: 'PlayCircleIcon', color: 'bg-accent' },
              ].map((item, i) => (
                <div key={i} className="relative text-center group">
                  {i < 2 && (
                    <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-border" />
                  )}
                  <div className={`inline-flex items-center justify-center w-24 h-24 ${item.color} rounded-2xl mb-6 shadow-warm-lg group-hover:scale-110 transition-smooth`}>
                    <Icon name={item.icon} size={40} className="text-primary-foreground" />
                  </div>
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{t('landing.step')} {item.step}</div>
                  <h3 className="text-xl font-heading font-bold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ CATEGORIES ═══ */}
        <section className="py-16 md:py-20 bg-muted">
          <div ref={categoriesReveal.ref} className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${animClass(categoriesReveal.isVisible)}`}>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">{t('landing.categoriesTitle')}</h2>
              <p className="text-lg text-muted-foreground">{t('landing.categoriesDesc')}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.key}
                  href={`/course-marketplace?category=${cat.key}`}
                  className="flex flex-col items-center p-6 bg-card rounded-xl shadow-warm hover:shadow-warm-lg hover:-translate-y-1 transition-all duration-300 group"
                >
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                    <Icon name={cat.icon} size={28} className="text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <span className="font-medium text-sm text-foreground">{cat.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ POPULAR COURSES ═══ */}
        <section id="courses" className="py-16 md:py-24">
          <div ref={coursesReveal.ref} className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${animClass(coursesReveal.isVisible)}`}>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">{t('landing.popularCoursesTitle')}</h2>
              <p className="text-lg text-muted-foreground">{t('landing.popularCoursesDesc')}</p>
            </div>

            {loading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-card rounded-xl shadow-warm animate-pulse">
                    <div className="h-48 bg-muted rounded-t-xl" />
                    <div className="p-6 space-y-3">
                      <div className="h-5 bg-muted rounded w-3/4" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                      <div className="h-4 bg-muted rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {popularCourses.length > 0 ? (
                  popularCourses.map((course) => (
                    <Link
                      key={course.id}
                      href={`/course-details?id=${course.id}`}
                      className="bg-card rounded-xl shadow-warm hover:shadow-warm-xl hover:-translate-y-2 transition-all duration-300 overflow-hidden group"
                    >
                      <div className="relative h-48 overflow-hidden bg-muted">
                        <AppImage
                          src={course.coverImage}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        {course.price === 0 && (
                          <span className="absolute top-3 left-3 px-3 py-1 bg-success text-white text-xs font-bold rounded-full uppercase">{t('landing.free')}</span>
                        )}
                        {/* Hover video preview overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                          <div className="flex items-center justify-center absolute inset-0">
                            <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-warm-lg transform scale-75 group-hover:scale-100 transition-transform duration-300">
                              <Icon name="PlayIcon" size={28} className="text-primary ml-1" variant="solid" />
                            </div>
                          </div>
                          <p className="text-white text-sm line-clamp-2 relative z-10">{course.title}</p>
                          <div className="flex items-center gap-2 mt-1 relative z-10">
                            <span className="text-white/80 text-xs">{course.instructor}</span>
                            <span className="text-white/60 text-xs">•</span>
                            <span className="text-accent text-xs font-medium flex items-center">
                              <Icon name="StarIcon" size={12} className="mr-0.5" variant="solid" />
                              {course.rating.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="text-lg font-heading font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">{course.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{t('landing.instructor')}: {course.instructor}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Icon name="StarIcon" size={16} className="text-accent mr-1" variant="solid" />
                            <span className="text-sm font-medium">{course.rating.toFixed(1)}</span>
                            <span className="text-sm text-muted-foreground ml-2">({course.enrollmentCount})</span>
                          </div>
                          <div className="text-lg font-bold text-primary">
                            {course.price === 0 ? t('landing.free') : `${course.price.toLocaleString()} so'm`}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-12">
                    <Icon name="BookOpenIcon" size={48} className="text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">{t('landing.noCourses')}</p>
                  </div>
                )}
              </div>
            )}

            <div className="text-center mt-12">
              <Link
                href="/course-marketplace"
                className="inline-flex items-center justify-center px-8 py-4 bg-primary text-primary-foreground rounded-lg font-medium hover:scale-105 transition-smooth shadow-warm"
              >
                {t('landing.viewAllCourses')}
                <Icon name="ArrowRightIcon" size={20} className="ml-2" />
              </Link>
            </div>
          </div>
        </section>

        {/* ═══ STATISTICS (Counter Animation) ═══ */}
        <section className="py-16 md:py-24 bg-muted">
          <div ref={statsReveal.ref} className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${animClass(statsReveal.isVisible)}`}>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">{t('landing.statsTitle')}</h2>
              <p className="text-lg text-muted-foreground">{t('landing.statsDesc')}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { icon: 'BookOpenIcon', value: c1, label: t('landing.totalCourses'), bg: 'bg-primary', color: 'text-primary' },
                { icon: 'UserGroupIcon', value: c2, label: t('landing.activeStudents'), bg: 'bg-secondary', color: 'text-secondary' },
                { icon: 'UserIcon', value: c3, label: t('landing.teachers'), bg: 'bg-accent', color: 'text-accent-foreground' },
                { icon: 'TrophyIcon', value: c4, label: t('landing.certificates'), bg: 'bg-success', color: 'text-success' },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <div className={`flex items-center justify-center w-20 h-20 ${s.bg} rounded-2xl mb-4 mx-auto`}>
                    <Icon name={s.icon} size={40} className="text-primary-foreground" variant="solid" />
                  </div>
                  <div className={`text-4xl font-heading font-bold ${s.color} mb-2`}>{s.value}+</div>
                  <div className="text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ FEATURED TEACHERS ═══ */}
        <section className="py-16 md:py-24">
          <div ref={teachersReveal.ref} className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${animClass(teachersReveal.isVisible)}`}>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">{t('landing.featuredTeachersTitle')}</h2>
              <p className="text-lg text-muted-foreground">{t('landing.featuredTeachersDesc')}</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredTeachers.map((teacher) => (
                <div key={teacher.id} className="bg-card rounded-xl p-6 shadow-warm hover:shadow-warm-lg hover:-translate-y-1 transition-all duration-300 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                    {teacher.avatarUrl ? (
                      <AppImage src={teacher.avatarUrl} alt={teacher.fullName} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <Icon name="UserIcon" size={36} className="text-primary-foreground" variant="solid" />
                    )}
                  </div>
                  <h3 className="text-lg font-heading font-bold mb-1">{teacher.fullName}</h3>
                  <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Icon name="BookOpenIcon" size={14} /> {teacher.courseCount} {t('landing.course')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Icon name="UserGroupIcon" size={14} /> {teacher.studentCount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ CTA BANNER ═══ */}
        <section className="py-12">
          <div ref={ctaBannerReveal.ref} className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${animClass(ctaBannerReveal.isVisible)}`}>
            <div className="bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-2xl p-8 md:p-12 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-white/5 pointer-events-none" />
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4 relative z-10">{t('landing.ctaTitle')}</h2>
              <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto relative z-10">
                {t('landing.ctaDesc')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
                <Link href="/register?role=student" className="inline-flex items-center justify-center px-8 py-4 bg-accent text-accent-foreground rounded-lg font-medium hover:scale-105 transition-smooth shadow-warm-lg">
                  {t('landing.ctaStudent')}
                </Link>
                <Link href="/register?role=teacher" className="inline-flex items-center justify-center px-8 py-4 bg-white/15 text-primary-foreground rounded-lg font-medium hover:bg-white/25 transition-smooth border border-white/30">
                  {t('landing.ctaTeacher')}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ STUDENT WORKS GALLERY ═══ */}
        <section className="py-16 md:py-24">
          <div ref={studentWorksReveal.ref} className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${animClass(studentWorksReveal.isVisible)}`}>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">{t('landing.studentWorksTitle')}</h2>
              <p className="text-lg text-muted-foreground">{t('landing.studentWorksDesc')}</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: 'Dilshod Nazarov', course: 'Python Dasturlash', progress: 100, cert: true, avatar: 'bg-primary', emoji: '🎓' },
                { name: 'Madina Umarova', course: 'Web Development', progress: 100, cert: true, avatar: 'bg-secondary', emoji: '💻' },
                { name: 'Bekzod Tursunov', course: 'Data Science', progress: 85, cert: false, avatar: 'bg-accent', emoji: '📊' },
                { name: 'Zarina Karimova', course: 'UI/UX Dizayn', progress: 100, cert: true, avatar: 'bg-success', emoji: '🎨' },
              ].map((student, i) => (
                <div
                  key={i}
                  className="bg-card rounded-xl p-6 shadow-warm hover:shadow-warm-lg hover:-translate-y-1 transition-all duration-300 border border-border/50"
                >
                  <div className="flex items-center mb-4">
                    <div className={`w-12 h-12 ${student.avatar} rounded-full flex items-center justify-center mr-3`}>
                      <span className="text-xl">{student.emoji}</span>
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-foreground">{student.name}</h4>
                      <p className="text-xs text-muted-foreground">{student.course}</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{t('landing.workProgress')}</span>
                      <span className="font-medium text-foreground">{student.progress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-1000 ${student.progress === 100 ? 'bg-success' : 'bg-primary'}`}
                        style={{ width: studentWorksReveal.isVisible ? `${student.progress}%` : '0%' }}
                      />
                    </div>
                  </div>

                  {student.cert ? (
                    <div className="flex items-center gap-2 px-3 py-2 bg-success/10 rounded-lg">
                      <Icon name="CheckBadgeIcon" size={18} className="text-success" variant="solid" />
                      <span className="text-xs font-medium text-success">{t('landing.workCertEarned')}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg">
                      <Icon name="ArrowTrendingUpIcon" size={18} className="text-primary" />
                      <span className="text-xs font-medium text-primary">{student.progress}% {t('landing.workProgress')}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ PARTNER ORGANIZATIONS ═══ */}
        <section className="py-16 md:py-20 bg-muted">
          <div ref={partnersReveal.ref} className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${animClass(partnersReveal.isVisible)}`}>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">{t('landing.partnersTitle')}</h2>
              <p className="text-lg text-muted-foreground">{t('landing.partnersDesc')}</p>
            </div>

            {/* Partner logos grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
              {[
                { name: "O'zMU", full: "O'zbekiston Milliy Universiteti" },
                { name: 'TATU', full: "Toshkent Axborot Texnologiyalari Universiteti" },
                { name: 'TDIU', full: "Toshkent Davlat Iqtisodiyot Universiteti" },
                { name: 'TDPU', full: "Toshkent Davlat Pedagogika Universiteti" },
                { name: 'TSTU', full: "Toshkent Davlat Texnika Universiteti" },
                { name: 'SamDU', full: "Samarqand Davlat Universiteti" },
              ].map((partner, i) => (
                <div
                  key={i}
                  className="group bg-card rounded-xl p-6 shadow-warm hover:shadow-warm-lg transition-all duration-300 flex flex-col items-center justify-center text-center relative overflow-hidden"
                >
                  {/* Logo placeholder */}
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl flex items-center justify-center mb-3 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-300">
                    <span className="text-lg font-heading font-bold text-primary">{partner.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-tight">{partner.full}</p>

                  {/* Hover shine effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
              ))}
            </div>

            {/* Trust badge */}
            <div className="flex items-center justify-center gap-8 pt-6 border-t border-border">
              {[
                { icon: 'ShieldCheckIcon', text: t('landing.trustDataProtection') },
                { icon: 'LockClosedIcon', text: t('landing.trustSecurePayment') },
                { icon: 'CheckBadgeIcon', text: t('landing.trustQualityGuarantee') },
              ].map((badge, i) => (
                <div key={i} className="flex items-center gap-2 text-muted-foreground">
                  <Icon name={badge.icon} size={18} className="text-success" />
                  <span className="text-sm hidden sm:inline">{badge.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ TESTIMONIALS ═══ */}
        <section className="py-16 md:py-24 bg-muted">
          <div ref={testimonialsReveal.ref} className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${animClass(testimonialsReveal.isVisible)}`}>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">{t('landing.testimonialsTitle')}</h2>
              <p className="text-lg text-muted-foreground">{t('landing.testimonialsDesc')}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { name: t('landing.testimonial1Name'), role: t('landing.testimonial1Role'), text: t('landing.testimonial1'), bg: 'bg-primary' },
                { name: t('landing.testimonial2Name'), role: t('landing.testimonial2Role'), text: t('landing.testimonial2'), bg: 'bg-secondary' },
                { name: t('landing.testimonial3Name'), role: t('landing.testimonial3Role'), text: t('landing.testimonial3'), bg: 'bg-accent' },
              ].map((item, i) => (
                <div key={i} className="bg-card rounded-xl p-6 shadow-warm hover:shadow-warm-lg transition-all duration-300">
                  <div className="flex items-center mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Icon key={star} name="StarIcon" size={18} className="text-accent" variant="solid" />
                    ))}
                  </div>
                  <p className="mb-6 text-muted-foreground leading-relaxed">&ldquo;{item.text}&rdquo;</p>
                  <div className="flex items-center">
                    <div className={`w-12 h-12 ${item.bg} rounded-full flex items-center justify-center mr-3`}>
                      <Icon name="UserIcon" size={24} className="text-primary-foreground" variant="solid" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{item.name}</div>
                      <div className="text-sm text-muted-foreground">{item.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ FAQ ═══ */}
        <section className="py-16 md:py-24">
          <div ref={faqReveal.ref} className={`max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 ${animClass(faqReveal.isVisible)}`}>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">{t('landing.faqTitle')}</h2>
              <p className="text-lg text-muted-foreground">{t('landing.faqDesc')}</p>
            </div>

            <div className="space-y-3">
              {FAQ_DATA.map((faq, i) => (
                <FaqItem key={i} q={faq.q} a={faq.a} />
              ))}
            </div>
          </div>
        </section>

        {/* ═══ ABOUT ═══ */}
        <section id="about" className="py-16 md:py-24 bg-muted overflow-hidden">
          <div ref={aboutReveal.ref} className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${animClass(aboutReveal.isVisible)}`}>

            {/* Hero banner */}
            <div className="relative bg-gradient-to-br from-primary via-secondary to-primary text-primary-foreground rounded-2xl p-8 md:p-14 mb-16 overflow-hidden">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/5 rounded-full" />
                <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-white/5 rounded-full" />
              </div>
              <div className="relative z-10 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full text-sm mb-6 backdrop-blur-sm">
                  <Icon name="SparklesIcon" size={16} />
                  {t('landing.since')}
                </div>
                <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6 leading-tight">{t('landing.aboutTitle')}</h2>
                <p className="text-lg md:text-xl opacity-90 leading-relaxed">
                  {t('landing.aboutDesc1')}
                </p>
              </div>
            </div>

            {/* Vision + Mission — bento grid */}
            <div className="grid md:grid-cols-5 gap-6 mb-16">
              {/* Vision — katta */}
              <div className="md:col-span-3 bg-card rounded-2xl p-8 shadow-warm-lg hover:shadow-warm-xl transition-all duration-300 group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center mb-5">
                    <Icon name="EyeIcon" size={28} className="text-primary-foreground" />
                  </div>
                  <h3 className="text-2xl font-heading font-bold mb-3">{t('landing.visionTitle')}</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">{t('landing.visionDesc')}</p>
                  <p className="text-muted-foreground mt-3">{t('landing.aboutDesc2')}</p>
                </div>
              </div>

              {/* Mission — kichik */}
              <div className="md:col-span-2 bg-gradient-to-br from-secondary to-primary text-primary-foreground rounded-2xl p-8 shadow-warm-lg hover:shadow-warm-xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center mb-5">
                    <Icon name="FlagIcon" size={28} />
                  </div>
                  <h3 className="text-2xl font-heading font-bold mb-3">{t('landing.missionTitle')}</h3>
                  <p className="opacity-90 text-lg leading-relaxed">{t('landing.missionDesc')}</p>
                </div>
                <div className="flex items-center gap-3 mt-6 pt-5 border-t border-white/20 relative z-10">
                  <div className="text-center">
                    <div className="text-2xl font-heading font-bold">{stats.totalCourses}+</div>
                    <div className="text-xs opacity-70">{t('landing.statCourses')}</div>
                  </div>
                  <div className="w-px h-10 bg-white/20" />
                  <div className="text-center">
                    <div className="text-2xl font-heading font-bold">{stats.activeStudents}+</div>
                    <div className="text-xs opacity-70">{t('landing.statStudents')}</div>
                  </div>
                  <div className="w-px h-10 bg-white/20" />
                  <div className="text-center">
                    <div className="text-2xl font-heading font-bold">{stats.successfulTeachers}+</div>
                    <div className="text-xs opacity-70">{t('landing.statTeachers')}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Values — horizontal scroll on mobile, grid on desktop */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
              {[
                { title: t('landing.valQuality'), desc: t('landing.valQualityDesc'), icon: 'ShieldCheckIcon', color: 'from-primary to-primary/80' },
                { title: t('landing.valConvenience'), desc: t('landing.valConvenienceDesc'), icon: 'ClockIcon', color: 'from-secondary to-secondary/80' },
                { title: t('landing.valCommunity'), desc: t('landing.valCommunityDesc'), icon: 'HeartIcon', color: 'from-accent to-accent/80' },
                { title: t('landing.valInnovation'), desc: t('landing.valInnovationDesc'), icon: 'LightBulbIcon', color: 'from-success to-success/80' },
              ].map((v, i) => (
                <div key={i} className="bg-card rounded-2xl p-6 shadow-warm hover:shadow-warm-lg hover:-translate-y-2 transition-all duration-300 group">
                  <div className={`w-12 h-12 bg-gradient-to-br ${v.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon name={v.icon} size={24} className="text-white" />
                  </div>
                  <h3 className="font-heading font-bold text-lg mb-2">{v.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>

            {/* Contact — split design */}
            <div className="grid md:grid-cols-2 gap-0 rounded-2xl overflow-hidden shadow-warm-xl">
              {/* Left — gradient with text */}
              <div className="bg-gradient-to-br from-primary to-secondary text-primary-foreground p-8 md:p-12 flex flex-col justify-center">
                <h2 className="text-3xl font-heading font-bold mb-4">{t('landing.contactTitle')}</h2>
                <p className="opacity-90 mb-8 leading-relaxed">
                  {t('landing.aboutDesc1')}
                </p>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center w-fit px-8 py-4 bg-accent text-accent-foreground rounded-xl font-medium hover:scale-105 transition-smooth shadow-warm-lg"
                >
                  <Icon name="AcademicCapIcon" size={22} className="mr-2" />
                  {t('landing.startFree')}
                </Link>
              </div>
              {/* Right — contact cards */}
              <div className="bg-card p-8 md:p-12 flex flex-col justify-center">
                <div className="space-y-6">
                  {[
                    { icon: 'EnvelopeIcon', label: t('landing.contactEmail'), value: 'info@ustoz-talim.uz', color: 'bg-primary' },
                    { icon: 'PhoneIcon', label: t('landing.contactPhone'), value: '+998 90 123 45 67', color: 'bg-secondary' },
                    { icon: 'MapPinIcon', label: t('landing.contactAddress'), value: t('landing.contactCity'), color: 'bg-accent' },
                  ].map((c, i) => (
                    <div key={i} className="flex items-center gap-4 group">
                      <div className={`w-12 h-12 ${c.color} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon name={c.icon} size={22} className="text-primary-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">{c.label}</p>
                        <p className="font-medium text-foreground">{c.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ═══ FOOTER ═══ */}
        <footer className="bg-card py-12 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" className="text-primary-foreground" />
                      <path d="M2 17L12 22L22 17" stroke="currentColor" className="text-primary-foreground" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M2 12L12 17L22 12" stroke="currentColor" className="text-primary-foreground" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-xl font-heading font-bold">Ustoz</span>
                </div>
                <p className="text-sm text-muted-foreground">{t('landing.footerDesc')}</p>
              </div>
              <div>
                <h4 className="font-heading font-bold mb-4">{t('landing.footerPlatform')}</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/landing-page" className="text-muted-foreground hover:text-primary transition-smooth">{t('landing.footerHome')}</Link></li>
                  <li><a href="#courses" className="text-muted-foreground hover:text-primary transition-smooth">{t('landing.footerCourses')}</a></li>
                  <li><a href="#about" className="text-muted-foreground hover:text-primary transition-smooth">{t('landing.footerAbout')}</a></li>
                  <li><Link href="/login" className="text-muted-foreground hover:text-primary transition-smooth">{t('landing.footerLogin')}</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-heading font-bold mb-4">{t('landing.footerTeachers')}</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/register?role=teacher" className="text-muted-foreground hover:text-primary transition-smooth">{t('landing.footerBecomeTeacher')}</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-heading font-bold mb-4">{t('landing.footerContact')}</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center"><Icon name="EnvelopeIcon" size={16} className="mr-2" /> info@ustoz-talim.uz</li>
                  <li className="flex items-center"><Icon name="PhoneIcon" size={16} className="mr-2" /> +998 90 123 45 67</li>
                  <li className="flex items-center"><Icon name="MapPinIcon" size={16} className="mr-2" /> {t('landing.contactCity')}</li>
                </ul>
              </div>
            </div>
            <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
              <p>&copy; 2026 Ustoz. {t('landing.footerRights')}</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default LandingPageInteractive;
