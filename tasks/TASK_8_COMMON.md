# TASK 8 — COMMON COMPONENTS + NOTIFICATIONS + LANDING
**Branch:** `feature/common-components`  
**Daraja:** O'rta (nisbatan oson)

---

## Nima qilasiz?

Bildirishnomalar (NotificationBell), yordamchi servis va landing page ni API ga ulaysiz.

---

## Qaysi fayllarni o'zgartirasiz?

1. `src/components/common/NotificationBell.tsx`
2. `src/lib/supabase/notificationService.ts`
3. `src/app/landing-page/components/LandingPageInteractive.tsx`

---

## FAYL 1: `src/components/common/NotificationBell.tsx`

Bu faylni **to'liq** quyidagi bilan almashtiring:

```typescript
'use client'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface Notification {
  id: string
  title: string
  message: string
  isRead: boolean
  type: string
  createdAt: string
}

export function NotificationBell() {
  const { isAuthenticated } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchNotifications = async () => {
    if (!isAuthenticated) return
    try {
      const res = await fetch('/api/notifications', { credentials: 'include' })
      if (!res.ok) return
      const { notifications } = await res.json()
      setNotifications(notifications || [])
    } catch {}
  }

  // Login bo'lganda yuklash va har 30 soniyada yangilash
  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([])
      return
    }
    fetchNotifications()
    intervalRef.current = setInterval(fetchNotifications, 30000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isAuthenticated])

  const markAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ isRead: true }),
    })
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
    )
  }

  const markAllAsRead = async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ markAllRead: true }),
    })
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  const deleteNotification = async (id: string) => {
    await fetch(`/api/notifications/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  if (!isAuthenticated) return null

  return (
    <div className="relative">
      {/* Bell tugmasi */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
          <div className="p-3 border-b flex justify-between items-center">
            <h3 className="font-semibold">Bildirishnomalar</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:underline"
              >
                Barchasini o'qilgan deb belgilash
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-center text-gray-500 text-sm">
                Bildirishnomalar yo'q
              </p>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`p-3 border-b hover:bg-gray-50 ${!n.isRead ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => !n.isRead && markAsRead(n.id)}
                    >
                      <p className={`text-sm font-medium ${!n.isRead ? 'text-blue-800' : 'text-gray-800'}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(n.createdAt).toLocaleDateString('uz-UZ')}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteNotification(n.id)}
                      className="text-gray-400 hover:text-red-500 text-xs shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tashqarini bosganida yopish */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
```

---

## FAYL 2: `src/lib/supabase/notificationService.ts`

Bu faylni to'liq tozalang va oddiy funksiyalar bilan almashtiring:

```typescript
// Supabase real-time o'chirildi, oddiy API funksiyalar

export async function fetchNotifications() {
  const res = await fetch('/api/notifications', { credentials: 'include' })
  if (!res.ok) return []
  const { notifications } = await res.json()
  return notifications || []
}

export async function markNotificationRead(id: string) {
  await fetch(`/api/notifications/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ isRead: true }),
  })
}

export async function deleteNotification(id: string) {
  await fetch(`/api/notifications/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })
}
```

---

## FAYL 3: `src/app/landing-page/components/LandingPageInteractive.tsx`

```typescript
'use client'
import { useState, useEffect } from 'react'

// Ommabop kurslar:
const [popularCourses, setPopularCourses] = useState<any[]>([])
const [stats, setStats] = useState({ courses: 0, students: 0, teachers: 0 })

useEffect(() => {
  // Ommabop kurslar (ko'p enrolled)
  fetch('/api/courses?limit=6&sortBy=enrollments')
    .then(r => r.json())
    .then(({ courses, pagination }) => {
      setPopularCourses(courses || [])
      setStats(prev => ({ ...prev, courses: pagination?.total || 0 }))
    })
}, [])

// Narxni ko'rsatish:
const formatPrice = (price: string) =>
  Number(price) === 0 ? 'Bepul' : `${Number(price).toLocaleString()} so'm`
```

---

## `/api/notifications` API qanday ishlaydi (ma'lumot uchun)

`/api/notifications/route.ts` allaqachon mavjud. U quyidagilarni qo'llab-quvvatlaydi:

```
GET  /api/notifications          — barcha bildirishnomalar
PATCH /api/notifications         — { markAllRead: true } → barchasini o'qilgan belgilash
PATCH /api/notifications/[id]    — { isRead: true } → bitta o'qilgan
DELETE /api/notifications/[id]   — bitta o'chirish
```

---

## `/api/notifications/[id]` route bormi tekshiring

Agar `src/app/api/notifications/[id]/route.ts` yo'q bo'lsa, yarating:

```typescript
import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { jsonResponse } from '@/lib/json'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(req)
  if (!session) return jsonResponse({ error: 'Kirish talab qilinadi' }, { status: 401 })

  const { id } = await params
  const { isRead } = await req.json()

  const notification = await prisma.notification.findFirst({
    where: { id, userId: session.sub },
  })
  if (!notification) return jsonResponse({ error: 'Topilmadi' }, { status: 404 })

  const updated = await prisma.notification.update({
    where: { id },
    data: { isRead },
  })
  return jsonResponse({ notification: updated })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(req)
  if (!session) return jsonResponse({ error: 'Kirish talab qilinadi' }, { status: 401 })

  const { id } = await params

  const notification = await prisma.notification.findFirst({
    where: { id, userId: session.sub },
  })
  if (!notification) return jsonResponse({ error: 'Topilmadi' }, { status: 404 })

  await prisma.notification.delete({ where: { id } })
  return jsonResponse({ success: true })
}
```

---

## TEST QILISH

1. Login qiling
2. Header'da bell ikonka ko'rinsinmi?
3. Bosib ochganingizda dropdown chiqsinmi?
4. `/` (landing page) — ommabop kurslar ko'rinsinmi?
5. `http://localhost:3000/api/notifications` — JSON kelsinmi?

---

## COMMIT NAMUNASI

```bash
git commit -m "feat: notifications - Supabase realtime o'chirildi, polling qo'shildi"
git commit -m "feat: landing-page - ommabop kurslar API dan olinmoqda"
git commit -m "feat: notifications/[id] - PATCH/DELETE route yaratildi"
```
