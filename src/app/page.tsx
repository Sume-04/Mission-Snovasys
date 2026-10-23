import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Navigation */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link href="/" className="text-2xl font-bold tracking-tight">
          Trust<span className="text-cyan-400">Vault</span>
        </Link>

        <Link
          href="/login"
          className="rounded-full border border-slate-700 px-5 py-2 text-sm font-medium transition hover:border-cyan-400 hover:text-cyan-400"
        >
          Sign In
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="mx-auto flex min-h-[80vh] max-w-7xl flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mb-6 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300">
          Your documents. Your control.
        </div>

        <h1 className="max-w-4xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
          A safer place for
          <span className="block text-cyan-400">
            everything important.
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">
          TrustVault helps you keep your important documents organized and
          protected. Access your personal vault whenever you need it.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/login"
            className="rounded-full bg-cyan-400 px-8 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Get Started
          </Link>

          <Link
            href="/account"
            className="rounded-full border border-slate-700 px-8 py-3 font-semibold transition hover:border-cyan-400 hover:text-cyan-400"
          >
            Open My Vault
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="mt-20 grid w-full max-w-4xl gap-5 text-left sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="mb-4 text-3xl">🔐</div>
            <h2 className="text-lg font-semibold">Private by Design</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Access your documents through your authenticated account.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="mb-4 text-3xl">📁</div>
            <h2 className="text-lg font-semibold">Stay Organized</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Keep your important files together in one convenient place.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="mb-4 text-3xl">🛡️</div>
            <h2 className="text-lg font-semibold">Built with Security</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Designed with authentication and access controls in mind.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-6 py-6 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} TrustVault. Your documents, your control.
      </footer>
    </main>
  );
}