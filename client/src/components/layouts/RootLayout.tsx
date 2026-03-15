import { Outlet, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function RootLayout() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#191919]">
      <div className="pointer-events-none fixed inset-x-0 top-0 z-0 h-32 bg-[linear-gradient(180deg,rgba(255,255,255,0.65),transparent)]" />

      <header className="sticky top-0 z-30 px-4 pt-4 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between rounded-2xl border border-black/8 bg-[#fbfbfa]/95 px-5 py-3 shadow-[0_1px_2px_rgba(15,15,15,0.04)] backdrop-blur animate-[slideDown_500ms_ease-out]">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/8 bg-white text-sm font-semibold text-[#191919]">
              S
            </div>
            <div>
              <p className="text-sm font-semibold text-[#191919]">
                SyncDocs
              </p>
              <p className="text-xs text-[#6b6b6b]">
                Real-time writing workspace
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            <a href="/#features" className="text-sm text-[#6b6b6b] transition hover:text-[#191919]">
              Features
            </a>
            <a href="/#workspace" className="text-sm text-[#6b6b6b] transition hover:text-[#191919]">
              Workspace
            </a>
            <a href="/#security" className="text-sm text-[#6b6b6b] transition hover:text-[#191919]">
              Security
            </a>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to="/dashboard"
                className="rounded-xl bg-[#191919] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#2f2f2f]"
              >
                Open dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden rounded-xl px-4 py-2 text-sm font-medium text-[#6b6b6b] transition hover:text-[#191919] sm:inline-flex"
                >
                  Sign in
                </Link>
                <Link
                  to="/login"
                  className="rounded-xl bg-[#191919] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#2f2f2f]"
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
