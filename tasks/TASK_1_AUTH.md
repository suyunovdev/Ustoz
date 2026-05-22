# TASK 1 — AUTH MIGRATION
**Branch:** `feature/auth-migration`  
**Daraja:** O'rta (eng muhim task, diqqat bilan qiling)

---

## Nima qilasiz?

Foydalanuvchi kirish/chiqish tizimini Supabase dan yangi JWT API ga o'tasiz.

---

## Qaysi fayllarni o'zgartirasiz?

1. `src/contexts/AuthContext.tsx`
2. `src/app/login/components/LoginForm.tsx`
3. `src/app/register/components/RegistrationForm.tsx`
4. `src/components/common/RoleBasedHeader.tsx`

---

## FAYL 1: `src/contexts/AuthContext.tsx`

Bu faylni **to'liq quyidagi kod bilan almashtiring** (eski kodni o'chiring):

```typescript
'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  fullName: string
  role: 'student' | 'teacher' | 'admin'
  avatarUrl?: string | null
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const refreshUser = async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Login xatoligi')
    }
    await refreshUser()
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    setUser(null)
    router.push('/login')
  }

  useEffect(() => {
    refreshUser()
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: !!user, login, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

---

## FAYL 2: `src/app/login/components/LoginForm.tsx`

Faylni oching. `handleSubmit` yoki login funksiyasini toping va quyidagicha o'zgartiring:

```typescript
// Faylning boshiga qo'shing (agar yo'q bo'lsa):
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

// Komponent ichida:
const { login, user } = useAuth()
const router = useRouter()

// handleSubmit funksiyasi:
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setIsLoading(true)
  setError('')
  try {
    await login(email, password)
    // Login bo'lgandan keyin yo'naltirish:
    // (user hali yangilanmagan bo'lishi mumkin, shuning uchun /api/auth/me dan role olish kerak)
    const res = await fetch('/api/auth/me')
    const { user: me } = await res.json()
    if (me.role === 'teacher') router.push('/teacher-dashboard')
    else if (me.role === 'admin') router.push('/admin-dashboard')
    else router.push('/student-dashboard')
  } catch (err: any) {
    setError(err.message)
  } finally {
    setIsLoading(false)
  }
}
```

**O'chirish kerak bo'lgan narsalar:**
- `import { createClient } from '@/lib/supabase/client'`
- `const supabase = createClient()`
- `supabase.auth.signIn(...)` yoki shunga o'xshash

---

## FAYL 3: `src/app/register/components/RegistrationForm.tsx`

Ro'yxatdan o'tish 3 qadamdan iborat:

```typescript
// STATE:
const [step, setStep] = useState<'email' | 'otp' | 'password'>('email')
const [email, setEmail] = useState('')
const [otp, setOtp] = useState('')
const [password, setPassword] = useState('')
const [fullName, setFullName] = useState('')
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState('')

// 1-QADAM: Email kiritib OTP yuborish
const sendOtp = async () => {
  setIsLoading(true)
  const res = await fetch('/api/auth/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, type: 'signup' }),
  })
  const data = await res.json()
  if (res.ok) {
    setStep('otp')  // OTP kiritish sahifasiga o'tish
  } else {
    setError(data.error)
  }
  setIsLoading(false)
}

// 2-QADAM: OTP tekshirish
const verifyOtp = async () => {
  setIsLoading(true)
  const res = await fetch('/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp, type: 'signup' }),
  })
  const data = await res.json()
  if (res.ok) {
    setStep('password')  // Parol yaratish sahifasiga o'tish
  } else {
    setError(data.error)
  }
  setIsLoading(false)
}

// 3-QADAM: Ro'yxatdan o'tish
const register = async () => {
  setIsLoading(true)
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, fullName, role: 'student' }),
  })
  const data = await res.json()
  if (res.ok) {
    router.push('/student-dashboard')
  } else {
    setError(data.error)
  }
  setIsLoading(false)
}
```

---

## FAYL 4: `src/components/common/RoleBasedHeader.tsx`

```typescript
// Faylning boshiga:
import { useAuth } from '@/contexts/AuthContext'

// Komponent ichida:
const { user, logout, isLoading } = useAuth()

// Supabase ga murojaat qilgan joylarni o'chiring:
// supabase.auth.getUser() → user (useAuth dan)
// supabase.auth.signOut() → logout()
```

---

## TEST QILISH

1. `npm run dev` — xatosiz ishlasin
2. `/register` — email kiriting → OTP kelsinmi (email tekshiring)
3. OTP kiriting → parol yarating → `student-dashboard` ga tushing
4. `/login` — email + parol → kirish → dashboard
5. Header'dagi "Chiqish" → `/login` ga qaytish

---

## COMMIT NAMUNASI

```bash
git add .
git commit -m "feat: auth migration - AuthContext JWT ga o'tkazildi"
git add .
git commit -m "feat: auth migration - LoginForm va RegistrationForm ulandi"
```
