import type { Metadata } from 'next';
import AdminShellLoader from '../../components/admin/AdminShellLoader';

export const metadata: Metadata = {
  title: 'Admin',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShellLoader>{children}</AdminShellLoader>;
}
