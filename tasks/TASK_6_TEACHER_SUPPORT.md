# TASK 6 — TEACHER SUPPORT (GROUPS + UPLOAD)
**Branch:** `feature/teacher-support`  
**Daraja:** O'rta

---

## Nima qilasiz?

O'qituvchi guruh yaratish, material yuklash va topshiriq sahifalarini API ga ulaysiz. Shuningdek, materials uchun yangi API yaratish.

---

## Qaysi fayllarni o'zgartirasiz?

1. `src/app/group-creation/components/GroupCreationInteractive.tsx`
2. `src/app/content-upload-center/components/ContentUploadInteractive.tsx`
3. `src/app/content-upload-center/components/UploadArea.tsx`
4. `src/app/content-upload-center/components/ExternalLinkIntegration.tsx`
5. `src/app/assignment-submission-portal/page.tsx`
6. `src/app/assignment-management/page.tsx`

## Yangi fayl yaratasiz:

7. `src/app/api/teacher/materials/route.ts`

---

## YANGI FAYL: `src/app/api/teacher/materials/route.ts`

Papka: `src/app/api/teacher/materials/`  
Fayl: `route.ts`

```typescript
import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { jsonResponse } from '@/lib/json'

// GET /api/teacher/materials — teacher materiallarini olish
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'teacher') {
    return jsonResponse({ error: "Ruxsat yo'q" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const courseId = searchParams.get('courseId')

  const materials = await prisma.contentMaterial.findMany({
    where: {
      teacherId: session.sub,
      ...(courseId && { courseId }),
    },
    orderBy: { createdAt: 'desc' },
  })
  return jsonResponse({ materials })
}

// POST /api/teacher/materials — yangi material saqlash
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'teacher') {
    return jsonResponse({ error: "Ruxsat yo'q" }, { status: 403 })
  }

  const { courseId, title, fileUrl, fileType, fileSize, description } = await req.json()
  if (!courseId || !title || !fileUrl) {
    return jsonResponse({ error: 'courseId, title va fileUrl kerak' }, { status: 400 })
  }

  const material = await prisma.contentMaterial.create({
    data: {
      teacherId: session.sub,
      courseId,
      title,
      fileUrl,
      fileType: fileType || 'link',
      fileSize: fileSize ? BigInt(fileSize) : null,
      description: description || null,
    },
  })
  return jsonResponse({ material }, { status: 201 })
}

// DELETE /api/teacher/materials?id=xxx
export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'teacher') {
    return jsonResponse({ error: "Ruxsat yo'q" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return jsonResponse({ error: 'id kerak' }, { status: 400 })

  const material = await prisma.contentMaterial.findFirst({
    where: { id, teacherId: session.sub },
  })
  if (!material) return jsonResponse({ error: 'Topilmadi' }, { status: 404 })

  await prisma.contentMaterial.delete({ where: { id } })
  return jsonResponse({ success: true })
}
```

---

## FAYL 1: `src/app/group-creation/components/GroupCreationInteractive.tsx`

```typescript
'use client'
import { useState, useEffect } from 'react'

// O'qituvchi kurslariga yozilgan studentlar:
const [students, setStudents] = useState<any[]>([])
const [groups, setGroups] = useState<any[]>([])
const [selectedStudents, setSelectedStudents] = useState<string[]>([])
const [groupName, setGroupName] = useState('')

// Studentlar va guruhlarni yuklash:
useEffect(() => {
  Promise.all([
    fetch('/api/teacher/students', { credentials: 'include' }).then(r => r.json()),
    fetch('/api/teacher/groups', { credentials: 'include' }).then(r => r.json()),
  ]).then(([studentsData, groupsData]) => {
    setStudents(studentsData.students || [])
    setGroups(groupsData.groups || [])
  })
}, [])

// Guruh yaratish:
const handleCreateGroup = async () => {
  if (!groupName || selectedStudents.length === 0) {
    alert('Guruh nomi va kamida 1 ta student tanlang')
    return
  }

  const res = await fetch('/api/teacher/groups', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name: groupName, studentIds: selectedStudents }),
  })
  const data = await res.json()
  if (res.ok) {
    alert('Guruh yaratildi!')
    setGroupName('')
    setSelectedStudents([])
    // Guruhlar ro'yxatini yangilash:
    setGroups(prev => [...prev, data.group])
  } else {
    alert(data.error)
  }
}

// Student tanlash/bekor qilish:
const toggleStudent = (studentId: string) => {
  setSelectedStudents(prev =>
    prev.includes(studentId)
      ? prev.filter(id => id !== studentId)
      : [...prev, studentId]
  )
}
```

