// @ts-nocheck
declare const Deno: { env: { get(key: string): string | undefined } };

import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// MUHIM: FROM manzilini o'zingizning Resend'da tasdiqlangan domenga o'zgartiring
// Masalan: "noreply@ustoz.uz" yoki "noreply@sizning-domen.uz"
// Test uchun faqat o'zingizning emailingizga yuboriladi (Resend cheklovi)
const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "onboarding@resend.dev";

function generateOtp(): string {
  // Kriptografik xavfsiz OTP — Math.random() emas
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const otp = (array[0] % 900000) + 100000;
  return otp.toString();
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Content-Type": "application/json",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, type } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    if (!RESEND_API_KEY || RESEND_API_KEY === "your-resend-api-key-here") {
      console.error("RESEND_API_KEY sozlanmagan");
      return new Response(JSON.stringify({ error: "Email xizmati sozlanmagan. Admin bilan bog'laning." }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Upsert OTP — ham yangi yozuv qo'shadi, ham eskisini yangilaydi
    // attempt_count va locked_until ham reset qilinadi (yangi kod yuborilganda)
    const { error: dbError } = await supabase
      .from("otp_codes")
      .upsert(
        {
          email,
          otp,
          expires_at: expiresAt,
          verified: false,
          type: type || "signup",
          attempt_count: 0,
          locked_until: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      );

    if (dbError) {
      console.error("DB error:", dbError);
      return new Response(JSON.stringify({ error: "Failed to store OTP" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    const isPasswordReset = type === "password_reset";
    const subject = isPasswordReset
      ? "Ustoz Ta'lim - Parolni tiklash kodi"
      : "Ustoz Ta'lim - Email tasdiqlash kodi";
    const purposeText = isPasswordReset
      ? "parolingizni tiklash"
      : "emailingizni tasdiqlash";

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: email,
        subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #1a1a2e; font-size: 24px; margin: 0;">Ustoz Ta'lim</h1>
              <p style="color: #6b7280; margin-top: 8px;">O'quv platformasi</p>
            </div>
            <h2 style="color: #1a1a2e; font-size: 18px; margin-bottom: 8px;">Tasdiqlash kodi</h2>
            <p style="color: #374151; margin-bottom: 24px;">
              Siz ${purposeText} uchun so'rov yubordingiz. Quyidagi 6 xonali kodni kiriting:
            </p>
            <div style="background: #f3f4f6; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
              <span style="font-size: 40px; font-weight: bold; letter-spacing: 12px; color: #1a1a2e;">${otp}</span>
            </div>
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 8px;">
              &#9201; Bu kod <strong>10 daqiqa</strong> davomida amal qiladi.
            </p>
            <p style="color: #6b7280; font-size: 14px;">
              Agar siz bu so'rovni yubormagan bo'lsangiz, ushbu xabarni e'tiborsiz qoldiring.
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              &copy; 2025 Ustoz Ta'lim. Barcha huquqlar himoyalangan.
            </p>
          </div>
        `,
      }),
    });

    if (!emailRes.ok) {
      const errBody = await emailRes.text();
      console.error("Resend error:", errBody);
      return new Response(JSON.stringify({ error: "Email yuborishda xatolik. Resend API kalitini tekshiring." }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ success: true, message: "OTP sent" }), {
      headers: corsHeaders,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
