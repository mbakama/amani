'use client';

import { usePathname } from 'next/navigation';
import TopNav from './TopNav';
import BottomNav from './BottomNav';

/** Chrome public uniquement — utilise via app/(site)/layout.tsx */
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const isHome = pathname === '/';

  return (
    <>
      <TopNav />
      <div
        className={`min-h-screen w-full max-w-[100vw] pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-10 ${
          isHome ? '' : 'md:pt-[4.25rem]'
        }`}
      >
        {children}
      </div>
      <BottomNav />
    </>
  );
}
