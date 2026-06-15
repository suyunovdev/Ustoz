import type { Metadata } from 'next';
import ContentUploadInteractive from './components/ContentUploadInteractive';

export const metadata: Metadata = {
  title: 'Kontent yuklash',
  description: 'Dars materiallarini yuklang, watermark himoyasini qo\'llang va tashqi havolalarni integratsiya qiling. O\'qituvchilar uchun kontent boshqaruv markazi.',
};

export default function ContentUploadCenterPage() {
  return <ContentUploadInteractive />;
}