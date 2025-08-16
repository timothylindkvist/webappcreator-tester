import { ReactNode } from "react";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-xl bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-rose-500" />
            <span className="text-sm font-semibold text-white/90">YourBrand</span>
          </div>
          <nav className="flex items-center gap-3 text-xs text-white/70">
            <a href="/editor" className="hover:text-white">Editor</a>
            <a href="https://github.com/your-org/your-site" className="hover:text-white">GitHub</a>
            <a href="#" className="rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 px-3 py-1.5 font-semibold">Get started</a>
          </nav>
        </div>
      </header>
      {children}
      <footer className="border-t border-white/10 bg-black/40 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-10 text-white/60 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-xl bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-rose-500" />
            <span className="text-sm">© {new Date().getFullYear()} YourBrand</span>
          </div>
          <nav className="flex gap-4 text-xs">
            <a href="#">Privacy</a><a href="#">Terms</a><a href="#">Status</a>
          </nav>
        </div>
      </footer>
    </>
  );
}
