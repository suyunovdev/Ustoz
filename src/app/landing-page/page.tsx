import { redirect } from 'next/navigation';

// Landing page endi ROOT (/) da. Bu eski URL kanonik `/` ga yo'naltiradi
// (bookmark/tashqi havolalar ishlashi + SEO kanonizatsiya uchun).
export default function LandingPageRedirect() {
  redirect('/');
}
