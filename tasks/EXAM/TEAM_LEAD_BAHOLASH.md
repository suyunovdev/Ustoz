# TEAM LEAD — EXAM BAHOLASH QO'LLANMASI

---

## Vazifalar va qiyinlik darajasi

| Vazifa | Nima tekshiriladi | Daraja |
|--------|-------------------|--------|
| VAZIFA_1 | `useEffect`, `fetch`, `filter` | ⭐⭐ |
| VAZIFA_2 | Forma, validatsiya, `POST` | ⭐⭐ |
| VAZIFA_3 | Grid, filter tugmalari, narx formati | ⭐⭐ |
| VAZIFA_4 | State logikasi, `localStorage` | ⭐⭐⭐ |
| VAZIFA_5 | CRUD: GET + POST + DELETE | ⭐⭐⭐ |
| VAZIFA_6 | TypeScript interface, CSS chart | ⭐⭐⭐ |
| VAZIFA_7 | Multi-step forma, validatsiya | ⭐⭐⭐ |
| VAZIFA_8 | Taymer, quiz logikasi | ⭐⭐⭐⭐ |
| VAZIFA_9 | Dashboard, skeleton, tab filter | ⭐⭐⭐⭐ |
| VAZIFA_10 | To'liq mini loyiha, modal, TypeScript | ⭐⭐⭐⭐⭐ |

---

## Talabalarni qanday taqsimlash tavsiya qilinadi

**Kuchli talabalar (3-4 nafar):** VAZIFA_7, 8, 9, 10 → ular loyihada Task 4 (Payment), Task 5 (Course Creation), Task 7 (Admin) ni bajaradi

**O'rta talabalar (3-4 nafar):** VAZIFA_4, 5, 6 → Task 2, 3, 6 ni bajaradi

**Oddiy talabalar:** VAZIFA_1, 2, 3 → Task 1 (Auth), Task 8 (Common) ni bajaradi

---

## PR ni qanday tekshirish

### 1. Kod ishlayaptimi?
```bash
git fetch origin
git checkout exam/talaba-ism
npm run dev
# http://localhost:3000/exam-N sahifasini oching
```

### 2. Tekshirish ro'yxati

**Minimal talablar (70 ball uchun):**
- [ ] Sahifa `http://localhost:3000/exam-N` da ochiladi
- [ ] API yaratilib, ma'lumot qaytarayapti
- [ ] `fetch` + `useEffect` + `useState` to'g'ri ishlatilgan
- [ ] Asosiy funksional ishlaydi (filter, submit, delete...)

**Qo'shimcha balllar:**
- [ ] TypeScript `any` ishlatilmagan
- [ ] Loading holati bor
- [ ] Error holati bor
- [ ] Kod toza va o'qilishi oson

**Rad etish sabablari:**
- Sahifa umuman ochilmaydi
- `fetch` qo'llanilmagan (hardcoded data)
- Asosiy funksional ishlamaydi

---

## Baholash jadvali

| Talaba | Vazifa | Ishlaydi | To'liq | Toza kod | Vaqt | JAMI |
|--------|--------|----------|--------|----------|------|------|
| Talaba 1 | V-1 | /40 | /30 | /20 | /10 | /100 |
| Talaba 2 | V-2 | /40 | /30 | /20 | /10 | /100 |
| Talaba 3 | V-3 | /40 | /30 | /20 | /10 | /100 |
| ... | | | | | | |

**70+ ball** → loyihaga qabul ✅  
**50-69 ball** → qayta imtihon yoki kuzatchi sifatida qo'shish  
**50 dan kam** → qo'shmaslik  

---

## Tezkor tekshirish buyrug'lari

```bash
# TypeScript xatolari bormi?
npx tsc --noEmit

# Supabase import yo'qmi? (bo'lmasligi kerak)
grep -r "createClient\|supabase" src/app/exam-N/

# any ishlatilganmi?
grep -r ": any" src/app/exam-N/
```
