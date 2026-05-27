'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';

interface LoginFormProps {
  onLanguageChange: (lang: string) => void;
  currentLanguage: string;
}

interface FormData {
  email: string;
  phone: string;
  password: string;
}

interface FormErrors {
  email?: string;
  phone?: string;
  password?: string;
  general?: string;
}

const LoginForm = ({ onLanguageChange, currentLanguage }: LoginFormProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const [isHydrated, setIsHydrated] = useState(false);
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [formData, setFormData] = useState<FormData>({
    email: '',
    phone: '',
    password: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const translations = {
    uz: {
      title: "Hisobingizga kiring",
      subtitle: "O'qituvchi yoki talaba sifatida platformaga kiring",
      email: "Elektron pochta",
      emailPlaceholder: "sizning@email.uz",
      password: "Parol",
      passwordPlaceholder: "Parolingizni kiriting",
      forgotPassword: "Parolni unutdingizmi?",
      signIn: "Kirish",
      orContinue: "Yoki davom eting",
      googleSignIn: "Google orqali kirish",
      noAccount: "Hisobingiz yo\'qmi?",
      createAccount: "Hisob yaratish",
      invalidEmail: "Yaroqli elektron pochta manzilini kiriting",
      invalidPassword: "Parol kamida 6 ta belgidan iborat bo\'lishi kerak",
      invalidCredentials: "Noto'g'ri elektron pochta yoki parol. Iltimos, qayta urinib ko'ring.",
      emailNotConfirmed: "Email tasdiqlanmagan. Emailingizni tekshiring va tasdiqlash havolasini bosing.",
    },
    ru: {
      title: "Войдите в свой аккаунт",
      subtitle: "Войдите на платформу как учитель или студент",
      email: "Электронная почта",
      emailPlaceholder: "your@email.ru",
      password: "Пароль",
      passwordPlaceholder: "Введите ваш пароль",
      forgotPassword: "Забыли пароль?",
      signIn: "Войти",
      orContinue: "Или продолжить с",
      googleSignIn: "Войти через Google",
      noAccount: "Нет аккаунта?",
      createAccount: "Создать аккаунт",
      invalidEmail: "Введите действительный адрес электронной почты",
      invalidPassword: "Пароль должен содержать не менее 6 символов",
      invalidCredentials: "Неверная электронная почта или пароль. Пожалуйста, попробуйте снова.",
      emailNotConfirmed: "Email не подтверждён. Проверьте почту и нажмите ссылку подтверждения.",
    },
    en: {
      title: "Sign in to your account",
      subtitle: "Access the platform as a teacher or student",
      email: "Email",
      emailPlaceholder: "your@email.com",
      password: "Password",
      passwordPlaceholder: "Enter your password",
      forgotPassword: "Forgot password?",
      signIn: "Sign In",
      orContinue: "Or continue with",
      googleSignIn: "Sign in with Google",
      noAccount: "Don\'t have an account?",
      createAccount: "Create account",
      invalidEmail: "Please enter a valid email address",
      invalidPassword: "Password must be at least 6 characters",
      invalidCredentials: "Invalid email or password. Please try again.",
      emailNotConfirmed: "Email not confirmed. Check your inbox and click the confirmation link.",
    }
  };

  const t = translations[currentLanguage as keyof typeof translations] || translations.uz;

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^\+998[0-9]{9}$/;
    return phoneRegex.test(phone);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: FormErrors = {};

    if (authMethod === 'email') {
      if (!formData.email) {
        newErrors.email = t.invalidEmail;
      } else if (!validateEmail(formData.email)) {
        newErrors.email = t.invalidEmail;
      }
    } else {
      if (!formData.phone) {
        newErrors.phone = 'Telefon raqamni kiriting';
      } else if (!validatePhone(formData.phone)) {
        newErrors.phone = "Telefon raqam +998XXXXXXXXX formatida bo'lishi kerak";
      }
    }

    if (!formData.password) {
      newErrors.password = t.invalidPassword;
    } else if (formData.password.length < 6) {
      newErrors.password = t.invalidPassword;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const identifier = authMethod === 'email' ? formData.email : formData.phone;
      const result = await signIn(identifier, formData.password, authMethod === 'phone');

      // signIn returns { user: { id, email, fullName, role, avatarUrl } } from JWT API
      const role = result?.user?.role;
      const redirectTo = searchParams?.get('redirect');

      if (redirectTo && redirectTo.startsWith('/')) {
        router.push(redirectTo);
      } else if (role === 'teacher') {
        router.push('/teacher-dashboard');
      } else if (role === 'admin') {
        router.push('/admin-dashboard');
      } else {
        router.push('/student-dashboard');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      if (
        error.message?.includes('Email not confirmed') ||
        error.message?.includes('email_not_confirmed')
      ) {
        setErrors({ general: t.emailNotConfirmed });
      } else if (
        error.message?.includes('Invalid login credentials') ||
        error.message?.includes('invalid_credentials')
      ) {
        setErrors({ general: t.invalidCredentials });
      } else {
        setErrors({ general: error.message || t.invalidCredentials });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    // Google OAuth hozircha yoqilmagan (JWT bilan ishlatish uchun Google OAuth setup kerak)
    setErrors({ general: 'Google orqali kirish hozircha mavjud emas. Iltimos email orqali kiring.' });
  };

  if (!isHydrated) {
    return (
      <div className="w-full max-w-md mx-auto bg-card rounded-lg shadow-warm-lg p-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="h-8 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
          </div>
          <div className="space-y-4">
            <div className="h-12 bg-muted rounded animate-pulse" />
            <div className="h-12 bg-muted rounded animate-pulse" />
            <div className="h-12 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto bg-card rounded-lg shadow-warm-lg p-6 sm:p-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">
            {t.title}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t.subtitle}
          </p>
        </div>

        {/* Auth Method Tabs */}
        <div className="flex gap-2 p-1 bg-muted rounded-lg">
          <button
            type="button"
            onClick={() => setAuthMethod('email')}
            className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-smooth ${
              authMethod === 'email' ?'bg-primary text-primary-foreground shadow-sm' :'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Icon name="EnvelopeIcon" size={18} />
              <span>Email</span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setAuthMethod('phone')}
            className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-smooth ${
              authMethod === 'phone' ?'bg-primary text-primary-foreground shadow-sm' :'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Icon name="PhoneIcon" size={18} />
              <span>Telefon</span>
            </div>
          </button>
        </div>

        {/* General Error */}
        {errors.general && (
          <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
            <Icon name="ExclamationCircleIcon" size={20} className="text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{errors.general}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email or Phone */}
          {authMethod === 'email' ? (
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                {t.email}
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder={t.emailPlaceholder}
                  className={`w-full px-4 py-3 pl-11 rounded-md border ${
                    errors.email ? 'border-destructive' : 'border-input'
                  } bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-smooth`}
                  disabled={isLoading}
                  autoComplete="email"
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
          ) : (
            <div className="space-y-2">
              <label htmlFor="phone" className="block text-sm font-medium text-foreground">
                Telefon raqam
              </label>
              <div className="relative">
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+998901234567"
                  className={`w-full px-4 py-3 pl-11 rounded-md border ${
                    errors.phone ? 'border-destructive' : 'border-input'
                  } bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-smooth`}
                  disabled={isLoading}
                />
                <Icon name="PhoneIcon" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
              {errors.phone && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <Icon name="ExclamationCircleIcon" size={16} />
                  {errors.phone}
                </p>
              )}
              <p className="text-xs text-muted-foreground">Format: +998XXXXXXXXX</p>
            </div>
          )}

          {/* Password */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                {t.password}
              </label>
              <Link
                href="/register"
                className="text-xs text-primary hover:underline"
              >
                {t.forgotPassword}
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder={t.passwordPlaceholder}
                className={`w-full px-4 py-3 pl-11 pr-11 rounded-md border ${
                  errors.password ? 'border-destructive' : 'border-input'
                } bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-smooth`}
                disabled={isLoading}
                autoComplete="current-password"
              />
              <Icon name="LockClosedIcon" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-smooth"
              >
                <Icon name={showPassword ? 'EyeSlashIcon' : 'EyeIcon'} size={20} />
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <Icon name="ExclamationCircleIcon" size={16} />
                {errors.password}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                <span>Kirilmoqda...</span>
              </>
            ) : (
              <span>{t.signIn}</span>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">{t.orContinue}</span>
          </div>
        </div>

        {/* Google Sign In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-input rounded-md bg-background text-foreground hover:bg-muted transition-smooth disabled:opacity-50"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span className="font-medium">{t.googleSignIn}</span>
        </button>

        {/* Register Link */}
        <p className="text-center text-sm text-muted-foreground">
          {t.noAccount}{' '}
          <Link href="/register" className="text-primary font-medium hover:underline">
            {t.createAccount}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;