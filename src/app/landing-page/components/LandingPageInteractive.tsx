'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { optimizeImageUrl } from '@/lib/imageUrl';
import AppImage from '@/components/ui/AppImage';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import GirihEmblem from './GirihEmblem';
import ThemeToggle from '@/components/common/ThemeToggle';
import BrandMark from '@/components/common/BrandMark';

// ═══ Palitra ═══
// Landing o'zining barqaror "qog'oz + siyoh" palitrasiga ega — app'ning light/dark
// tokenlariga bog'lanmaydi (marketing sahifa izchil brend ko'rinishi uchun).
// Semantik brend o'zgaruvchilari (tailwind.css :root / .dark) — light/dark toggle'ga
// to'liq javob beradi. Band = doim qorong'i seksiya; page/surface/text = temaga qarab.
const INK = 'var(--brand-band)'; // qorong'i band — hero/how-it-works/CTA
const INK_DEEP = 'var(--brand-band-deep)'; // eng chuqur — footer/stats
const PAPER = 'var(--brand-page)'; // sahifa foni
const PAPER_CARD = 'var(--brand-surface)'; // karta yuzasi
const GOLD = 'var(--brand-gold)'; // za'faron oltin — band ustida urg'u
const GOLD_ICON = 'var(--brand-gold-on-surface)'; // qog'oz/surface ustidagi oltin (AA)
const BRICK = 'var(--brand-brick)'; // g'isht/madder — kam urg'u
const MALACHITE = 'var(--brand-malachite)'; // malaxit — sertifikat/muvaffaqiyat
const INK_TEXT = 'var(--brand-text)'; // asosiy matn (surface ustida)
const MUTE = 'var(--brand-text-mute)'; // ikkilamchi matn
const LINE = 'var(--brand-line)'; // ipdek chegara
const TRACK = 'var(--brand-track)'; // progress/skeleton fon

const DISPLAY = { fontFamily: 'var(--font-display)' } as const;

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

function fmt(n: number): string {
  return n.toLocaleString('en-US').replace(/,/g, ' ');
}

// ─── In-view trigger (counter/progress uchun) ───
function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setSeen(true); },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [seen, threshold]);
  return { ref, seen };
}

function useCountUp(target: number, duration = 1400, active = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active || target === 0) { setCount(active ? target : 0); return; }
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

