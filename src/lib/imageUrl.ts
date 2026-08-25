/**
 * Tashqi rasm URL'larini CDN darajasida resize qilish (server yuki YO'Q).
 * Unsplash/Pexels/Pixabay URL param'lari orqali rasmni kichraytiradi:
 * to'liq (~1-3MB) → thumbnail (~20-40KB). Sharp/Next optimizatsiya kerak emas.
 *
 * data:/r2/local URL'lar o'zgarmaydi.
 */
export function optimizeImageUrl(
  url: string | null | undefined,
  width = 500,
  quality = 70,
): string {
  if (!url) return '';
  // Unsplash — ?w=&q=&auto=format&fit=crop (CDN o'zi resize qiladi)
  if (url.includes('images.unsplash.com')) {
    const base = url.split('?')[0];
    return `${base}?w=${width}&q=${quality}&auto=format&fit=crop`;
  }
  // Pexels — ?auto=compress&w=
  if (url.includes('images.pexels.com')) {
    const base = url.split('?')[0];
    return `${base}?auto=compress&cs=tinysrgb&w=${width}`;
  }
  // Pixabay va boshqa CDN'lar param qo'llab-quvvatlamasligi mumkin — o'zgartirmaymiz
  return url;
}
