'use client';

import dynamic from 'next/dynamic';

const AdminShell = dynamic(() => import('./AdminShell'), {
  ssr: false,
  loading: () => (
    <div className="admin-shell admin-center">
      <p className="admin-muted">Chargement du panel…</p>
    </div>
  ),
});

export default function AdminShellLoader({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
