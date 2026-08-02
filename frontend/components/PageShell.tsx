// Constrains inner pages to the original mobile-first width.
// Home is full-bleed and does not use this wrapper.
export default function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col md:max-w-3xl lg:max-w-5xl">
      {children}
    </div>
  );
}
