/**
 * Huquqiy hujjatlar mazmuni (Foydalanish shartlari / Maxfiylik siyosati) — uz/ru/en.
 *
 * Katta matnni i18n JSON'ga tiqmaslik uchun alohida modul (o'qish/yangilash oson).
 * Operator: UstozEdu (ustozedu.uz). Aloqa: ilyossuyunov416@gmail.com.
 * Yurisdiksiya: O'zbekiston Respublikasi.
 *
 * ESLATMA: bu hujjatlar platformaga moslashtirilgan professional shablon.
 * Yakuniy yuridik muvofiqlik uchun advokat ko'rigidan o'tkazish tavsiya etiladi.
 */
import type { Locale } from '@/lib/i18n';

export interface LegalSection {
  heading: string;
  /** Paragraflar `\n\n` bilan; ro'yxat qatorlari `• ` bilan boshlanadi. */
  body: string;
}

export interface LegalDoc {
  title: string;
  intro: string;
  effectiveDate: string;
  sections: LegalSection[];
}

const CONTACT_EMAIL = 'ilyossuyunov416@gmail.com';

// ==================== FOYDALANISH SHARTLARI ====================

const TERMS: Record<Locale, LegalDoc> = {
  uz: {
    title: 'Foydalanish shartlari',
    intro:
      'Ushbu Foydalanish shartlari ("Shartlar") UstozEdu ta\'lim platformasidan (ustozedu.uz, "Platforma") foydalanishni tartibga soladi. Platformadan foydalanish orqali siz ushbu Shartlarni to\'liq qabul qilgan hisoblanasiz. Agar rozi bo\'lmasangiz, Platformadan foydalanmang.',
    effectiveDate: 'Kuchga kirgan sana: 2026-yil 10-sentyabr',
    sections: [
      {
        heading: '1. Umumiy qoidalar',
        body: 'UstozEdu — o\'quvchilar va o\'qituvchilarni bog\'lovchi onlayn ta\'lim platformasi. Platforma orqali o\'qituvchilar kurs joylashtiradi, o\'quvchilar esa kurslarga yoziladi va o\'qiydi. Biz istalgan vaqtda ushbu Shartlarni yangilashimiz mumkin; muhim o\'zgarishlar Platformada e\'lon qilinadi.',
      },
      {
        heading: '2. Ro\'yxatdan o\'tish va hisob',
        body: 'Platformadan to\'liq foydalanish uchun hisob yaratish talab qilinadi. Siz haqiqiy va to\'g\'ri ma\'lumot berishga, hisob ma\'lumotlaringiz maxfiyligini saqlashga majburssiz.\n\n• Hisobingiz orqali amalga oshirilgan barcha harakatlar uchun siz javobgarsiz.\n• Ruxsatsiz kirishni sezsangiz, darhol bizga xabar bering.\n• Bitta shaxs hisobini boshqalarga bermasligi kerak.',
      },
      {
        heading: '3. Maqbul foydalanish',
        body: 'Platformadan faqat qonuniy maqsadlarda foydalanishingiz mumkin. Quyidagilar taqiqlanadi:\n\n• Qonunga zid, haqoratli yoki yolg\'on kontent joylashtirish.\n• Boshqa foydalanuvchilar huquqlarini yoki intellektual mulkni buzish.\n• Platforma xavfsizligini buzishga urinish, zararli dastur tarqatish yoki avtomatlashtirilgan yig\'ish (scraping).\n• Himoyalangan video va kontentni ruxsatsiz yuklab olish, nusxalash yoki tarqatish.',
      },
      {
        heading: '4. Kurslar va kontent',
        body: 'O\'qituvchilar joylashtirgan kurslar, videolar va materiallar ularning yoki tegishli huquq egalarining intellektual mulki hisoblanadi. Kursga yozilgan o\'quvchiga kontentdan faqat shaxsiy, notijorat maqsadda foydalanish uchun cheklangan, boshqalarga berib bo\'lmaydigan litsenziya beriladi.\n\nO\'qituvchilar o\'z kontenti qonuniy va uchinchi tomon huquqlarini buzmasligiga kafolat beradi. UstozEdu kontentni moderatsiya qilish va Shartlarni buzgan materialni olib tashlash huquqini saqlaydi.',
      },
      {
        heading: '5. To\'lovlar va sotib olish',
        body: 'Pullik kurslar Click yoki Payme orqali sotib olinadi. Hozirgi bosqichda sotib olish so\'rovi administrator tasdig\'i orqali yakunlanadi; tasdiqlangach o\'quvchi kursga yoziladi.\n\n• Narxlar so\'mda (UZS) ko\'rsatiladi va o\'zgarishi mumkin, biroq siz ko\'rgan (rozi bo\'lgan) narx amal qiladi.\n• Bepul kurslarga to\'g\'ridan-to\'g\'ri yozilish mumkin.\n• To\'lov ma\'lumotlari to\'lov tizimlari (Click/Payme) orqali xavfsiz qayta ishlanadi; biz to\'liq karta ma\'lumotlarini saqlamaymiz.',
      },
      {
        heading: '6. Qaytarish siyosati',
        body: 'Qaytarish (refund) so\'rovlari administrator tomonidan ko\'rib chiqiladi. Qaytarish tasdiqlansa, o\'quvchining kursga kirishi to\'xtatiladi va tegishli summa qaytariladi. Kontentdan sezilarli darajada foydalanilgan yoki suiiste\'mol aniqlangan hollarda qaytarish rad etilishi mumkin. Aniq shartlar uchun qo\'llab-quvvatlashga murojaat qiling.',
      },
      {
        heading: '7. O\'qituvchi daromadi va to\'lovlar',
        body: 'O\'qituvchilar o\'z kurslari sotuvidan platforma komissiyasi ayirilgan sof ulushni oladi. Komissiya foizi va joriy balans o\'qituvchi paneliда ko\'rsatiladi. Yechib olish (withdrawal) so\'rovlari belgilangan minimal summadan yuqori bo\'lganda va bank/karta ma\'lumotlari to\'liq bo\'lganda amalga oshiriladi. Qaytarilgan sotuvlar bo\'yicha tegishli tuzatishlar kiritilishi mumkin.',
      },
      {
        heading: '8. Intellektual mulk',
        body: 'UstozEdu nomi, logotipi, dizayni va Platforma dasturiy ta\'minoti bizning yoki litsenziarlarimizning mulki hisoblanadi. Foydalanuvchilar joylashtirgan kontent tegishli mualliflarга tegishli bo\'lib qoladi; joylashtirish orqali ular UstozEdu\'ga kontentni Platforma doirasida ko\'rsatish uchun zarur huquqlarni beradi.',
      },
      {
        heading: '9. Kafolatlardan voz kechish',
        body: 'Platforma "boricha" (as is) taqdim etiladi. Biz uzluksiz, xatosiz ishlashni yoki muayyan natijaga erishishni kafolatlamaymiz. Kurs mazmuni va sifati uchun asosiy javobgarlik tegishli o\'qituvchida.',
      },
      {
        heading: '10. Javobgarlikni cheklash',
        body: 'Qonun ruxsat etgan darajada, UstozEdu Platformadan foydalanish natijasida yuzaga kelgan bilvosita, tasodifiy yoki ergashuvchi zararlar uchun javobgar emas. Bizning umumiy javobgarligimiz, iloji bo\'lsa, tegishli xizmat uchun to\'langan summadan oshmaydi.',
      },
      {
        heading: '11. Hisobni to\'xtatish',
        body: 'Ushbu Shartlarni buzsangiz, biz hisobingizni ogohlantirish bilan yoki ogohlantirmasdan cheklashimiz yoki to\'xtatishimiz mumkin. Siz istalgan vaqtda hisobingizni yopishni so\'rashingiz mumkin.',
      },
      {
        heading: '12. Amal qiluvchi qonun',
        body: 'Ushbu Shartlar O\'zbekiston Respublikasi qonunchiligiga muvofiq tartibga solinadi. Nizolar imkon qadar muzokaralar yo\'li bilan, aks holda O\'zbekiston Respublikasining vakolatli sudlarida hal qilinadi.',
      },
      {
        heading: '13. Aloqa',
        body: `Ushbu Shartlar bo\'yicha savollar uchun biz bilan bog\'laning: ${CONTACT_EMAIL}`,
      },
    ],
  },
  ru: {
    title: 'Условия использования',
    intro:
      'Настоящие Условия использования («Условия») регулируют использование образовательной платформы UstozEdu (ustozedu.uz, «Платформа»). Используя Платформу, вы полностью принимаете эти Условия. Если вы не согласны, не используйте Платформу.',
    effectiveDate: 'Дата вступления в силу: 10 сентября 2026 г.',
    sections: [
      {
        heading: '1. Общие положения',
        body: 'UstozEdu — это онлайн-платформа образования, соединяющая учащихся и преподавателей. Преподаватели размещают курсы, а учащиеся записываются и обучаются. Мы можем обновлять настоящие Условия; о существенных изменениях сообщается на Платформе.',
      },
      {
        heading: '2. Регистрация и учётная запись',
        body: 'Для полного доступа требуется создание учётной записи. Вы обязуетесь предоставлять достоверные данные и хранить учётные данные в тайне.\n\n• Вы несёте ответственность за все действия в вашей учётной записи.\n• Немедленно сообщите нам о несанкционированном доступе.\n• Не передавайте свою учётную запись третьим лицам.',
      },
      {
        heading: '3. Допустимое использование',
        body: 'Платформу можно использовать только в законных целях. Запрещается:\n\n• Размещать незаконный, оскорбительный или ложный контент.\n• Нарушать права других пользователей или интеллектуальную собственность.\n• Пытаться нарушить безопасность Платформы, распространять вредоносное ПО или осуществлять сбор данных (scraping).\n• Несанкционированно скачивать, копировать или распространять защищённое видео и контент.',
      },
      {
        heading: '4. Курсы и контент',
        body: 'Курсы, видео и материалы, размещённые преподавателями, являются их интеллектуальной собственностью или собственностью правообладателей. Записавшемуся учащемуся предоставляется ограниченная, непередаваемая лицензия на использование контента исключительно в личных некоммерческих целях.\n\nПреподаватели гарантируют законность своего контента. UstozEdu вправе модерировать и удалять материалы, нарушающие Условия.',
      },
      {
        heading: '5. Платежи и покупки',
        body: 'Платные курсы приобретаются через Click или Payme. На текущем этапе запрос на покупку подтверждается администратором; после подтверждения учащийся записывается на курс.\n\n• Цены указываются в сумах (UZS) и могут меняться, но применяется цена, которую вы видели и с которой согласились.\n• На бесплатные курсы можно записаться напрямую.\n• Платёжные данные безопасно обрабатываются платёжными системами (Click/Payme); мы не храним полные данные карт.',
      },
      {
        heading: '6. Политика возврата',
        body: 'Запросы на возврат рассматриваются администратором. При одобрении возврата доступ учащегося к курсу прекращается, а соответствующая сумма возвращается. В случае значительного использования контента или выявления злоупотребления в возврате может быть отказано.',
      },
      {
        heading: '7. Доходы преподавателей и выплаты',
        body: 'Преподаватели получают чистую долю от продаж своих курсов за вычетом комиссии платформы. Процент комиссии и текущий баланс отображаются в панели преподавателя. Запросы на вывод средств выполняются при превышении минимальной суммы и наличии полных банковских/карточных данных.',
      },
      {
        heading: '8. Интеллектуальная собственность',
        body: 'Название, логотип, дизайн UstozEdu и программное обеспечение Платформы принадлежат нам или нашим лицензиарам. Контент, размещённый пользователями, остаётся за их авторами; размещая его, они предоставляют UstozEdu необходимые права для показа контента в рамках Платформы.',
      },
      {
        heading: '9. Отказ от гарантий',
        body: 'Платформа предоставляется «как есть». Мы не гарантируем бесперебойную, безошибочную работу или достижение конкретного результата. Основную ответственность за содержание и качество курса несёт соответствующий преподаватель.',
      },
      {
        heading: '10. Ограничение ответственности',
        body: 'В пределах, разрешённых законом, UstozEdu не несёт ответственности за косвенные, случайные или последующие убытки, возникшие в результате использования Платформы. Наша совокупная ответственность не превышает сумму, уплаченную за соответствующую услугу.',
      },
      {
        heading: '11. Приостановка учётной записи',
        body: 'При нарушении настоящих Условий мы можем ограничить или приостановить вашу учётную запись с уведомлением или без него. Вы можете в любое время запросить закрытие учётной записи.',
      },
      {
        heading: '12. Применимое право',
        body: 'Настоящие Условия регулируются законодательством Республики Узбекистан. Споры разрешаются по возможности путём переговоров, в противном случае — в компетентных судах Республики Узбекистан.',
      },
      {
        heading: '13. Контакты',
        body: `По вопросам, связанным с настоящими Условиями, свяжитесь с нами: ${CONTACT_EMAIL}`,
      },
    ],
  },
  en: {
    title: 'Terms of Service',
    intro:
      'These Terms of Service ("Terms") govern your use of the UstozEdu education platform (ustozedu.uz, the "Platform"). By using the Platform, you fully accept these Terms. If you do not agree, do not use the Platform.',
    effectiveDate: 'Effective date: September 10, 2026',
    sections: [
      {
        heading: '1. General',
        body: 'UstozEdu is an online education platform connecting students and teachers. Teachers publish courses, and students enroll and learn. We may update these Terms; material changes will be announced on the Platform.',
      },
      {
        heading: '2. Registration and account',
        body: 'Creating an account is required for full access. You agree to provide accurate information and keep your credentials confidential.\n\n• You are responsible for all activity under your account.\n• Notify us immediately of any unauthorized access.\n• Do not share your account with others.',
      },
      {
        heading: '3. Acceptable use',
        body: 'You may use the Platform only for lawful purposes. The following are prohibited:\n\n• Posting illegal, offensive, or false content.\n• Infringing the rights of others or intellectual property.\n• Attempting to breach Platform security, distributing malware, or scraping.\n• Downloading, copying, or distributing protected video and content without authorization.',
      },
      {
        heading: '4. Courses and content',
        body: 'Courses, videos, and materials published by teachers are the intellectual property of the teachers or relevant rights holders. Enrolled students receive a limited, non-transferable license to use the content solely for personal, non-commercial purposes.\n\nTeachers warrant that their content is lawful and does not infringe third-party rights. UstozEdu may moderate and remove material that violates these Terms.',
      },
      {
        heading: '5. Payments and purchases',
        body: 'Paid courses are purchased via Click or Payme. At the current stage, a purchase request is completed upon administrator approval; once approved, the student is enrolled.\n\n• Prices are shown in soum (UZS) and may change, but the price you saw and agreed to applies.\n• Free courses can be joined directly.\n• Payment details are processed securely by the payment systems (Click/Payme); we do not store full card data.',
      },
      {
        heading: '6. Refund policy',
        body: 'Refund requests are reviewed by an administrator. If a refund is approved, the student’s access to the course is revoked and the corresponding amount is returned. Refunds may be declined where content has been substantially consumed or abuse is detected.',
      },
      {
        heading: '7. Teacher earnings and payouts',
        body: 'Teachers receive a net share of their course sales after the platform commission. The commission rate and current balance are shown in the teacher dashboard. Withdrawal requests are processed when they exceed the minimum amount and complete bank/card details are provided.',
      },
      {
        heading: '8. Intellectual property',
        body: 'The UstozEdu name, logo, design, and Platform software are owned by us or our licensors. User-submitted content remains with its authors; by posting, they grant UstozEdu the rights necessary to display the content within the Platform.',
      },
      {
        heading: '9. Disclaimer of warranties',
        body: 'The Platform is provided "as is." We do not guarantee uninterrupted, error-free operation or any particular result. The teacher bears primary responsibility for course content and quality.',
      },
      {
        heading: '10. Limitation of liability',
        body: 'To the extent permitted by law, UstozEdu is not liable for indirect, incidental, or consequential damages arising from use of the Platform. Our aggregate liability shall not exceed the amount paid for the relevant service.',
      },
      {
        heading: '11. Suspension of account',
        body: 'If you violate these Terms, we may restrict or suspend your account with or without notice. You may request closure of your account at any time.',
      },
      {
        heading: '12. Governing law',
        body: 'These Terms are governed by the laws of the Republic of Uzbekistan. Disputes are resolved through negotiation where possible, otherwise in the competent courts of the Republic of Uzbekistan.',
      },
      {
        heading: '13. Contact',
        body: `For questions about these Terms, contact us: ${CONTACT_EMAIL}`,
      },
    ],
  },
};

