import Link from 'next/link';
import type { ReactNode } from 'react';

export default function HomeSection({
  title,
  eyebrow,
  subtitle,
  action,
  id,
  children,
}: {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  action?: { href: string; label: string };
  id?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="home-reveal mx-auto w-full max-w-[1100px] px-4 py-8 sm:px-5 sm:py-10 md:px-8 md:py-12"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 pr-2">
          {eyebrow && (
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--amani-forest)] sm:text-[11px]">
              {eyebrow}
            </p>
          )}
          <h2 className="font-display text-[1.2rem] font-semibold leading-tight tracking-tight text-[var(--amani-ink)] sm:text-2xl md:text-[1.75rem]">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-[12px] leading-snug text-[rgba(20,32,28,0.55)] sm:text-sm">
              {subtitle}
            </p>
          )}
        </div>
        {action && (
          <Link
            href={action.href}
            className="mt-0.5 flex-shrink-0 whitespace-nowrap text-[12px] font-medium text-[var(--amani-forest)] transition hover:text-[#163d30] sm:mt-1 sm:text-sm"
          >
            {action.label}
          </Link>
        )}
      </div>
      <div className="mt-5 md:mt-7">{children}</div>
    </section>
  );
}
