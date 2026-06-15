import type { Metadata } from 'next';
import GroupCreationInteractive from './components/GroupCreationInteractive';

export const metadata: Metadata = {
  title: 'Guruh yaratish',
  description: 'Yangi guruh yarating, talabalarni qo\'shing va guruh sozlamalarini boshqaring.',
};

export default function GroupCreationPage() {
  return <GroupCreationInteractive />;
}