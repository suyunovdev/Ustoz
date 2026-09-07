/**
 * Markdown → xavfsiz HTML.
 *
 * Dars kontenti va AI javoblari markdown formatida saqlanadi (# sarlavha, **qalin**,
 * ro'yxatlar). Ilgari ular xom HTML sifatida render qilinardi → foydalanuvchi `#` va `**`
 * belgilarni ko'rardi. Endi marked bilan HTML'ga aylantiriladi va DOMPurify bilan
 * tozalanadi (XSS himoyasi). Agar kontent allaqachon HTML bo'lsa — o'sha holida tozalanadi.
 */
import { marked } from 'marked';
import { sanitizeHtml } from '@/lib/sanitize-html';

marked.setOptions({ gfm: true, breaks: true });

const HTML_HINT = /<(p|h[1-6]|ul|ol|li|div|br|strong|em|a|img|blockquote|pre|code|table)\b/i;

export function renderMarkdown(input: string | null | undefined): string {
  if (!input) return '';
  // Allaqachon HTML bo'lsa marked'siz tozalaymiz (WYSIWYG kontenti buzilmasin).
  const html = HTML_HINT.test(input) ? input : (marked.parse(input) as string);
  return sanitizeHtml(html);
}