// ─── Landing header (shaffof → scroll'da siyoh) ───
function LandingHeader() {
  const { t, locale, setLocale } = useI18n();
  const [solid, setSolid] = useState(false);
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const langs = ['uz', 'ru', 'en'] as const;

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: solid ? 'rgba(14, 19, 48, 0.92)' : 'transparent',
        backdropFilter: solid ? 'saturate(140%) blur(10px)' : 'none',
        borderBottom: solid ? `1px solid rgba(223,162,58,0.18)` : '1px solid transparent',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <BrandMark size={36} shadow />
            <span className="text-xl font-semibold tracking-tight" style={{ ...DISPLAY, color: '#F7F1E4' }}>
              Ustoz
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle tone="onDark" />
            {/* Til tanlagich */}
            <div className="hidden sm:flex items-center rounded-full p-0.5" style={{ background: 'rgba(247,241,228,0.10)' }}>
              {langs.map((l) => (
                <button
                  key={l}
                  onClick={() => setLocale(l)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-full transition-colors"
                  style={locale === l
                    ? { background: GOLD, color: INK }
                    : { color: 'rgba(247,241,228,0.65)' }}
                  aria-pressed={locale === l}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>

            <Link
              href="/login"
              className="hidden sm:inline-flex px-4 py-2 text-sm font-medium rounded-md transition-colors"
              style={{ color: '#F7F1E4' }}
            >
              {t('auth.login')}
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-md transition-transform hover:-translate-y-0.5"
              style={{ background: GOLD, color: INK }}
            >
              {t('auth.register')}
            </Link>

            <button
              onClick={() => setMenu(!menu)}
              className="sm:hidden p-2 rounded-md"
              style={{ color: '#F7F1E4' }}
              aria-label="Menu"
            >
              <Icon name={menu ? 'XMarkIcon' : 'Bars3Icon'} size={22} />
            </button>
          </div>
        </div>

        {menu && (
          <div className="sm:hidden pb-4 flex items-center gap-3">
            <div className="flex items-center rounded-full p-0.5" style={{ background: 'rgba(247,241,228,0.10)' }}>
              {langs.map((l) => (
                <button
                  key={l}
                  onClick={() => setLocale(l)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-full"
                  style={locale === l ? { background: GOLD, color: INK } : { color: 'rgba(247,241,228,0.65)' }}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <Link href="/login" className="px-3 py-1.5 text-sm rounded-md" style={{ color: '#F7F1E4' }}>
              {t('auth.login')}
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

// ─── Bo'lim sarlavhasi (qog'oz fonda) ───
function SectionHead({ eyebrow, title, desc }: { eyebrow?: string; title: string; desc?: string }) {
  return (
    <div className="mb-12 max-w-2xl">
      {eyebrow && (
        <div className="flex items-center gap-3 mb-4">
          <span className="h-px w-8" style={{ background: GOLD }} />
          <span className="text-sm font-semibold" style={{ color: BRICK }}>{eyebrow}</span>
        </div>
      )}
      <h2 className="text-3xl md:text-[2.6rem] leading-[1.08] font-medium" style={{ ...DISPLAY, color: INK_TEXT }}>
        {title}
      </h2>
      {desc && <p className="mt-4 text-lg leading-relaxed" style={{ color: MUTE }}>{desc}</p>}
    </div>
  );
}

// ─── FAQ ───
function FaqItem({ q, a, isOpen, onToggle }: { q: string; a: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div style={{ borderBottom: `1px solid ${LINE}` }}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 py-5 text-left"
        aria-expanded={isOpen}
      >
        <span className="text-lg font-medium" style={{ color: INK_TEXT }}>{q}</span>
        <span
          className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full transition-transform duration-300"
          style={{ border: `1px solid ${LINE}`, transform: isOpen ? 'rotate(45deg)' : 'none', color: GOLD }}
        >
          <Icon name="PlusIcon" size={16} />
        </span>
      </button>
      <div
        className="grid transition-all duration-300"
        style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <p className="pb-6 pr-12 leading-relaxed" style={{ color: MUTE }}>{a}</p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
const LandingPageInteractive = () => {
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      const role = user.role;
      if (role === 'admin') router.replace('/admin-dashboard');
      else if (role === 'teacher') router.replace('/teacher-dashboard');
      else router.replace('/student-dashboard');
    }
  }, [user, authLoading, router]);

  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ totalCourses: 0, activeStudents: 0, successfulTeachers: 0, certificatesAwarded: 0 });
  const [popularCourses, setPopularCourses] = useState<PopularCourse[]>([]);
  const [featuredTeachers, setFeaturedTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

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

  const statsView = useInView();
  const worksView = useInView();
  const c1 = useCountUp(stats.totalCourses, 1400, statsView.seen);
  const c2 = useCountUp(stats.activeStudents, 1400, statsView.seen);
  const c3 = useCountUp(stats.successfulTeachers, 1400, statsView.seen);
  const c4 = useCountUp(stats.certificatesAwarded, 1400, statsView.seen);

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
              coverImage: optimizeImageUrl(String(c.coverImage || ''), 500) || '/assets/images/no_image.png',
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

  const statLine = [
    { v: stats.totalCourses, label: t('landing.statCourses') },
    { v: stats.successfulTeachers, label: t('landing.statTeachers') },
    { v: stats.activeStudents, label: t('landing.statStudents') },
  ].filter((s) => s.v > 0);

  return (
    <div style={{ background: PAPER, color: INK_TEXT }} className="min-h-screen font-sans">
      <LandingHeader />

      <main>
        {/* ═══ HERO ═══ */}
        <section className="relative overflow-hidden" style={{ background: INK }}>
          {/* nozik radial nur */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(120% 80% at 78% 30%, rgba(223,162,58,0.16), transparent 60%)' }}
          />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 md:pt-36 pb-16 md:pb-24 relative">
            <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-16 items-center">
              {/* Chap — matn */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <span className="h-px w-10" style={{ background: GOLD }} />
                  <span className="text-sm font-medium" style={{ color: GOLD }}>{t('landing.since')}</span>
                </div>

                <h1
                  className="font-medium leading-[1.02] tracking-[-0.01em]"
                  style={{ ...DISPLAY, color: '#F7F1E4', fontSize: 'clamp(2.6rem, 6vw, 4.6rem)' }}
                >
                  {t('landing.heroTitle')}
                </h1>

                <p className="mt-6 text-lg md:text-xl leading-relaxed max-w-xl" style={{ color: 'rgba(247,241,228,0.72)' }}>
                  {t('landing.heroDesc')}
                </p>

                {/* Qidiruv */}
                <form onSubmit={handleSearch} className="mt-8 max-w-xl" role="search">
                  <div
                    className="flex items-center rounded-xl overflow-hidden"
                    style={{ background: 'rgba(247,241,228,0.07)', border: '1px solid rgba(247,241,228,0.16)' }}
                  >
                    <Icon name="MagnifyingGlassIcon" size={20} className="ml-4" style={{ color: 'rgba(247,241,228,0.5)' }} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('landing.searchPlaceholder')}
                      aria-label={t('landing.searchPlaceholder')}
                      className="flex-1 bg-transparent px-3 py-4 outline-none text-base"
                      style={{ color: '#F7F1E4' }}
                    />
                    <button
                      type="submit"
                      className="m-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold flex-shrink-0 transition-transform hover:-translate-y-0.5"
                      style={{ background: GOLD, color: INK }}
                    >
                      {t('common.search')}
                    </button>
                  </div>
                </form>

                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg font-semibold transition-transform hover:-translate-y-0.5"
                    style={{ background: '#F7F1E4', color: INK }}
                  >
                    {t('landing.startFree')}
                    <Icon name="ArrowRightIcon" size={18} />
                  </Link>
                  <a
                    href="#courses"
                    className="inline-flex items-center justify-center px-7 py-3.5 rounded-lg font-medium transition-colors"
                    style={{ color: '#F7F1E4', border: '1px solid rgba(247,241,228,0.24)' }}
                  >
                    {t('landing.viewCourses')}
                  </a>
                </div>

                {/* Stat qatori */}
                {statLine.length > 0 && (
                  <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3">
                    {statLine.map((s, i) => (
                      <div key={i} className="flex items-baseline gap-2">
                        <span className="text-2xl font-semibold" style={{ ...DISPLAY, color: GOLD }}>{fmt(s.v)}+</span>
                        <span className="text-sm" style={{ color: 'rgba(247,241,228,0.6)' }}>{s.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* O'ng — girih emblema */}
              <div className="relative hidden lg:flex items-center justify-center">
                <div className="w-full max-w-[460px] aspect-square">
                  <GirihEmblem className="w-full h-full" />
                </div>
              </div>
            </div>
          </div>

          {/* pastki qog'oz burchagi */}
          <svg className="block w-full" viewBox="0 0 1440 48" preserveAspectRatio="none" style={{ height: 40 }}>
            <path d="M0 48 L1440 48 L1440 0 C1080 40 360 40 0 0 Z" style={{ fill: PAPER }} />
          </svg>
        </section>

        {/* ═══ KATEGORIYALAR ═══ */}
        <section className="py-14 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
              <h2 className="text-2xl md:text-3xl font-medium" style={{ ...DISPLAY, color: INK_TEXT }}>
                {t('landing.categoriesTitle')}
              </h2>
              <Link href="/course-marketplace" className="text-sm font-semibold inline-flex items-center gap-1.5" style={{ color: BRICK }}>
                {t('landing.viewAllCourses')} <Icon name="ArrowRightIcon" size={15} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.key}
                  href={`/course-marketplace?category=${cat.key}`}
                  className="group flex items-center gap-3 px-4 py-4 rounded-xl transition-all"
                  style={{ background: PAPER_CARD, border: `1px solid ${LINE}` }}
                >
                  <span
                    className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0 transition-colors"
                    style={{ background: 'rgba(223,162,58,0.14)', color: GOLD_ICON }}
                  >
                    <Icon name={cat.icon} size={18} />
                  </span>
                  <span className="text-sm font-medium truncate" style={{ color: INK_TEXT }}>{cat.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ MASHHUR KURSLAR ═══ */}
        <section id="courses" className="py-14 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHead
              eyebrow={t('landing.popularCoursesTitle')}
              title={t('landing.popularCoursesDesc')}
            />
            {loading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="rounded-2xl animate-pulse" style={{ background: PAPER_CARD, border: `1px solid ${LINE}` }}>
                    <div className="h-44 rounded-t-2xl" style={{ background: TRACK }} />
                    <div className="p-5 space-y-3">
                      <div className="h-5 rounded w-3/4" style={{ background: TRACK }} />
                      <div className="h-4 rounded w-1/2" style={{ background: TRACK }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : popularCourses.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {popularCourses.map((course) => (
                  <Link
                    key={course.id}
                    href={`/course-details?courseId=${course.id}`}
                    className="group rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
                    style={{ background: PAPER_CARD, border: `1px solid ${LINE}` }}
                  >
                    <div className="relative h-44 overflow-hidden" style={{ background: TRACK }}>
                      <AppImage
                        src={course.coverImage}
                        alt={course.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {course.price === 0 && (
                        <span
                          className="absolute top-3 left-3 px-2.5 py-1 text-xs font-bold rounded-md"
                          style={{ background: MALACHITE, color: '#fff' }}
                        >
                          {t('landing.free')}
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-semibold leading-snug mb-2 line-clamp-2" style={{ color: INK_TEXT }}>
                        {course.title}
                      </h3>
                      <p className="text-sm mb-4" style={{ color: MUTE }}>
                        {t('landing.instructor')}: {course.instructor}
                      </p>
                      <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${LINE}` }}>
                        <div className="flex items-center gap-1.5 text-sm">
                          <Icon name="StarIcon" size={16} style={{ color: GOLD }} variant="solid" />
                          <span className="font-semibold" style={{ color: INK_TEXT }}>{course.rating.toFixed(1)}</span>
                          <span style={{ color: MUTE }}>({course.enrollmentCount})</span>
                        </div>
                        <div className="font-semibold" style={{ color: course.price === 0 ? MALACHITE : INK_TEXT }}>
                          {course.price === 0 ? t('landing.free') : `${fmt(course.price)} so'm`}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 rounded-2xl" style={{ border: `1px dashed ${LINE}` }}>
                <Icon name="BookOpenIcon" size={40} className="mx-auto mb-3" style={{ color: MUTE }} />
                <p style={{ color: MUTE }}>{t('landing.noCourses')}</p>
              </div>
            )}
          </div>
        </section>

        {/* ═══ QANDAY ISHLAYDI (ketma-ketlik) ═══ */}
        <section className="py-16 md:py-24" style={{ background: INK }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-14">
              <h2 className="text-3xl md:text-[2.6rem] leading-[1.08] font-medium" style={{ ...DISPLAY, color: '#F7F1E4' }}>
                {t('landing.howItWorksTitle')}
              </h2>
              <p className="mt-4 text-lg" style={{ color: 'rgba(247,241,228,0.66)' }}>{t('landing.howItWorksDesc')}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-px" style={{ background: 'rgba(247,241,228,0.12)' }}>
              {[
                { n: '01', title: t('landing.step1Title'), desc: t('landing.step1Desc') },
                { n: '02', title: t('landing.step2Title'), desc: t('landing.step2Desc') },
                { n: '03', title: t('landing.step3Title'), desc: t('landing.step3Desc') },
              ].map((item) => (
                <div key={item.n} className="p-8 md:p-10" style={{ background: INK }}>
                  <div className="text-5xl font-medium mb-6" style={{ ...DISPLAY, color: GOLD }}>{item.n}</div>
                  <h3 className="text-xl font-semibold mb-3" style={{ color: '#F7F1E4' }}>{item.title}</h3>
                  <p className="leading-relaxed" style={{ color: 'rgba(247,241,228,0.62)' }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ USTOZLAR ═══ */}
        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHead
              eyebrow={t('landing.featuredTeachersTitle')}
              title={t('landing.featuredTeachersDesc')}
            />
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredTeachers.map((teacher) => (
                <div key={teacher.id} className="rounded-2xl p-6" style={{ background: PAPER_CARD, border: `1px solid ${LINE}` }}>
                  <div className="flex items-center gap-4 mb-5">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
                      style={{ background: INK }}
                    >
                      {teacher.avatarUrl ? (
                        <AppImage src={teacher.avatarUrl} alt={teacher.fullName} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-lg font-semibold" style={{ ...DISPLAY, color: GOLD }}>
                          {teacher.fullName.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate" style={{ color: INK_TEXT }}>{teacher.fullName}</h3>
                      <p className="text-sm truncate" style={{ color: BRICK }}>{t('landing.instructor')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-5 text-sm pt-4" style={{ borderTop: `1px solid ${LINE}`, color: MUTE }}>
                    <span className="flex items-center gap-1.5">
                      <Icon name="BookOpenIcon" size={15} /> {teacher.courseCount} {t('landing.course')}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Icon name="UserGroupIcon" size={15} /> {fmt(teacher.studentCount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ RAQAMLARDA ═══ (barcha qiymat 0 bo'lsa ko'rsatilmaydi) */}
        {(stats.totalCourses + stats.activeStudents + stats.successfulTeachers + stats.certificatesAwarded) > 0 && (
        <section ref={statsView.ref} className="py-16 md:py-20" style={{ background: INK_DEEP }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { v: c1, label: t('landing.totalCourses') },
                { v: c2, label: t('landing.activeStudents') },
                { v: c3, label: t('landing.teachers') },
                { v: c4, label: t('landing.certificates') },
              ].map((s, i) => (
                <div key={i} className="text-center md:text-left">
                  <div className="text-4xl md:text-5xl font-medium" style={{ ...DISPLAY, color: GOLD }}>
                    {fmt(s.v)}<span style={{ color: 'rgba(247,241,228,0.4)' }}>+</span>
                  </div>
                  <div className="mt-2 text-sm" style={{ color: 'rgba(247,241,228,0.6)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
        )}

        {/* ═══ TALABALAR NATIJALARI ═══ */}
        <section ref={worksView.ref} className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHead eyebrow={t('landing.studentWorksTitle')} title={t('landing.studentWorksDesc')} />
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { name: 'Dilshod Nazarov', course: 'Python Dasturlash', progress: 100, cert: true },
                { name: 'Madina Umarova', course: 'Web Development', progress: 100, cert: true },
                { name: 'Bekzod Tursunov', course: 'Data Science', progress: 85, cert: false },
                { name: 'Zarina Karimova', course: 'UI/UX Dizayn', progress: 100, cert: true },
              ].map((s, i) => (
                <div key={i} className="rounded-2xl p-6" style={{ background: PAPER_CARD, border: `1px solid ${LINE}` }}>
                  <h4 className="font-semibold" style={{ color: INK_TEXT }}>{s.name}</h4>
                  <p className="text-sm mb-5" style={{ color: MUTE }}>{s.course}</p>
                  <div className="flex justify-between text-xs mb-1.5" style={{ color: MUTE }}>
                    <span>{t('landing.workProgress')}</span>
                    <span className="font-semibold" style={{ color: INK_TEXT }}>{s.progress}%</span>
                  </div>
                  <div className="w-full rounded-full h-1.5 mb-4" style={{ background: TRACK }}>
                    <div
                      className="h-1.5 rounded-full transition-all ease-out"
                      style={{ width: worksView.seen ? `${s.progress}%` : '0%', transitionDuration: '1200ms', background: s.cert ? MALACHITE : GOLD }}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium" style={{ color: s.cert ? MALACHITE : GOLD_ICON }}>
                    <Icon name={s.cert ? 'CheckBadgeIcon' : 'ArrowTrendingUpIcon'} size={16} variant={s.cert ? 'solid' : 'outline'} />
                    {s.cert ? t('landing.workCertEarned') : `${s.progress}% ${t('landing.workProgress')}`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ FIKRLAR ═══ */}
        <section className="py-16 md:py-24" style={{ background: PAPER_CARD }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHead eyebrow={t('landing.testimonialsTitle')} title={t('landing.testimonialsDesc')} />
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { name: t('landing.testimonial1Name'), role: t('landing.testimonial1Role'), text: t('landing.testimonial1') },
                { name: t('landing.testimonial2Name'), role: t('landing.testimonial2Role'), text: t('landing.testimonial2') },
                { name: t('landing.testimonial3Name'), role: t('landing.testimonial3Role'), text: t('landing.testimonial3') },
              ].map((item, i) => (
                <figure key={i} className="rounded-2xl p-7 flex flex-col" style={{ background: PAPER, border: `1px solid ${LINE}` }}>
                  <div className="text-5xl leading-none mb-3" style={{ ...DISPLAY, color: GOLD }}>&ldquo;</div>
                  <blockquote className="flex-1 text-[1.05rem] leading-relaxed italic" style={{ ...DISPLAY, color: INK_TEXT }}>
                    {item.text}
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-3 pt-5" style={{ borderTop: `1px solid ${LINE}` }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: INK }}>
                      <span className="text-sm font-semibold" style={{ color: GOLD }}>{item.name.charAt(0)}</span>
                    </div>
                    <div>
                      <div className="font-semibold text-sm" style={{ color: INK_TEXT }}>{item.name}</div>
                      <div className="text-xs" style={{ color: MUTE }}>{item.role}</div>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ HAMKORLAR ═══ */}
        <section className="py-14 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm font-medium mb-8" style={{ color: MUTE }}>{t('landing.partnersDesc')}</p>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-x-6 gap-y-8 items-center">
              {["O'zMU", 'TATU', 'TDIU', 'TDPU', 'TSTU', 'SamDU'].map((p, i) => (
                <div key={i} className="text-center text-lg font-semibold tracking-wide" style={{ ...DISPLAY, color: MUTE }}>
                  {p}
                </div>
              ))}
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 pt-8" style={{ borderTop: `1px solid ${LINE}` }}>
              {[
                { icon: 'ShieldCheckIcon', text: t('landing.trustDataProtection') },
                { icon: 'LockClosedIcon', text: t('landing.trustSecurePayment') },
                { icon: 'CheckBadgeIcon', text: t('landing.trustQualityGuarantee') },
              ].map((b, i) => (
                <div key={i} className="flex items-center gap-2 text-sm" style={{ color: MUTE }}>
                  <Icon name={b.icon} size={17} style={{ color: MALACHITE }} />
                  {b.text}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ FAQ ═══ */}
        <section className="py-16 md:py-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHead eyebrow={t('landing.faqTitle')} title={t('landing.faqDesc')} />
            <div>
              {FAQ_DATA.map((faq, i) => (
                <FaqItem key={i} q={faq.q} a={faq.a} isOpen={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? null : i)} />
              ))}
            </div>
          </div>
        </section>

        {/* ═══ BIZ HAQIMIZDA ═══ */}
        <section id="about" className="py-16 md:py-24" style={{ background: PAPER_CARD }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center mb-16">
              <div>
                <SectionHead eyebrow={t('landing.aboutTitle')} title={t('landing.visionDesc')} desc={t('landing.aboutDesc1')} />
                <p className="leading-relaxed" style={{ color: MUTE }}>{t('landing.aboutDesc2')}</p>
              </div>
              <div className="rounded-2xl p-8 md:p-10 relative overflow-hidden" style={{ background: INK }}>
                <div className="absolute -right-16 -bottom-16 w-64 h-64 opacity-[0.13]">
                  <GirihEmblem className="w-full h-full" />
                </div>
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: 'rgba(223,162,58,0.16)' }}>
                    <Icon name="FlagIcon" size={22} style={{ color: GOLD }} />
                  </div>
                  <h3 className="text-2xl font-medium mb-3" style={{ ...DISPLAY, color: '#F7F1E4' }}>{t('landing.missionTitle')}</h3>
                  <p className="text-lg leading-relaxed" style={{ color: 'rgba(247,241,228,0.72)' }}>{t('landing.missionDesc')}</p>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { title: t('landing.valQuality'), desc: t('landing.valQualityDesc'), icon: 'ShieldCheckIcon' },
                { title: t('landing.valConvenience'), desc: t('landing.valConvenienceDesc'), icon: 'ClockIcon' },
                { title: t('landing.valCommunity'), desc: t('landing.valCommunityDesc'), icon: 'HeartIcon' },
                { title: t('landing.valInnovation'), desc: t('landing.valInnovationDesc'), icon: 'LightBulbIcon' },
              ].map((v, i) => (
                <div key={i} className="p-6 rounded-2xl" style={{ background: PAPER, border: `1px solid ${LINE}` }}>
                  <Icon name={v.icon} size={22} style={{ color: GOLD_ICON }} className="mb-4" />
                  <h3 className="font-semibold text-lg mb-2" style={{ color: INK_TEXT }}>{v.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: MUTE }}>{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ CTA ═══ */}
        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-3xl overflow-hidden px-6 py-14 md:px-16 md:py-20 text-center" style={{ background: INK }}>
              <div className="absolute -left-24 -top-24 w-80 h-80 opacity-[0.14]">
                <GirihEmblem className="w-full h-full" />
              </div>
              <div className="absolute -right-24 -bottom-24 w-80 h-80 opacity-[0.14]">
                <GirihEmblem className="w-full h-full" />
              </div>
              <div className="relative max-w-2xl mx-auto">
                <h2 className="text-3xl md:text-5xl font-medium leading-tight mb-5" style={{ ...DISPLAY, color: '#F7F1E4' }}>
                  {t('landing.ctaTitle')}
                </h2>
                <p className="text-lg mb-9" style={{ color: 'rgba(247,241,228,0.7)' }}>{t('landing.ctaDesc')}</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href="/register?role=student"
                    className="inline-flex items-center justify-center px-7 py-3.5 rounded-lg font-semibold transition-transform hover:-translate-y-0.5"
                    style={{ background: GOLD, color: INK }}
                  >
                    {t('landing.ctaStudent')}
                  </Link>
                  <Link
                    href="/register?role=teacher"
                    className="inline-flex items-center justify-center px-7 py-3.5 rounded-lg font-medium transition-colors"
                    style={{ color: '#F7F1E4', border: '1px solid rgba(247,241,228,0.28)' }}
                  >
                    {t('landing.ctaTeacher')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ FOOTER ═══ */}
        <footer className="pt-16 pb-10" style={{ background: INK_DEEP }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-10 mb-12">
              <div className="md:col-span-1">
                <div className="flex items-center gap-2.5 mb-4">
                  <BrandMark size={36} />
                  <span className="text-xl font-semibold" style={{ ...DISPLAY, color: '#F7F1E4' }}>Ustoz</span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(247,241,228,0.55)' }}>{t('landing.footerDesc')}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-4 text-sm" style={{ color: '#F7F1E4' }}>{t('landing.footerPlatform')}</h4>
                <ul className="space-y-2.5 text-sm" style={{ color: 'rgba(247,241,228,0.6)' }}>
                  <li><Link href="/" className="hover:text-white transition-colors">{t('landing.footerHome')}</Link></li>
                  <li><a href="#courses" className="hover:text-white transition-colors">{t('landing.footerCourses')}</a></li>
                  <li><a href="#about" className="hover:text-white transition-colors">{t('landing.footerAbout')}</a></li>
                  <li><Link href="/login" className="hover:text-white transition-colors">{t('landing.footerLogin')}</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4 text-sm" style={{ color: '#F7F1E4' }}>{t('landing.footerTeachers')}</h4>
                <ul className="space-y-2.5 text-sm" style={{ color: 'rgba(247,241,228,0.6)' }}>
                  <li><Link href="/register?role=teacher" className="hover:text-white transition-colors">{t('landing.footerBecomeTeacher')}</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4 text-sm" style={{ color: '#F7F1E4' }}>{t('landing.footerContact')}</h4>
                <ul className="space-y-2.5 text-sm" style={{ color: 'rgba(247,241,228,0.6)' }}>
                  <li className="flex items-center gap-2"><Icon name="EnvelopeIcon" size={15} /> info@ustoz-talim.uz</li>
                  <li className="flex items-center gap-2"><Icon name="PhoneIcon" size={15} /> +998 90 123 45 67</li>
                  <li className="flex items-center gap-2"><Icon name="MapPinIcon" size={15} /> {t('landing.contactCity')}</li>
                </ul>
              </div>
            </div>
            <div className="pt-8 text-center text-sm" style={{ borderTop: '1px solid rgba(247,241,228,0.12)', color: 'rgba(247,241,228,0.45)' }}>
              &copy; 2026 Ustoz. {t('landing.footerRights')}
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default LandingPageInteractive;
