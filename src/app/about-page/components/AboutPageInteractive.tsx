'use client';

import Link from 'next/link';
import RoleBasedHeader from '@/components/common/RoleBasedHeader';
import Icon from '@/components/ui/AppIcon';

const AboutPageInteractive = () => {
  const teamMembers = [
    {
      name: 'Alisher Rahimov',
      role: 'Asoschisi va CEO',
      description: 'Ta\'lim sohasida 15 yillik tajriba',
      icon: 'UserIcon',
    },
    {
      name: 'Madina Karimova',
      role: 'Ta\'lim Direktori',
      description: 'Pedagogika fanlari nomzodi',
      icon: 'UserIcon',
    },
    {
      name: 'Jasur Yusupov',
      role: 'Texnologiya Direktori',
      description: 'EdTech sohasida 10 yillik tajriba',
      icon: 'UserIcon',
    },
    {
      name: 'Nilufar Azimova',
      role: 'Kontent Menejeri',
      description: 'Kurs sifatini nazorat qilish',
      icon: 'UserIcon',
    },
  ];

  const achievements = [
    {
      year: '2023',
      title: 'Platformaning Ishga Tushishi',
      description: 'Ustoz platformasi rasmiy ravishda ishga tushirildi',
      icon: 'RocketLaunchIcon',
    },
    {
      year: '2024',
      title: '1000+ O\'quvchi',
      description: 'Birinchi mingta o\'quvchiga erishdik',
      icon: 'UserGroupIcon',
    },
    {
      year: '2025',
      title: '50+ O\'qituvchi',
      description: 'Professional o\'qituvchilar jamoasi shakllandi',
      icon: 'AcademicCapIcon',
    },
    {
      year: '2026',
      title: 'Yangi Imkoniyatlar',
      description: 'AI asosidagi shaxsiy o\'rganish yo\'llari qo\'shildi',
      icon: 'SparklesIcon',
    },
  ];

  const values = [
    {
      title: 'Sifat',
      description: 'Har bir kurs yuqori sifat standartlariga javob beradi',
      icon: 'ShieldCheckIcon',
    },
    {
      title: 'Qulaylik',
      description: 'Istalgan vaqt va joydan o\'rganish imkoniyati',
      icon: 'ClockIcon',
    },
    {
      title: 'Hamjamiyat',
      description: 'O\'qituvchilar va o\'quvchilar uchun qo\'llab-quvvatlovchi muhit',
      icon: 'HeartIcon',
    },
    {
      title: 'Innovatsiya',
      description: 'Zamonaviy texnologiyalar va o\'qitish metodlari',
      icon: 'LightBulbIcon',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <RoleBasedHeader userRole={null} currentPath="/about-page" />
      
      <main className="pt-16">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary to-secondary text-primary-foreground py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">
              Biz Haqimizda
            </h1>
            <p className="text-lg md:text-xl max-w-3xl mx-auto opacity-90">
              Ustoz - bu O'zbekistonda sifatli onlayn ta'limni barcha uchun ochiq qilish missiyasiga ega zamonaviy ta'lim platformasi
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6">Bizning Missiyamiz</h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Ustoz platformasi orqali biz O'zbekistonda sifatli ta'limni har bir kishiga yetkazishni maqsad qilganmiz. Biz ishonmizki, bilim olish har bir inson uchun ochiq va qulay bo'lishi kerak.
                </p>
                <p className="text-lg text-muted-foreground mb-6">
                  Platformamiz professional o'qituvchilarga o'z bilimlarini keng auditoriyaga yetkazish imkoniyatini beradi, o'quvchilarga esa turli sohalarda chuqur bilim olish va professional rivojlanish yo'llarini ochadi.
                </p>
                <p className="text-lg text-muted-foreground">
                  Biz zamonaviy texnologiyalar va innovatsion o'qitish metodlarini qo'llash orqali ta'lim jarayonini samarali va qiziqarli qilishga intilamiz.
                </p>
              </div>
              <div className="bg-card rounded-md p-8 shadow-warm-lg">
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="flex items-center justify-center w-12 h-12 bg-primary rounded-md mr-4 flex-shrink-0">
                      <Icon name="EyeIcon" size={24} className="text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="text-xl font-heading font-bold mb-2">Viziyamiz</h3>
                      <p className="text-muted-foreground">O'zbekistonda yetakchi onlayn ta'lim platformasi bo'lish va millionlab odamlarning hayotini o'zgartirish</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex items-center justify-center w-12 h-12 bg-secondary rounded-md mr-4 flex-shrink-0">
                      <Icon name="FlagIcon" size={24} className="text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="text-xl font-heading font-bold mb-2">Maqsadimiz</h3>
                      <p className="text-muted-foreground">Sifatli ta'limni har bir kishiga ochiq va qulay qilish, professional o'qituvchilar va o'quvchilarni birlashtirish</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 md:py-24 bg-muted">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Bizning Qadriyatlarimiz</h2>
              <p className="text-lg text-muted-foreground">Biz quyidagi tamoyillar asosida ishlaymiz</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <div key={index} className="bg-card rounded-md p-6 shadow-warm text-center">
                  <div className="flex items-center justify-center w-16 h-16 bg-primary rounded-md mb-4 mx-auto">
                    <Icon name={value.icon as any} size={32} className="text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-heading font-bold mb-3">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Bizning Jamoa</h2>
              <p className="text-lg text-muted-foreground">Professional va tajribali mutaxassislar</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {teamMembers.map((member, index) => (
                <div key={index} className="bg-card rounded-md p-6 shadow-warm hover:shadow-warm-lg transition-smooth text-center">
                  <div className="flex items-center justify-center w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-full mb-4 mx-auto">
                    <Icon name={member.icon as any} size={48} className="text-primary-foreground" variant="solid" />
                  </div>
                  <h3 className="text-xl font-heading font-bold mb-2">{member.name}</h3>
                  <p className="text-primary font-medium mb-2">{member.role}</p>
                  <p className="text-sm text-muted-foreground">{member.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Achievements Timeline */}
        <section className="py-16 md:py-24 bg-muted">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Bizning Yutuqlarimiz</h2>
              <p className="text-lg text-muted-foreground">Platformaning rivojlanish tarixi</p>
            </div>

            <div className="relative">
              {/* Timeline Line */}
              <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-border"></div>

              <div className="space-y-12">
                {achievements.map((achievement, index) => (
                  <div key={index} className={`flex items-center ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                    <div className={`flex-1 ${index % 2 === 0 ? 'md:text-right md:pr-12' : 'md:text-left md:pl-12'}`}>
                      <div className="bg-card rounded-md p-6 shadow-warm">
                        <div className="inline-block px-4 py-1 bg-primary text-primary-foreground rounded-full text-sm font-bold mb-3">
                          {achievement.year}
                        </div>
                        <h3 className="text-xl font-heading font-bold mb-2">{achievement.title}</h3>
                        <p className="text-muted-foreground">{achievement.description}</p>
                      </div>
                    </div>
                    <div className="hidden md:flex items-center justify-center w-16 h-16 bg-primary rounded-full shadow-warm-lg z-10">
                      <Icon name={achievement.icon as any} size={32} className="text-primary-foreground" variant="solid" />
                    </div>
                    <div className="flex-1"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Educational Philosophy */}
        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Ta'lim Falsafamiz</h2>
              <p className="text-lg text-muted-foreground">Biz qanday yondashuvni qo'llaymiz</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-card rounded-md p-6 shadow-warm">
                <div className="flex items-center justify-center w-16 h-16 bg-secondary rounded-md mb-4">
                  <Icon name="UserGroupIcon" size={32} className="text-primary-foreground" variant="solid" />
                </div>
                <h3 className="text-xl font-heading font-bold mb-3">Shaxsiy Yondashuv</h3>
                <p className="text-muted-foreground">
                  Har bir o'quvchining o'ziga xos o'rganish uslubi va tezligini hisobga olamiz. Platformamiz individual o'rganish yo'llarini taklif etadi.
                </p>
              </div>

              <div className="bg-card rounded-md p-6 shadow-warm">
                <div className="flex items-center justify-center w-16 h-16 bg-accent rounded-md mb-4">
                  <Icon name="ChartBarIcon" size={32} className="text-accent-foreground" variant="solid" />
                </div>
                <h3 className="text-xl font-heading font-bold mb-3">Natijaga Yo'naltirilgan</h3>
                <p className="text-muted-foreground">
                  Biz o'quvchilarning real natijalarga erishishiga e'tibor qaratamiz. Har bir kurs amaliy ko'nikmalar va bilimlarni beradi.
                </p>
              </div>

              <div className="bg-card rounded-md p-6 shadow-warm">
                <div className="flex items-center justify-center w-16 h-16 bg-success rounded-md mb-4">
                  <Icon name="CheckBadgeIcon" size={32} className="text-success-foreground" variant="solid" />
                </div>
                <h3 className="text-xl font-heading font-bold mb-3">Sifat Nazorati</h3>
                <p className="text-muted-foreground">
                  Barcha kurslar qat'iy sifat nazoratidan o'tadi. Biz faqat yuqori sifatli ta'lim materiallarini taqdim etamiz.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-16 md:py-24 bg-gradient-to-r from-primary to-secondary text-primary-foreground">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Biz Bilan Bog'laning</h2>
              <p className="text-lg opacity-90">Savollaringiz bormi? Biz sizga yordam berishga tayyormiz</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="bg-primary-foreground text-foreground rounded-md p-6 text-center shadow-warm-lg">
                <div className="flex items-center justify-center w-16 h-16 bg-primary rounded-md mb-4 mx-auto">
                  <Icon name="EnvelopeIcon" size={32} className="text-primary-foreground" />
                </div>
                <h3 className="font-heading font-bold mb-2">Email</h3>
                <p className="text-muted-foreground">info@ustoz-talim.uz</p>
                <p className="text-muted-foreground">support@ustoz-talim.uz</p>
              </div>

              <div className="bg-primary-foreground text-foreground rounded-md p-6 text-center shadow-warm-lg">
                <div className="flex items-center justify-center w-16 h-16 bg-secondary rounded-md mb-4 mx-auto">
                  <Icon name="PhoneIcon" size={32} className="text-primary-foreground" />
                </div>
                <h3 className="font-heading font-bold mb-2">Telefon</h3>
                <p className="text-muted-foreground">+998 90 123 45 67</p>
                <p className="text-muted-foreground">+998 91 234 56 78</p>
              </div>

              <div className="bg-primary-foreground text-foreground rounded-md p-6 text-center shadow-warm-lg">
                <div className="flex items-center justify-center w-16 h-16 bg-accent rounded-md mb-4 mx-auto">
                  <Icon name="MapPinIcon" size={32} className="text-accent-foreground" />
                </div>
                <h3 className="font-heading font-bold mb-2">Manzil</h3>
                <p className="text-muted-foreground">Toshkent shahar,</p>
                <p className="text-muted-foreground">Chilonzor tumani</p>
              </div>
            </div>

            <div className="text-center mt-12">
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-8 py-4 bg-accent text-accent-foreground rounded-md font-medium hover:opacity-90 transition-smooth shadow-warm-lg"
              >
                <Icon name="UserPlusIcon" size={24} className="mr-2" />
                Ro'yxatdan O'tish
              </Link>
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
                  <li><Link href="/register?role=teacher" className="text-muted-foreground hover:text-primary transition-smooth">O&apos;qituvchi Bo&apos;lish</Link></li>
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

export default AboutPageInteractive;