---

## FAYL 2: `src/app/content-upload-center/components/ContentUploadInteractive.tsx`

```typescript
const [materials, setMaterials] = useState<any[]>([])
const [courses, setCourses] = useState<any[]>([])
const [selectedCourse, setSelectedCourse] = useState('')

// Kurslar va materiallar yuklash:
useEffect(() => {
  Promise.all([
    fetch('/api/teacher/courses', { credentials: 'include' }).then(r => r.json()),
    fetch('/api/teacher/materials', { credentials: 'include' }).then(r => r.json()),
  ]).then(([coursesData, materialsData]) => {
    setCourses(coursesData.courses || [])
    setMaterials(materialsData.materials || [])
  })
}, [])

// Material o'chirish:
const handleDelete = async (materialId: string) => {
  const res = await fetch(`/api/teacher/materials?id=${materialId}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (res.ok) {
    setMaterials(prev => prev.filter(m => m.id !== materialId))
  }
}
```

---

## FAYL 3: `src/app/content-upload-center/components/UploadArea.tsx`

Fayl yuklash uchun (hozircha URL bo'yicha saqlash):

```typescript
const handleSaveUrl = async (url: string, title: string) => {
  const res = await fetch('/api/teacher/materials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      courseId: selectedCourseId,
      title,
      fileUrl: url,
      fileType: 'link',
    }),
  })
  const data = await res.json()
  if (res.ok) {
    onUploadSuccess?.(data.material)
  }
}
```

---

## FAYL 4: `src/app/content-upload-center/components/ExternalLinkIntegration.tsx`

```typescript
const handleSaveLink = async () => {
  const res = await fetch('/api/teacher/materials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      courseId: selectedCourseId,
      title: linkTitle,
      fileUrl: linkUrl,
      fileType: 'external',
      description: linkDescription,
    }),
  })
  if (res.ok) alert('Havola saqlandi!')
}
```

---

## FAYL 5 va 6: Assignment sahifalari

`src/app/assignment-submission-portal/page.tsx`:
```typescript
// Topshiriqlarni yuklash:
const [assignments, setAssignments] = useState<any[]>([])

useEffect(() => {
  const courseId = searchParams.get('courseId')
  if (!courseId) return
  fetch(`/api/assignments?courseId=${courseId}`, { credentials: 'include' })
    .then(r => r.json())
    .then(({ assignments }) => setAssignments(assignments || []))
}, [])

// Topshiriq yuborish:
const handleSubmit = async (assignmentId: string, content: string) => {
  await fetch('/api/assignments/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ assignmentId, content }),
  })
}
```

`src/app/assignment-management/page.tsx`:
```typescript
// Teacher topshiriqlarni ko'radi:
fetch('/api/teacher/assignments', { credentials: 'include' })
  .then(r => r.json())
  .then(({ assignments }) => setAssignments(assignments || []))
```

---

## TEST QILISH

1. Teacher sifatida login
2. `/group-creation` — enrolled studentlar ko'rinsinmi?
3. Guruh yarating → saqlash ishlayaptimi?
4. `/content-upload-center` — URL bo'yicha material qo'shing → ro'yxatda ko'rinsinmi?
5. `http://localhost:3000/api/teacher/materials` — JSON javob kelsinmi?

---

## COMMIT NAMUNASI

```bash
git commit -m "feat: groups - API ga ulandi, real students ko'rinadi"
git commit -m "feat: materials API - yaratildi (GET/POST/DELETE)"
git commit -m "feat: upload-center - material saqlash ishlaydi"
```
