'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';

import { useAuth } from '@/contexts/AuthContext';

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: 'teacher' | 'student' | '';
  language: 'uz' | 'ru' | 'en';
  profilePhoto: File | null;
  termsAccepted: boolean;
  privacyAccepted: boolean;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
  terms?: string;
  submit?: string;
  otp?: string;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

const RegistrationForm = () => {
  const router = useRouter();
  const { signUp, signIn, sendEmailOtp, verifyEmailOtp } = useAuth();
  const [isHydrated, setIsHydrated] = useState(false);
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: '',
    language: 'uz',
    profilePhoto: null,
    termsAccepted: false,
    privacyAccepted: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    label: '',
    color: 'bg-muted',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // OTP verification state
  const [showOtpStep, setShowOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [registeredEmail, setRegisteredEmail] = useState('');
  // Store password temporarily for post-OTP sign-in
  const [registeredPassword, setRegisteredPassword] = useState('');
  const [registeredRole, setRegisteredRole] = useState<'teacher' | 'student' | ''>('');
  // Dev mode: OTP shown if email delivery failed
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [emailDelivered, setEmailDelivered] = useState(true);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const calculatePasswordStrength = (password: string): PasswordStrength => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    const strengths: PasswordStrength[] = [
      { score: 0, label: '', color: 'bg-muted' },
      { score: 1, label: 'Juda zaif', color: 'bg-destructive' },
      { score: 2, label: 'Zaif', color: 'bg-warning' },
      { score: 3, label: "O'rtacha", color: 'bg-accent' },
      { score: 4, label: 'Kuchli', color: 'bg-success' },
      { score: 5, label: 'Juda kuchli', color: 'bg-success' },
    ];

    return strengths[score];
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^\+998[0-9]{9}$/;
    return phoneRegex.test(phone);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "To'liq ismingizni kiriting";
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = "Ism kamida 3 ta belgidan iborat bo'lishi kerak";
    }

    if (authMethod === 'email') {
      if (!formData.email.trim()) {
        newErrors.email = 'Email manzilni kiriting';
      } else if (!validateEmail(formData.email)) {
        newErrors.email = "Noto'g'ri email manzil formati";
      }
    } else {
      if (!formData.phone.trim()) {
        newErrors.phone = 'Telefon raqamni kiriting';
      } else if (!validatePhone(formData.phone)) {
        newErrors.phone = "Telefon raqam +998XXXXXXXXX formatida bo'lishi kerak";
      }
    }

    if (!formData.password) {
      newErrors.password = 'Parolni kiriting';
    } else if (formData.password.length < 8) {
      newErrors.password = "Parol kamida 8 ta belgidan iborat bo'lishi kerak";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Parolni tasdiqlang';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Parollar mos kelmaydi';
    }

    if (!formData.role) {
      newErrors.role = 'Rolni tanlang';
    }

    if (!formData.termsAccepted || !formData.privacyAccepted) {
      newErrors.terms = "Shartlar va maxfiylik siyosatini qabul qilishingiz kerak";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (field === 'password' && typeof value === 'string') {
      setPasswordStrength(calculatePasswordStrength(value));
    }

    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handlePhotoUpload = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    const maxSize = 5 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      alert('Faqat JPG, PNG yoki WEBP formatdagi rasmlar qabul qilinadi');
      return;
    }

    if (file.size > maxSize) {
      alert('Rasm hajmi 5MB dan oshmasligi kerak');
      return;
    }

    setFormData((prev) => ({ ...prev, profilePhoto: file }));
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handlePhotoUpload(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePhotoUpload(file);
    }
  };

  const handleGoogleSignUp = async () => {
    // Google OAuth hozircha yoqilmagan
    setErrors({ submit: 'Google orqali ro\'yxatdan o\'tish hozircha mavjud emas. Iltimos email orqali davom eting.' });
  };

  // Verify OTP code and then sign the user in
  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length < 6) {
      setErrors({ otp: "6 xonali kodni kiriting" });
      return;
    }

    setIsVerifying(true);
    setErrors({});

    try {
      // Verify OTP — backend OTP'ni tekshiradi va user yaratadi (session cookie qo'yadi)
      const result = await verifyEmailOtp(
        registeredEmail || formData.email,
        otpCode,
        {
          fullName: formData.fullName,
          password: registeredPassword || formData.password,
          role: registeredRole || formData.role,
        }
      );

      // Session cookie set by verify-otp — redirect by role
      if (result?.user) {
        if ((registeredRole || formData.role) === 'teacher') {
          router.push('/teacher-dashboard');
        } else {
          router.push('/student-dashboard');
        }
      } else {
        router.push('/login?registered=true&email=' + encodeURIComponent(registeredEmail || formData.email));
      }
    } catch (error: any) {
      setErrors({
        otp:
          error.message === 'Token has expired or is invalid' ? "Kod noto'g'ri yoki muddati tugagan. Qayta yuboring." : error.message ||"Tasdiqlashda xatolik yuz berdi",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setErrors({});

    try {
      const result = await sendEmailOtp(registeredEmail || formData.email);
      setDevOtp(result?.devOtp || null);
      setEmailDelivered(!!result?.emailDelivered);
      setResendCooldown(60);
    } catch (error: any) {
      setErrors({ otp: error.message || "Kod yuborishda xatolik" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const result = await signUp(formData.email, formData.password, {
        fullName: formData.fullName,
        role: formData.role,
        avatarUrl: '',
      });

      if (result?.user) {
        const emailToVerify = formData.email;
        setRegisteredEmail(emailToVerify);
        setRegisteredPassword(formData.password);
        setRegisteredRole(formData.role);

        if (!result.session) {
          // signUp() allaqachon send-otp chaqirdi — qayta yubormaymiz
          setDevOtp(result.devOtp || null);
          setEmailDelivered(!!result.emailDelivered);
          setShowOtpStep(true);
          setResendCooldown(60);
        } else {
          // Auto-confirmed — session exists, redirect directly
          if (formData.role === 'teacher') {
            router.push('/teacher-dashboard');
          } else {
            router.push('/student-dashboard');
          }
        }
      }
    } catch (error: any) {
      console.error('Registration error:', error.message);

      if (error.message.includes('Anonymous sign-ins are disabled')) {
        setErrors({
          submit:
            "⚠️ Supabase sozlamalari: Email autentifikatsiya yoqilmagan. Supabase Dashboard → Authentication → Providers → Email bo'limida 'Enable Email provider' ni yoqing.",
        });
      } else if (
        error.message.includes('User already registered') ||
        error.message.includes('already been registered')
      ) {
        setErrors({
          email: "Bu email manzil allaqachon ro'yxatdan o'tgan",
        });
      } else {
        setErrors({
          submit: error.message || "Ro'yxatdan o'tishda xatolik yuz berdi",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  // OTP Verification Step
  if (showOtpStep) {
    return (
      <div className="w-full max-w-2xl mx-auto bg-card rounded-lg shadow-warm-lg p-6 sm:p-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Icon name="EnvelopeIcon" size={32} className="text-primary" />
            </div>
            <h2 className="text-2xl font-heading font-bold text-foreground">
              Emailni tasdiqlang
            </h2>
            <p className="text-muted-foreground">
              {registeredEmail || formData.email} manziliga 6 xonali tasdiqlash kodi yuborildi
            </p>
          </div>

          {/* OTP Input */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-foreground">
              Tasdiqlash kodi *
            </label>
            <input
              type="text"
              value={otpCode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                setOtpCode(val);
                if (errors.otp) setErrors(prev => ({ ...prev, otp: undefined }));
              }}
              placeholder="000000"
              maxLength={6}
              className={`w-full px-4 py-4 text-center text-2xl font-bold tracking-widest rounded-md border ${
                errors.otp ? 'border-destructive' : 'border-input'
              } bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-smooth`}
              disabled={isVerifying}
              autoFocus
            />
            {errors.otp && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <Icon name="ExclamationCircleIcon" size={16} />
                {errors.otp}
              </p>
            )}
          </div>

          {/* Verify Button */}
          <button
            type="button"
            onClick={handleVerifyOtp}
            disabled={isVerifying || otpCode.length < 6}
            className="w-full py-4 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isVerifying ? (
              <>
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                <span>Tekshirilmoqda...</span>
              </>
            ) : (
              <>
                <Icon name="CheckCircleIcon" size={20} />
                <span>Tasdiqlash</span>
              </>
            )}
          </button>

          {/* Resend */}
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">Kod kelmadimi?</p>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendCooldown > 0}
              className="text-sm text-primary hover:underline disabled:text-muted-foreground disabled:no-underline disabled:cursor-not-allowed"
            >
              {resendCooldown > 0
                ? `Qayta yuborish (${resendCooldown}s)`
                : 'Kodni qayta yuborish'}
            </button>
          </div>

          {/* Back button */}
          <button
            type="button"
            onClick={() => {
              setShowOtpStep(false);
              setOtpCode('');
              setErrors({});
            }}
            className="w-full py-3 bg-muted text-foreground rounded-md font-medium hover:bg-muted/80 transition-smooth flex items-center justify-center space-x-2"
          >
            <Icon name="ArrowLeftIcon" size={18} />
            <span>Orqaga qaytish</span>
          </button>

          {/* Dev mode: OTP ko'rsatish (faqat email yuborilmagan bo'lsa) */}
          {devOtp && !emailDelivered && (
            <div className="p-4 bg-warning/10 rounded-md border-2 border-warning/40">
              <div className="flex items-start space-x-3">
                <Icon name="ExclamationTriangleIcon" size={20} className="text-warning flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground mb-1">
                    Dev rejimi — email yuborilmadi
                  </p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Resend free plan faqat verified email'ga yuboradi. Test uchun kod:
                  </p>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setOtpCode(devOtp)}
                      className="inline-block text-3xl font-bold tracking-[0.5em] text-warning bg-card px-4 py-2 rounded-md border border-warning/30 hover:bg-warning/5 transition-smooth cursor-pointer"
                      title="Bosing — avtomatik to'ldiriladi"
                    >
                      {devOtp}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Info box */}
          <div className="p-4 bg-secondary/10 rounded-md border border-secondary/20">
            <div className="flex items-start space-x-3">
              <Icon name="InformationCircleIcon" size={20} className="text-secondary flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                {emailDelivered
                  ? 'Spam papkasini ham tekshiring. Kod 10 daqiqa davomida amal qiladi.'
                  : 'Kod 10 daqiqa davomida amal qiladi.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-card rounded-lg shadow-warm-lg p-6 sm:p-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">
            Ro'yxatdan o'tish
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            O'qituvchi yoki talaba sifatida platformaga qo'shiling
          </p>
        </div>

        {/* Auth Method Tabs - Email only, phone disabled */}
        <div className="flex gap-2 p-1 bg-muted rounded-lg">
          <button
            type="button"
            onClick={() => setAuthMethod('email')}
            className="flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-smooth bg-primary text-primary-foreground shadow-sm"
          >
            <div className="flex items-center justify-center gap-2">
              <Icon name="EnvelopeIcon" size={18} />
              <span>Elektron pochta</span>
            </div>
          </button>
          <button
            type="button"
            disabled
            title="Telefon orqali ro'yxatdan o'tish hozircha mavjud emas"
            className="flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-smooth text-muted-foreground opacity-50 cursor-not-allowed"
          >
            <div className="flex items-center justify-center gap-2">
              <Icon name="PhoneIcon" size={18} />
              <span>Telefon raqam</span>
            </div>
          </button>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <div className="space-y-2">
            <label htmlFor="fullName" className="block text-sm font-medium text-foreground">
              To'liq ism
            </label>
            <div className="relative">
              <input
                type="text"
                id="fullName"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="Ismingiz va familiyangiz"
                className={`w-full px-4 py-3 pl-11 rounded-md border ${
                  errors.fullName ? 'border-destructive' : 'border-input'
                } bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-smooth`}
                disabled={isSubmitting}
              />
              <Icon name="UserIcon" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
            {errors.fullName && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <Icon name="ExclamationCircleIcon" size={16} />
                {errors.fullName}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              Elektron pochta
            </label>
            <div className="relative">
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="sizning@email.uz"
                className={`w-full px-4 py-3 pl-11 rounded-md border ${
                  errors.email ? 'border-destructive' : 'border-input'
                } bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-smooth`}
                disabled={isSubmitting}
              />
              <Icon name="EnvelopeIcon" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
            {errors.email && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <Icon name="ExclamationCircleIcon" size={16} />
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-foreground">
              Parol *
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`w-full px-4 py-3 pl-12 pr-12 bg-background border rounded-md focus:outline-none focus:ring-2 transition-smooth ${
                  errors.password ? 'border-destructive focus:ring-destructive' : 'border-input focus:ring-ring'
                }`}
                placeholder="Kamida 8 ta belgi"
              />
              <Icon name="LockClosedIcon" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-smooth"
              >
                <Icon name={showPassword ? 'EyeSlashIcon' : 'EyeIcon'} size={20} />
              </button>
            </div>
            {formData.password && (
              <div className="mt-2">
                <div className="flex items-center space-x-2 mb-1">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${passwordStrength.color}`}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">{passwordStrength.label}</span>
                </div>
              </div>
            )}
            {errors.password && (
              <p className="mt-1 text-sm text-destructive flex items-center space-x-1">
                <Icon name="ExclamationCircleIcon" size={16} />
                <span>{errors.password}</span>
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
              Parolni tasdiqlang *
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className={`w-full px-4 py-3 pl-12 pr-12 bg-background border rounded-md focus:outline-none focus:ring-2 transition-smooth ${
                  errors.confirmPassword ? 'border-destructive focus:ring-destructive' : 'border-input focus:ring-ring'
                }`}
                placeholder="Parolni qayta kiriting"
              />
              <Icon name="LockClosedIcon" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-smooth"
              >
                <Icon name={showConfirmPassword ? 'EyeSlashIcon' : 'EyeIcon'} size={20} />
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-destructive flex items-center space-x-1">
                <Icon name="ExclamationCircleIcon" size={16} />
                <span>{errors.confirmPassword}</span>
              </p>
            )}
          </div>

          {/* Profile Photo Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Profil rasmi (ixtiyoriy)
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-md p-6 transition-smooth ${
                isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              }`}
            >
              {photoPreview ? (
                <div className="flex items-center space-x-4">
                  <AppImage src={photoPreview} alt="Profile preview" className="w-20 h-20 rounded-full object-cover" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Rasm yuklandi</p>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, profilePhoto: null }));
                        setPhotoPreview('');
                      }}
                      className="text-sm text-destructive hover:underline"
                    >
                      O'chirish
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <Icon name="PhotoIcon" size={48} className="mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-foreground mb-1">Rasmni bu yerga torting yoki</p>
                  <label className="inline-block">
                    <span className="text-sm text-primary hover:underline cursor-pointer">faylni tanlang</span>
                    <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                  </label>
                  <p className="text-xs text-muted-foreground mt-2">JPG, PNG yoki WEBP (max 5MB)</p>
                </div>
              )}
            </div>
          </div>

          {/* Role Selection */}
          <div className="bg-card rounded-md p-6 shadow-warm">
            <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Rolni tanlang *</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleInputChange('role', 'teacher')}
                className={`p-6 rounded-md border-2 transition-smooth text-left ${
                  formData.role === 'teacher' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-md ${formData.role === 'teacher' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    <Icon name="AcademicCapIcon" size={24} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-heading font-semibold text-foreground mb-2">O'qituvchi</h4>
                    <p className="text-sm text-muted-foreground">Kurslar yarating, o'qituvchilik qiling va daromad oling</p>
                  </div>
                  {formData.role === 'teacher' && <Icon name="CheckCircleIcon" size={24} className="text-primary" />}
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleInputChange('role', 'student')}
                className={`p-6 rounded-md border-2 transition-smooth text-left ${
                  formData.role === 'student' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-md ${formData.role === 'student' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    <Icon name="BookOpenIcon" size={24} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-heading font-semibold text-foreground mb-2">Talaba</h4>
                    <p className="text-sm text-muted-foreground">Kurslarni sotib oling, o'rganing va sertifikat oling</p>
                  </div>
                  {formData.role === 'student' && <Icon name="CheckCircleIcon" size={24} className="text-primary" />}
                </div>
              </button>
            </div>
            {errors.role && (
              <p className="mt-3 text-sm text-destructive flex items-center space-x-1">
                <Icon name="ExclamationCircleIcon" size={16} />
                <span>{errors.role}</span>
              </p>
            )}
          </div>

          {/* Language Preference */}
          <div className="bg-card rounded-md p-6 shadow-warm">
            <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Til tanlovi</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { code: 'uz', name: "O'zbek", flag: '🇺🇿' },
                { code: 'ru', name: 'Русский', flag: '🇷🇺' },
                { code: 'en', name: 'English', flag: '🇬🇧' },
              ].map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleInputChange('language', lang.code)}
                  className={`p-4 rounded-md border-2 transition-smooth ${
                    formData.language === lang.code ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="text-center space-y-2">
                    <div className="text-3xl">{lang.flag}</div>
                    <div className="text-sm font-medium text-foreground">{lang.name}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Terms and Privacy */}
          <div className="bg-card rounded-md p-6 shadow-warm space-y-3">
            <label className="flex items-start space-x-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={formData.termsAccepted}
                onChange={(e) => handleInputChange('termsAccepted', e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-input text-primary focus:ring-2 focus:ring-ring cursor-pointer"
              />
              <span className="text-sm text-foreground group-hover:text-primary transition-smooth">
                Men{' '}
                <button type="button" onClick={() => setShowTermsModal(true)} className="text-primary hover:underline font-medium">
                  foydalanish shartlari
                </button>
                ni o'qib chiqdim va qabul qilaman
              </span>
            </label>

            <label className="flex items-start space-x-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={formData.privacyAccepted}
                onChange={(e) => handleInputChange('privacyAccepted', e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-input text-primary focus:ring-2 focus:ring-ring cursor-pointer"
              />
              <span className="text-sm text-foreground group-hover:text-primary transition-smooth">
                Men{' '}
                <button type="button" onClick={() => setShowPrivacyModal(true)} className="text-primary hover:underline font-medium">
                  maxfiylik siyosati
                </button>
                ni o'qib chiqdim va qabul qilaman
              </span>
            </label>

            {errors.terms && (
              <p className="text-sm text-destructive flex items-center space-x-1">
                <Icon name="ExclamationCircleIcon" size={16} />
                <span>{errors.terms}</span>
              </p>
            )}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{errors.submit}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                <span>Ro'yxatdan o'tilmoqda...</span>
              </>
            ) : (
              <>
                <Icon name="UserPlusIcon" size={20} />
                <span>Akkaunt yaratish</span>
              </>
            )}
          </button>
        </form>

        {/* Google Sign Up */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-background text-muted-foreground">yoki</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignUp}
          className="w-full py-4 bg-card border-2 border-border text-foreground rounded-md font-medium hover:bg-muted transition-smooth flex items-center justify-center space-x-3"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M19.6 10.227c0-.709-.064-1.39-.182-2.045H10v3.868h5.382a4.6 4.6 0 01-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.35z" fill="#4285F4"/>
            <path d="M10 20c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.595-4.123H1.064v2.59A9.996 9.996 0 000 10c0 1.614.386 3.14 1.064 4.49l3.34-2.59z" fill="#34A853"/>
            <path d="M4.405 11.9c-.2-.6-.314-1.24-.314-1.9 0-.66.114-1.3.314-1.9V5.51H1.064A9.996 9.996 0 000 10c0 1.614.386 3.14 1.064 4.49l3.34 2.59C5.19 5.736 7.395 3.977 10 3.977z" fill="#FBBC05"/>
            <path d="M10 3.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C14.959.99 12.695 0 10 0 6.09 0 2.71 2.24 1.064 5.51l3.34 2.59C5.19 5.736 7.395 3.977 10 3.977z" fill="#EA4335"/>
          </svg>
          <span>Google orqali ro'yxatdan o'tish</span>
        </button>

        {/* Login Link */}
        <p className="text-center text-sm text-muted-foreground">
          Hisobingiz bormi?{' '}
          <a href="/login" className="text-primary font-medium hover:underline">
            Kirish
          </a>
        </p>
      </div>

      {/* Terms Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-300 flex items-center justify-center p-4">
          <div className="bg-card rounded-md shadow-warm-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-xl font-heading font-semibold text-foreground">Foydalanish shartlari</h3>
              <button onClick={() => setShowTermsModal(false)} className="p-2 rounded-md hover:bg-muted transition-smooth">
                <Icon name="XMarkIcon" size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <p className="text-foreground">Ustoz platformasidan foydalanish orqali siz quyidagi shartlarga rozilik bildirasiz:</p>
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">1. Akkaunt mas'uliyati</h4>
                  <p className="text-muted-foreground text-sm">Siz o'z akkauntingiz xavfsizligi uchun to'liq javobgarsiz.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">2. Kontent siyosati</h4>
                  <p className="text-muted-foreground text-sm">Barcha yuklangan kontent mualliflik huquqlariga rioya qilishi kerak.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">3. To'lov shartlari</h4>
                  <p className="text-muted-foreground text-sm">O'qituvchilar sotuvdan 70% oladi, platforma 30% komissiya oladi.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">4. Qaytarish siyosati</h4>
                  <p className="text-muted-foreground text-sm">Kursni sotib olganingizdan keyin 7 kun ichida qaytarish mumkin.</p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-border">
              <button onClick={() => setShowTermsModal(false)} className="w-full py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-smooth">
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-300 flex items-center justify-center p-4">
          <div className="bg-card rounded-md shadow-warm-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-xl font-heading font-semibold text-foreground">Maxfiylik siyosati</h3>
              <button onClick={() => setShowPrivacyModal(false)} className="p-2 rounded-md hover:bg-muted transition-smooth">
                <Icon name="XMarkIcon" size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <p className="text-foreground">Ustoz platformasi sizning shaxsiy ma'lumotlaringizni quyidagicha himoya qiladi:</p>
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">1. Ma'lumotlar to'plash</h4>
                  <p className="text-muted-foreground text-sm">Biz faqat xizmatlarni taqdim etish uchun zarur bo'lgan ma'lumotlarni to'playmiz.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">2. Ma'lumotlardan foydalanish</h4>
                  <p className="text-muted-foreground text-sm">Sizning ma'lumotlaringiz faqat platforma xizmatlarini ko'rsatish uchun ishlatiladi.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">3. Ma'lumotlar xavfsizligi</h4>
                  <p className="text-muted-foreground text-sm">Barcha shaxsiy ma'lumotlar shifrlangan va xavfsiz serverlarda saqlanadi.</p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-border">
              <button onClick={() => setShowPrivacyModal(false)} className="w-full py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-smooth">
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationForm;