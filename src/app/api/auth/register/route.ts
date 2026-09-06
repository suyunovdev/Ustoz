import { NextResponse } from 'next/server';

/**
 * ESKIRGAN — o'chirilgan endpoint.
 *
 * Bu route email OTP tasdig'isiz akkaunt + sessiya yaratardi (xavfsizlik teshigi) va
 * hech qaysi client tomonidan ishlatilmaydi. Haqiqiy ro'yxatdan o'tish oqimi:
 *   POST /api/auth/send-otp  → email'ga kod
 *   POST /api/auth/verify-otp → kod tasdig'i + akkaunt yaratish (parol siyosati bilan)
 *
 * So'rovni 410 Gone bilan rad etamiz — regressiya monitoringi uchun ochiq qoldiriladi.
 */
export async function POST() {
  return NextResponse.json(
    { error: "Bu usul o'chirilgan. Ro'yxatdan o'tish uchun email tasdig'i (OTP) orqali davom eting." },
    { status: 410 },
  );
}
