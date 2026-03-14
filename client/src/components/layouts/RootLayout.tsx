import { Outlet, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function RootLayout() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen text-stone-900">
      <div className="pointer-events-none fixed inset-x-0 top-0 z-0 h-72 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.18),_transparent_45%)]" />

      <header className="sticky top-0 z-30 px-4 pt-4 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/70 bg-white/75 px-5 py-3 shadow-[0_12px_40px_rgba(28,25,23,0.08)] backdrop-blur-xl">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-stone-900 text-sm font-semibold text-white">
              S
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-900">
                SyncDocs
              </p>
              <p className="text-xs text-stone-500">
                Real-time writing workspace
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            <a href="/#features" className="text-sm text-stone-600 transition hover:text-orange-600">
              Features
            </a>
            <a href="/#workspace" className="text-sm text-stone-600 transition hover:text-orange-600">
              Workspace
            </a>
            <a href="/#security" className="text-sm text-stone-600 transition hover:text-orange-600">
              Security
            </a>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to="/dashboard"
                className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-600"
              >
                Open dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden rounded-full px-4 py-2 text-sm font-medium text-stone-600 transition hover:text-orange-600 sm:inline-flex"
                >
                  Sign in
                </Link>
                <Link
                  to="/login"
                  className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-600"
                >
                  Start writing
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <Outlet />
      </main>
    </div>
  );
}
