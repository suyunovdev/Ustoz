# Progress Tracking API

Student'ning kurs progress'i bilan ishlash uchun 3 ta endpoint.

**Auth:** JWT (HTTP-only cookie `ustoz_session`).
**Convention:** Error message'lar **O'zbek tilida**, response keys **camelCase**, error codes **SNAKE_CASE** (machine-readable).

---

## 1) `POST /api/topics/[id]/complete`

Student bitta mavzuni tugatdi.

### Request
```bash
curl -b cookie.txt -X POST \
  http://localhost:4028/api/topics/ef1ac66c-cd36-47ff-a4cd-23ddad960fdd/complete
```

### Response — 200 OK (yangi complete)
```json
{
  "success": true,
  "progress": 33,
  "isCourseCompleted": false,
  "wasAlreadyCompleted": false
}
```

### Response — 200 OK (idempotent: takror)
```json
{
  "success": true,
  "progress": 33,
  "isCourseCompleted": false,
  "wasAlreadyCompleted": true
}
```

### Response — 200 OK (kurs 100%)
```json
{
  "success": true,
  "progress": 100,
  "isCourseCompleted": true,
  "wasAlreadyCompleted": false,
  "shouldShowCertificateModal": true
}
```

### Xato javoblari

| HTTP | Vaziyat | Body |
|------|---------|------|
| 401  | Cookie yo'q / yaroqsiz | `{"error":"Autentifikatsiya talab qilinadi"}` |
| 403  | Role !== `student` | `{"error":"Faqat talabalar uchun"}` |
| 403  | Kursga yozilmagan | `{"error":"Avval kursga yoziling"}` |
| 404  | TopicId mavjud emas | `{"error":"Mavzu topilmadi"}` |
| 500  | Server xatosi | `{"error":"Server xatosi"}` |

---

## 2) `GET /api/enrollments/[courseId]/progress`

Bitta kurs uchun to'liq progress detail.

### Request
```bash
curl -b cookie.txt \
  http://localhost:4028/api/enrollments/b4798823-f88a-4807-b843-9c2c8aa94d35/progress
```

### Response — 200 OK
```json
{
  "courseId": "b4798823-f88a-4807-b843-9c2c8aa94d35",
  "progress": 67,
  "completedTopicIds": [
    "ef1ac66c-cd36-47ff-a4cd-23ddad960fdd",
    "c9fd2e90-1a80-49e2-a6ea-d6604840420d"
  ],
  "nextTopic": {
    "id": "0a987167-c1d4-4512-b98a-73426964238f",
    "title": "Funksiyalar",
    "orderIndex": 3
  },
  "isCompleted": false,
  "completedAt": null
}
```

### Response — kurs 100% tugatilgan
```json
{
  "courseId": "...",
  "progress": 100,
  "completedTopicIds": ["...", "...", "..."],
  "nextTopic": null,
  "isCompleted": true,
  "completedAt": "2026-05-27T11:41:40.609Z"
}
```

### Xato javoblari

| HTTP | Vaziyat | Body |
|------|---------|------|
| 401  | Cookie yo'q | `{"error":"Autentifikatsiya talab qilinadi"}` |
| 403  | Kursga yozilmagan | `{"error":"Siz bu kursga yozilmagansiz"}` |
| 500  | Server xatosi | `{"error":"Server xatosi"}` |

---

## 3) `GET /api/enrollments/my` (yangilangan)

Student dashboard'ning to'liq payload'i. Endi har bir enrollment uchun progress meta ham keladi.

### Request
```bash
curl -b cookie.txt http://localhost:4028/api/enrollments/my
```