// ==================== MAXFIYLIK SIYOSATI ====================

const PRIVACY: Record<Locale, LegalDoc> = {
  uz: {
    title: 'Maxfiylik siyosati',
    intro:
      'UstozEdu (ustozedu.uz) sizning maxfiyligingizni qadrlaydi. Ushbu Maxfiylik siyosati biz qanday ma\'lumotlarni to\'plashimiz, ulardan qanday foydalanishimiz va ularni qanday himoya qilishimizni tushuntiradi.',
    effectiveDate: 'Kuchga kirgan sana: 2026-yil 10-sentyabr',
    sections: [
      {
        heading: '1. Biz to\'playdigan ma\'lumotlar',
        body: 'Biz quyidagi ma\'lumotlarni to\'playmiz:\n\n• Hisob ma\'lumotlari: ism, elektron pochta, rol (o\'quvchi/o\'qituvchi), profil rasmi.\n• Foydalanish ma\'lumotlari: kurslar, darslar, natijalar, faollik.\n• To\'lov ma\'lumotlari: tranzaksiya tarixi (to\'liq karta ma\'lumotlari to\'lov tizimida qoladi, bizda emas).\n• Texnik ma\'lumotlar: qurilma, brauzer, taxminiy joylashuv, cookie fayllari.',
      },
      {
        heading: '2. Ma\'lumotlardan qanday foydalanamiz',
        body: 'To\'plangan ma\'lumotlardan quyidagi maqsadlarda foydalanamiz:\n\n• Platformani taqdim etish, hisobingizni boshqarish va kirishni ta\'minlash.\n• To\'lovlarni qayta ishlash va kurslarga yozish.\n• Xavfsizlikni ta\'minlash, firibgarlikning oldini olish.\n• Xizmatni yaxshilash va sizga tegishli bildirishnomalar yuborish.',
      },
      {
        heading: '3. Cookie fayllari',
        body: 'Biz zarur (sessiya, xavfsizlik) va ixtiyoriy (analitika, marketing) cookie fayllaridan foydalanamiz. Saytga kirganda cookie roziligi paneli orqali ixtiyoriy cookie\'larni boshqarishingiz mumkin. Zarur cookie\'lar Platforma ishlashi uchun majburiy.',
      },
      {
        heading: '4. Ma\'lumotlarni uchinchi tomonlar bilan ulashish',
        body: 'Biz ma\'lumotlaringizni sotmaymiz. Xizmat ko\'rsatish uchun ishonchli provayderlar bilan zarur darajada ulashamiz:\n\n• To\'lov: Click, Payme.\n• Video xosting: Bunny Stream.\n• Elektron pochta yetkazish: Resend.\n• Kirish (autentifikatsiya): Google (agar Google orqali kirsangiz).\n• Fayl saqlash: Cloudflare R2.\n\nBu provayderlar ma\'lumotlarni faqat bizga xizmat ko\'rsatish uchun qayta ishlaydi.',
      },
      {
        heading: '5. Ma\'lumotlarni saqlash muddati',
        body: 'Biz ma\'lumotlaringizni hisobingiz faol bo\'lgan davrda va qonun talab qilgan (masalan, buxgalteriya, nizolar) muddat davomida saqlaymiz. Hisobingiz yopilganda, qonun ruxsat etganda ma\'lumotlar o\'chiriladi yoki anonimlashtiriladi.',
      },
      {
        heading: '6. Xavfsizlik',
        body: 'Biz ma\'lumotlaringizni himoya qilish uchun texnik va tashkiliy choralarni qo\'llaymiz: shifrlangan ulanish (HTTPS), parollarni xesh ko\'rinishida saqlash, kirishni cheklash va himoyalangan video yetkazish. Biroq internetda hech qanday usul 100% xavfsiz emasligini yodda tuting.',
      },
      {
        heading: '7. Sizning huquqlaringiz',
        body: 'Siz o\'z ma\'lumotlaringizga kirish, ularni tuzatish yoki o\'chirishni so\'rash huquqiga egasiz. Profil sozlamalari orqali ko\'p ma\'lumotni o\'zingiz yangilay olasiz; qo\'shimcha so\'rovlar uchun biz bilan bog\'laning.',
      },
      {
        heading: '8. Bolalar maxfiyligi',
        body: 'Platforma voyaga yetmaganlar tomonidan ota-ona yoki qonuniy vakil nazorati va roziligi bilan foydalanilishi mumkin. Biz bilarakan yosh bolalardan ruxsatsiz shaxsiy ma\'lumot to\'plamaymiz.',
      },
      {
        heading: '9. Xalqaro uzatish',
        body: 'Ba\'zi xizmat provayderlarimiz serverlari O\'zbekistondan tashqarida joylashgan bo\'lishi mumkin. Bunday hollarda ma\'lumotlar tegishli himoya choralari bilan qayta ishlanadi.',
      },
      {
        heading: '10. O\'zgartirishlar',
        body: 'Biz ushbu Maxfiylik siyosatini vaqti-vaqti bilan yangilashimiz mumkin. Muhim o\'zgarishlar Platformada e\'lon qilinadi va yangilangan sana yuqorida ko\'rsatiladi.',
      },
      {
        heading: '11. Aloqa',
        body: `Maxfiylik bo\'yicha savollar uchun biz bilan bog\'laning: ${CONTACT_EMAIL}`,
      },
    ],
  },
  ru: {
    title: 'Политика конфиденциальности',
    intro:
      'UstozEdu (ustozedu.uz) ценит вашу конфиденциальность. Настоящая Политика конфиденциальности объясняет, какие данные мы собираем, как их используем и как защищаем.',
    effectiveDate: 'Дата вступления в силу: 10 сентября 2026 г.',
    sections: [
      {
        heading: '1. Какие данные мы собираем',
        body: 'Мы собираем следующие данные:\n\n• Данные учётной записи: имя, электронная почта, роль (учащийся/преподаватель), фото профиля.\n• Данные об использовании: курсы, уроки, результаты, активность.\n• Платёжные данные: история транзакций (полные данные карт остаются в платёжной системе, а не у нас).\n• Технические данные: устройство, браузер, приблизительное местоположение, файлы cookie.',
      },
      {
        heading: '2. Как мы используем данные',
        body: 'Мы используем собранные данные для следующих целей:\n\n• Предоставление Платформы, управление учётной записью и доступом.\n• Обработка платежей и запись на курсы.\n• Обеспечение безопасности и предотвращение мошенничества.\n• Улучшение сервиса и отправка релевантных уведомлений.',
      },
      {
        heading: '3. Файлы cookie',
        body: 'Мы используем необходимые (сессия, безопасность) и необязательные (аналитика, маркетинг) файлы cookie. При посещении сайта вы можете управлять необязательными cookie через панель согласия. Необходимые cookie обязательны для работы Платформы.',
      },
      {
        heading: '4. Передача данных третьим лицам',
        body: 'Мы не продаём ваши данные. Для оказания услуг мы передаём данные надёжным поставщикам в необходимом объёме:\n\n• Платежи: Click, Payme.\n• Видеохостинг: Bunny Stream.\n• Доставка e-mail: Resend.\n• Аутентификация: Google (при входе через Google).\n• Хранение файлов: Cloudflare R2.\n\nЭти поставщики обрабатывают данные только для оказания нам услуг.',
      },
      {
        heading: '5. Срок хранения данных',
        body: 'Мы храним ваши данные в течение периода активности учётной записи и в течение срока, требуемого законом (например, бухгалтерия, споры). При закрытии учётной записи данные удаляются или анонимизируются, когда это разрешено законом.',
      },
      {
        heading: '6. Безопасность',
        body: 'Мы применяем технические и организационные меры защиты: шифрованное соединение (HTTPS), хранение паролей в виде хеша, ограничение доступа и защищённую доставку видео. Однако помните, что ни один метод в интернете не является на 100% безопасным.',
      },
      {
        heading: '7. Ваши права',
        body: 'Вы вправе получить доступ к своим данным, исправить или запросить их удаление. Многие данные вы можете обновить сами в настройках профиля; по дополнительным запросам свяжитесь с нами.',
      },
      {
        heading: '8. Конфиденциальность детей',
        body: 'Платформа может использоваться несовершеннолетними под контролем и с согласия родителя или законного представителя. Мы сознательно не собираем персональные данные малолетних без разрешения.',
      },
      {
        heading: '9. Международная передача',
        body: 'Серверы некоторых наших поставщиков услуг могут находиться за пределами Узбекистана. В таких случаях данные обрабатываются с применением соответствующих мер защиты.',
      },
      {
        heading: '10. Изменения',
        body: 'Мы можем периодически обновлять настоящую Политику. О существенных изменениях сообщается на Платформе, а дата обновления указывается выше.',
      },
      {
        heading: '11. Контакты',
        body: `По вопросам конфиденциальности свяжитесь с нами: ${CONTACT_EMAIL}`,
      },
    ],
  },
  en: {
    title: 'Privacy Policy',
    intro:
      'UstozEdu (ustozedu.uz) values your privacy. This Privacy Policy explains what data we collect, how we use it, and how we protect it.',
    effectiveDate: 'Effective date: September 10, 2026',
    sections: [
      {
        heading: '1. Data we collect',
        body: 'We collect the following data:\n\n• Account data: name, email, role (student/teacher), profile photo.\n• Usage data: courses, lessons, results, activity.\n• Payment data: transaction history (full card details remain with the payment system, not us).\n• Technical data: device, browser, approximate location, cookies.',
      },
      {
        heading: '2. How we use data',
        body: 'We use the collected data for the following purposes:\n\n• Providing the Platform, managing your account and access.\n• Processing payments and course enrollment.\n• Ensuring security and preventing fraud.\n• Improving the service and sending you relevant notifications.',
      },
      {
        heading: '3. Cookies',
        body: 'We use essential (session, security) and optional (analytics, marketing) cookies. When you visit the site, you can manage optional cookies via the consent banner. Essential cookies are required for the Platform to function.',
      },
      {
        heading: '4. Sharing with third parties',
        body: 'We do not sell your data. To provide the service, we share data with trusted providers to the extent necessary:\n\n• Payments: Click, Payme.\n• Video hosting: Bunny Stream.\n• Email delivery: Resend.\n• Authentication: Google (if you sign in with Google).\n• File storage: Cloudflare R2.\n\nThese providers process data only to provide services to us.',
      },
      {
        heading: '5. Data retention',
        body: 'We retain your data while your account is active and for the period required by law (e.g., accounting, disputes). When your account is closed, data is deleted or anonymized where permitted by law.',
      },
      {
        heading: '6. Security',
        body: 'We apply technical and organizational measures to protect your data: encrypted connections (HTTPS), hashed password storage, access controls, and protected video delivery. However, note that no method on the internet is 100% secure.',
      },
      {
        heading: '7. Your rights',
        body: 'You have the right to access, correct, or request deletion of your data. You can update much of your data yourself in profile settings; for additional requests, contact us.',
      },
      {
        heading: '8. Children’s privacy',
        body: 'The Platform may be used by minors under the supervision and consent of a parent or legal guardian. We do not knowingly collect personal data from young children without permission.',
      },
      {
        heading: '9. International transfers',
        body: 'Some of our service providers’ servers may be located outside Uzbekistan. In such cases, data is processed with appropriate safeguards.',
      },
      {
        heading: '10. Changes',
        body: 'We may update this Privacy Policy from time to time. Material changes will be announced on the Platform, and the updated date is shown above.',
      },
      {
        heading: '11. Contact',
        body: `For privacy questions, contact us: ${CONTACT_EMAIL}`,
      },
    ],
  },
};

export function getTermsContent(locale: Locale): LegalDoc {
  return TERMS[locale] ?? TERMS.uz;
}

export function getPrivacyContent(locale: Locale): LegalDoc {
  return PRIVACY[locale] ?? PRIVACY.uz;
}
