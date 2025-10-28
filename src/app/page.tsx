<<<<<<< HEAD
import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/dashboard');
=======
import { LandingPage } from '@/components/landing/landing-page';

export default function HomePage() {
  return <LandingPage />;
>>>>>>> e44bf98596d92b6b3c1b8951c87c6f3503a8c047
}