### Response — 200 OK (yangi field'lar)
```json
{
  "enrollments": [
    {
      "id": "e39f675f-2815-475b-8969-14a503c5e115",
      "courseId": "b4798823-f88a-4807-b843-9c2c8aa94d35",
      "progress": 67,
      "enrolledAt": "2026-05-27T11:41:40.051Z",
      "completedAt": null,
      "isCompleted": false,
      "nextTopic": {
        "id": "0a987167-c1d4-4512-b98a-73426964238f",
        "title": "Funksiyalar",
        "orderIndex": 3
      },
      "completedTopicsCount": 2,
      "totalTopics": 3,
      "course": {
        "id": "...",
        "title": "Python asoslari",
        "coverImage": null,
        "totalTopics": 3,
        "totalDuration": 24,
        "teacherName": "Test Teacher",
        "teacherAvatar": null
      }
    }
  ],
  "recommended": [ /* unchanged */ ],
  "certificates": [ /* unchanged */ ],
  "stats": { /* unchanged */ }
}
```

### Yangi maydonlar (har `enrollments[i]` uchun)
- `nextTopic` — keyingi tugatilmagan topic yoki `null` (kurs 100%)
- `completedTopicsCount` — bu kursdagi tugatilgan topiclar soni
- `totalTopics` — bu kursdagi jami topiclar soni

### Performance
**Naive yondashuv (N+1):**
```ts
enrollments.map(async (e) => {
  const next = await getNextTopic(student, e.courseId);  // N+1!
});
```

**Bu API'da (helper bilan):**
- 2 ta qo'shimcha query — **N'ga bog'liq emas**:
  - `prisma.courseTopic.findMany({ where: { courseId: { in: ids } } })`
  - `prisma.topicCompletion.findMany({ where: { studentId, courseId: { in: ids } } })`
- Memory'da `Map<courseId, { nextTopic, completed, total }>` quriladi

Fayl: [src/lib/services/dashboard-progress.helper.ts](../../src/lib/services/dashboard-progress.helper.ts)

---

## Frontend foydalanish misoli

### Davom Ettirish card'i (Dashboard)
```tsx
const { data } = await fetch('/api/enrollments/my').then(r => r.json());

data.enrollments
  .filter(e => e.progress > 0 && !e.isCompleted)
  .map(e => (
    <ContinueLearningCard
      key={e.id}
      title={e.course.title}
      progress={e.progress}
      nextTopicTitle={e.nextTopic?.title || ''}
      onResume={() => router.push(
        `/learning-interface?courseId=${e.courseId}&topicId=${e.nextTopic?.id}`
      )}
    />
  ));
```

### Topic checklist (Learning interface)
```tsx
const { completedTopicIds, nextTopic, progress } = await fetch(
  `/api/enrollments/${courseId}/progress`
).then(r => r.json());

const completedSet = new Set(completedTopicIds);

topics.map(t => (
  <TopicRow
    key={t.id}
    title={t.title}
    isCompleted={completedSet.has(t.id)}
    isCurrent={t.id === nextTopic?.id}
  />
));
```

### Topic tugatish (Video tugagandan keyin)
```tsx
async function onTopicFinish(topicId: string) {
  const res = await fetch(`/api/topics/${topicId}/complete`, {
    method: 'POST',
    credentials: 'include',
  });
  const data = await res.json();

  if (data.shouldShowCertificateModal) {
    showCongratsModal(courseId);
  }

  // Optimistic: progress'ni darrov yangilash
  setProgress(data.progress);

  if (!data.wasAlreadyCompleted) {
    showToast(`+1 mavzu tugatildi · ${data.progress}%`);
  }
}
```

---

## Tekshirish checklist

- [x] Auth yo'q — 401
- [x] Role student emas — 403 "Faqat talabalar uchun"
- [x] Topic mavjud emas — 404
- [x] Kursga yozilmagan — 403 "Avval kursga yoziling"
- [x] Birinchi marta complete — `wasAlreadyCompleted: false`
- [x] Takror complete — `wasAlreadyCompleted: true` (xato emas)
- [x] Kurs 100% — `isCourseCompleted: true, shouldShowCertificateModal: true`
- [x] 100% qayta complete — `isCourseCompleted: false` (faqat 1-marta)
- [x] N+1 yo'q — `/api/enrollments/my` har enrollment uchun emas, 2 ta umumiy query
- [x] TypeScript strict — `tsc -p tsconfig.json` 0 errors
- [x] Transaction atomicity — `markTopicComplete` to'liq atomic
- [x] Idempotency — DB unique constraint + service-level check
