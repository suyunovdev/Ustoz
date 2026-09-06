/**
 * Bildirishnoma email shabloni — UstozEdu brend (ko'k gradient sarlavha, "U" so'z belgisi).
 * createNotification({ email: true }) chaqirilganda ishlatiladi.
 */

const BLUE = '#1F5EDC';
const NAVY = '#0F2447';
const SUN = '#FFB930';
const MUTE = '#5F6B80';
const LINE = '#D9E0EC';

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://ustozedu.uz'
  ).replace(/\/$/, '');
}

export function renderNotificationEmail(input: {
  title: string;
  message: string;
  name?: string | null;
  ctaUrl?: string;
}): string {
  const site = siteUrl();
  const cta = input.ctaUrl || `${site}/notifications`;
  return `<div style="font-family:'Nunito Sans',Arial,Helvetica,sans-serif;background:#F6F8FC;padding:24px;margin:0">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid ${LINE}">
    <div style="background:linear-gradient(135deg,${BLUE},#1548B3);padding:20px 24px">
      <span style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:.3px">Ustoz<span style="color:${SUN}">Edu</span></span>
    </div>
    <div style="padding:24px">
      ${input.name ? `<p style="color:${NAVY};margin:0 0 10px;font-size:14px">Assalomu alaykum, ${input.name}!</p>` : ''}
      <h1 style="color:${NAVY};font-size:18px;margin:0 0 8px;font-weight:700">${input.title}</h1>
      <p style="color:${MUTE};font-size:15px;line-height:1.6;margin:0 0 22px">${input.message}</p>
      <a href="${cta}" style="display:inline-block;background:${BLUE};color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:12px;font-weight:600;font-size:14px">Saytga o'tish</a>
    </div>
    <div style="padding:16px 24px;border-top:1px solid ${LINE}">
      <p style="color:#9aa8bf;font-size:12px;margin:0">UstozEdu — onlayn ta'lim platformasi · <a href="${site}" style="color:${BLUE};text-decoration:none">ustozedu.uz</a></p>
    </div>
  </div>
</div>`;
}
