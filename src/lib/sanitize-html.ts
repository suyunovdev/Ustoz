/**
 * HTML sanitizer — `dangerouslySetInnerHTML` bilan render qilinadigan
 * foydalanuvchi kontentini xavfsizlantiradi (DOMPurify asosida, SSR + client).
 *
 * DOMPurify barcha script teglari, inline event handlerlar hamda
 * javascript:/data:/vbscript: sxemalarini allow-list asosida bloklaydi.
 * Video embed uchun iframe qo'shimcha ravishda ruxsat etiladi,
 * ammo faqat ishonchli hostlardan (YouTube/Vimeo/Cloudflare Stream).
 */
import DOMPurify from 'isomorphic-dompurify';

// Ruxsat etilgan iframe hostlari (video embed)
const ALLOWED_IFRAME_HOSTS =
  /^(?:https?:)?\/\/(?:www\.)?(?:youtube\.com|youtube-nocookie\.com|youtu\.be|player\.vimeo\.com|(?:[a-z0-9-]+\.)?cloudflarestream\.com)\//i;

let hookInstalled = false;
function ensureHook() {
  if (hookInstalled) return;
  // Ruxsatsiz host'dagi iframe'larni butunlay olib tashlaymiz
  DOMPurify.addHook('uponSanitizeElement', (node, data) => {
    if (data.tagName === 'iframe') {
      const el = node as Element;
      const src = el.getAttribute?.('src') || '';
      if (!ALLOWED_IFRAME_HOSTS.test(src)) {
        el.parentNode?.removeChild(el);
      }
    }
  });
  hookInstalled = true;
}

export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';
  ensureHook();
  return DOMPurify.sanitize(html, {
    // Video embed uchun iframe'ga ruxsat (host tekshiruvi hook'da)
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling'],
    // javascript:/data:/vbscript: — DOMPurify default'da bloklanadi; http(s)/mailto/tel/nisbiy ruxsat
    ALLOWED_URI_REGEXP:
      /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  });
}
