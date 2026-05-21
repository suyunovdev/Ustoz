// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import RoleBasedHeader from '@/components/common/RoleBasedHeader';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PopularCourse {
  id: string;
  title: string;
  instructor: string;
  coverImage: string;
  rating: number;
  enrollmentCount: number;
  price: number;
}

const LandingPageInteractive = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalCourses: 0,
    activeStudents: 0,
    successfulTeachers: 0,
    certificatesAwarded: 0,
  });
  const [popularCourses, setPopularCourses] = useState<PopularCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      if (!supabase) return;

      try {
        // Fetch platform statistics
        const { data: coursesData } = await supabase
          .from('courses')
          .select('id', { count: 'exact' });
        
        const { data: studentsData } = await supabase
          .from('user_profiles')
          .select('id', { count: 'exact' })
          .eq('role', 'student');
        
        const { data: teachersData } = await supabase
          .from('user_profiles')
          .select('id', { count: 'exact' })
          .eq('role', 'teacher');

        setStats({
          totalCourses: coursesData?.length || 156,
          activeStudents: studentsData?.length || 2840,
          successfulTeachers: teachersData?.length || 89,
          certificatesAwarded: 1250,
        });

        // Fetch popular courses
        const { data: courses } = await supabase
          .from('courses')
          .select('id, title, cover_image, price_uzs, teacher_id, user_profiles!teacher_id(full_name)')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(3);

        if (courses) {
          setPopularCourses(
            courses.map((course) => ({
              id: course.id,
              title: course.title,
              instructor: (course.user_profiles as any)?.full_name || 'Ustoz',
              coverImage: course.cover_image || '/assets/images/no_image.png',
              rating: 4.8,
              enrollmentCount: 245,
              price: course.price_uzs || 0,
            }))
          );
        }
      } catch (error) {
        console.error('Error fetching landing page data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <RoleBasedHeader userRole={null} currentPath="/landing-page" />
      
      <main className="pt-16">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary to-secondary text-primary-foreground py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">
                  Bilim Olish va O'rgatish Uchun Zamonaviy Platforma
                </h1>
                <p className="text-lg md:text-xl mb-8 opacity-90">
                  Ustoz platformasi orqali o'qituvchilar sifatli kurslar yaratadi, o'quvchilar esa professional bilimlar oladi. Bugun qo'shiling va ta'lim olamida yangi imkoniyatlarni kashf eting!
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center px-8 py-4 bg-accent text-accent-foreground rounded-md font-medium hover:opacity-90 transition-smooth shadow-warm-lg"
                  >
                    <Icon name="AcademicCapIcon" size={24} className="mr-2" />
                    Ro'yxatdan O'tish
                  </Link>
                  <Link
                    href="/course-marketplace"
                    className="inline-flex items-center justify-center px-8 py-4 bg-primary-foreground text-primary rounded-md font-medium hover:opacity-90 transition-smooth"
                  >
                    Kurslarni Ko'rish
                  </Link>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="bg-primary-foreground rounded-md p-8 shadow-warm-2xl">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center w-16 h-16 bg-primary rounded-md mb-3 mx-auto">
                        <Icon name="BookOpenIcon" size={32} className="text-primary-foreground" variant="solid" />
                      </div>
                      <div className="text-3xl font-heading font-bold text-primary">{stats.totalCourses}+</div>
                      <div className="text-sm text-muted-foreground">Kurslar</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center w-16 h-16 bg-secondary rounded-md mb-3 mx-auto">
                        <Icon name="UserGroupIcon" size={32} className="text-primary-foreground" variant="solid" />
                      </div>
                      <div className="text-3xl font-heading font-bold text-secondary">{stats.activeStudents}+</div>
                      <div className="text-sm text-muted-foreground">O'quvchilar</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center w-16 h-16 bg-accent rounded-md mb-3 mx-auto">
                        <Icon name="UserIcon" size={32} className="text-accent-foreground" variant="solid" />
                      </div>
                      <div className="text-3xl font-heading font-bold text-accent-foreground">{stats.successfulTeachers}+</div>
                      <div className="text-sm text-muted-foreground">O'qituvchilar</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center w-16 h-16 bg-success rounded-md mb-3 mx-auto">
                        <Icon name="TrophyIcon" size={32} className="text-success-foreground" variant="solid" />
                      </div>
                      <div className="text-3xl font-heading font-bold text-success">{stats.certificatesAwarded}+</div>
                      <div className="text-sm text-muted-foreground">Sertifikatlar</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Platformaning Asosiy Imkoniyatlari</h2>
              <p className="text-lg text-muted-foreground">O'qituvchilar va o'quvchilar uchun maxsus funksiyalar</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-16">
              {/* Teacher Features */}
              <div className="bg-card rounded-md p-8 shadow-warm-lg">
                <div className="flex items-center justify-center w-16 h-16 bg-primary rounded-md mb-6">
                  <Icon name="AcademicCapIcon" size={32} className="text-primary-foreground" variant="solid" />
                </div>
                <h3 className="text-2xl font-heading font-bold mb-4">O'qituvchilar Uchun</h3>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <Icon name="CheckCircleIcon" size={24} className="text-success mr-3 flex-shrink-0" variant="solid" />
                    <div>
                      <div className="font-medium">Kurs Yaratish</div>
                      <div className="text-sm text-muted-foreground">Video, test va topshiriqlar bilan to'liq kurslar yarating</div>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Icon name="CheckCircleIcon" size={24} className="text-success mr-3 flex-shrink-0" variant="solid" />
                    <div>
                      <div className="font-medium">Daromad Olish</div>
                      <div className="text-sm text-muted-foreground">Kurslaringizdan to'g'ridan-to'g'ri daromad oling</div>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Icon name="CheckCircleIcon" size={24} className="text-success mr-3 flex-shrink-0" variant="solid" />
                    <div>
                      <div className="font-medium">O'quvchilarni Boshqarish</div>
                      <div className="text-sm text-muted-foreground">Guruhlar yarating va o'quvchilar progressini kuzating</div>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Icon name="CheckCircleIcon" size={24} className="text-success mr-3 flex-shrink-0" variant="solid" />
                    <div>
                      <div className="font-medium">Statistika va Tahlil</div>
                      <div className="text-sm text-muted-foreground">Kurslaringiz samaradorligini tahlil qiling</div>
                    </div>
                  </li>
                </ul>
                <Link
                  href="/register?role=teacher"
                  className="inline-flex items-center justify-center w-full mt-6 px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition-smooth"
                >
                  O'qituvchi Sifatida Qo'shilish
                </Link>
              </div>

              {/* Student Features */}
              <div className="bg-card rounded-md p-8 shadow-warm-lg">
                <div className="flex items-center justify-center w-16 h-16 bg-secondary rounded-md mb-6">
                  <Icon name="BookOpenIcon" size={32} className="text-primary-foreground" variant="solid" />
                </div>
                <h3 className="text-2xl font-heading font-bold mb-4">O'quvchilar Uchun</h3>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <Icon name="CheckCircleIcon" size={24} className="text-success mr-3 flex-shrink-0" variant="solid" />
                    <div>
                      <div className="font-medium">Turli Xil Kurslar</div>
                      <div className="text-sm text-muted-foreground">Matematika, dasturlash, tillar va ko'plab yo'nalishlar</div>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Icon name="CheckCircleIcon" size={24} className="text-success mr-3 flex-shrink-0" variant="solid" />
                    <div>
                      <div className="font-medium">Sertifikatlar</div>
                      <div className="text-sm text-muted-foreground">Kursni tugatganingizda rasmiy sertifikat oling</div>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Icon name="CheckCircleIcon" size={24} className="text-success mr-3 flex-shrink-0" variant="solid" />
                    <div>
                      <div className="font-medium">Progress Kuzatuvi</div>
                      <div className="text-sm text-muted-foreground">O'z rivojlanishingizni real vaqtda kuzatib boring</div>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Icon name="CheckCircleIcon" size={24} className="text-success mr-3 flex-shrink-0" variant="solid" />
                    <div>
                      <div className="font-medium">Interaktiv O'rganish</div>
                      <div className="text-sm text-muted-foreground">Video darslar, testlar va amaliy topshiriqlar</div>
                    </div>
                  </li>
                </ul>
                <Link
                  href="/register?role=student"
                  className="inline-flex items-center justify-center w-full mt-6 px-6 py-3 bg-secondary text-secondary-foreground rounded-md font-medium hover:opacity-90 transition-smooth"
                >
                  O'quvchi Sifatida Qo'shilish
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Popular Courses */}
        <section className="py-16 md:py-24 bg-muted">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Mashhur Kurslar</h2>
              <p className="text-lg text-muted-foreground">Eng ko'p tanlanayotgan kurslar bilan tanishing</p>
            </div>

            {loading ? (
              <div className="grid md:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-card rounded-md shadow-warm animate-pulse">
                    <div className="h-48 bg-muted rounded-t-md"></div>
                    <div className="p-6">
                      <div className="h-6 bg-muted rounded mb-4"></div>
                      <div className="h-4 bg-muted rounded mb-2"></div>
                      <div className="h-4 bg-muted rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-8">
                {popularCourses.length > 0 ? (
                  popularCourses.map((course) => (
                    <Link
                      key={course.id}
                      href={`/course-details?id=${course.id}`}
                      className="bg-card rounded-md shadow-warm hover:shadow-warm-lg transition-smooth overflow-hidden group"
                    >
                      <div className="relative h-48 overflow-hidden bg-muted">
                        <AppImage
                          src={course.coverImage}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-smooth"
                        />
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-heading font-bold mb-2 line-clamp-2">{course.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4">Ustoz: {course.instructor}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Icon name="StarIcon" size={16} className="text-accent mr-1" variant="solid" />
                            <span className="text-sm font-medium">{course.rating}</span>
                            <span className="text-sm text-muted-foreground ml-2">({course.enrollmentCount})</span>
                          </div>
                          <div className="text-lg font-bold text-primary">{course.price.toLocaleString()} so'm</div>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-12">
                    <Icon name="BookOpenIcon" size={48} className="text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Hozircha kurslar mavjud emas</p>
                  </div>
                )}
              </div>
            )}

            <div className="text-center mt-12">
              <Link
                href="/course-marketplace"
                className="inline-flex items-center justify-center px-8 py-4 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition-smooth shadow-warm"
              >
                Barcha Kurslarni Ko'rish
                <Icon name="ArrowRightIcon" size={20} className="ml-2" />
              </Link>
            </div>
          </div>
        </section>

        {/* Platform Statistics */}
        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Platformamiz Haqida Raqamlarda</h2>
              <p className="text-lg text-muted-foreground">Minglab foydalanuvchilar ishongan platforma</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="flex items-center justify-center w-20 h-20 bg-primary rounded-md mb-4 mx-auto">
                  <Icon name="BookOpenIcon" size={40} className="text-primary-foreground" variant="solid" />
                </div>
                <div className="text-4xl font-heading font-bold text-primary mb-2">{stats.totalCourses}+</div>
                <div className="text-muted-foreground">Jami Kurslar</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-20 h-20 bg-secondary rounded-md mb-4 mx-auto">
                  <Icon name="UserGroupIcon" size={40} className="text-primary-foreground" variant="solid" />
                </div>
                <div className="text-4xl font-heading font-bold text-secondary mb-2">{stats.activeStudents}+</div>
                <div className="text-muted-foreground">Faol O'quvchilar</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-20 h-20 bg-accent rounded-md mb-4 mx-auto">
                  <Icon name="UserIcon" size={40} className="text-accent-foreground" variant="solid" />
                </div>
                <div className="text-4xl font-heading font-bold text-accent-foreground mb-2">{stats.successfulTeachers}+</div>
                <div className="text-muted-foreground">Muvaffaqiyatli O'qituvchilar</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-20 h-20 bg-success rounded-md mb-4 mx-auto">
                  <Icon name="TrophyIcon" size={40} className="text-success-foreground" variant="solid" />
                </div>
                <div className="text-4xl font-heading font-bold text-success mb-2">{stats.certificatesAwarded}+</div>
                <div className="text-muted-foreground">Berilgan Sertifikatlar</div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 md:py-24 bg-gradient-to-r from-primary to-secondary text-primary-foreground">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Foydalanuvchilar Fikri</h2>
              <p className="text-lg opacity-90">Platformamizdan foydalanuvchilarning tajribalari</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-primary-foreground text-foreground rounded-md p-6 shadow-warm-lg">
                <div className="flex items-center mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Icon key={star} name="StarIcon" size={20} className="text-accent" variant="solid" />
                  ))}
                </div>
                <p className="mb-4 text-muted-foreground">
                  "Ustoz platformasi orqali o'z bilimlarimni minglab o'quvchilarga yetkazish imkoniyatiga ega bo'ldim. Juda qulay va professional tizim!"
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mr-3">
                    <Icon name="UserIcon" size={24} className="text-primary-foreground" variant="solid" />
                  </div>
                  <div>
                    <div className="font-medium">Aziza Karimova</div>
                    <div className="text-sm text-muted-foreground">Matematika o'qituvchisi</div>
                  </div>
                </div>
              </div>

              <div className="bg-primary-foreground text-foreground rounded-md p-6 shadow-warm-lg">
                <div className="flex items-center mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Icon key={star} name="StarIcon" size={20} className="text-accent" variant="solid" />
                  ))}
                </div>
                <p className="mb-4 text-muted-foreground">
                  "Dasturlashni o'rganish uchun ajoyib platforma. Video darslar aniq, testlar foydali va sertifikat olish imkoniyati motivatsiya beradi."
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mr-3">
                    <Icon name="UserIcon" size={24} className="text-primary-foreground" variant="solid" />
                  </div>
                  <div>
                    <div className="font-medium">Sardor Rahimov</div>
                    <div className="text-sm text-muted-foreground">Talaba</div>
                  </div>
                </div>
              </div>

              <div className="bg-primary-foreground text-foreground rounded-md p-6 shadow-warm-lg">
                <div className="flex items-center mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Icon key={star} name="StarIcon" size={20} className="text-accent" variant="solid" />
                  ))}
                </div>
                <p className="mb-4 text-muted-foreground">
                  "Ingliz tilini o'rganish uchun kerakli barcha resurslar bir joyda. Interaktiv darslar va amaliy mashqlar juda samarali."
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mr-3">
                    <Icon name="UserIcon" size={24} className="text-accent-foreground" variant="solid" />
                  </div>
                  <div>
                    <div className="font-medium">Nilufar Yusupova</div>
                    <div className="text-sm text-muted-foreground">O'quvchi</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-card py-12 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-md">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" className="text-primary-foreground" />
                      <path d="M2 17L12 22L22 17" stroke="currentColor" className="text-primary-foreground" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M2 12L12 17L22 12" stroke="currentColor" className="text-primary-foreground" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-xl font-heading font-bold">Ustoz</span>
                </div>
                <p className="text-sm text-muted-foreground">Zamonaviy onlayn ta'lim platformasi. O'rganing, o'rgating, rivojlaning.</p>
              </div>

              <div>
                <h4 className="font-heading font-bold mb-4">Platforma</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/landing-page" className="text-muted-foreground hover:text-primary transition-smooth">Bosh Sahifa</Link></li>
                  <li><Link href="/course-marketplace" className="text-muted-foreground hover:text-primary transition-smooth">Kurslar</Link></li>
                  <li><Link href="/about-page" className="text-muted-foreground hover:text-primary transition-smooth">Biz Haqimizda</Link></li>
                  <li><Link href="/login" className="text-muted-foreground hover:text-primary transition-smooth">Kirish</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-heading font-bold mb-4">O'qituvchilar</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/register?role=teacher" className="text-muted-foreground hover:text-primary transition-smooth">O'qituvchi Bo'lish</Link></li>
                  <li><Link href="/course-creation" className="text-muted-foreground hover:text-primary transition-smooth">Kurs Yaratish</Link></li>
                  <li><Link href="/teacher-dashboard" className="text-muted-foreground hover:text-primary transition-smooth">Dashboard</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-heading font-bold mb-4">Aloqa</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <Icon name="EnvelopeIcon" size={16} className="mr-2" />
                    info@ustoz-talim.uz
                  </li>
                  <li className="flex items-center">
                    <Icon name="PhoneIcon" size={16} className="mr-2" />
                    +998 90 123 45 67
                  </li>
                  <li className="flex items-center">
                    <Icon name="MapPinIcon" size={16} className="mr-2" />
                    Toshkent, O'zbekiston
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
              <p>&copy; 2026 Ustoz. Barcha huquqlar himoyalangan.</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default LandingPageInteractive;