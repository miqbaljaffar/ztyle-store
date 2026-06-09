import Sidenav from '@/app/(admin)/dashboard/ui/sidenav';
import AuthGuard from './AuthGuard';

export const metadata = {
  title: 'Dashboard | Ztyle',
  description: 'Halaman manajemen untuk admin Ztyle.',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col md:flex-row md:overflow-hidden">
      <div className="w-full flex-none md:w-64">
        <Sidenav />
      </div>
      <div className="flex-grow p-6 md:overflow-y-auto md:p-12">
        <AuthGuard>
          {children}
        </AuthGuard>
      </div>
    </div>
  );
}