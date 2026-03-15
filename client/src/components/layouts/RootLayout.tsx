import { Link, Outlet, useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { logoutCurrentUser } from "../../api/auth.api";
import { useAuth } from "../../context/AuthContext";

export default function RootLayout() {
  const { user, clearSession } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isEditorRoute = location.pathname.startsWith("/documents/");

  const handleLogout = async () => {
    try {
      await logoutCurrentUser();
    } finally {
      clearSession();
      navigate("/", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(33,102,172,0.06),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#f3f5f8_100%)] text-[#142033]">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-x-0 top-0 h-64 bg-[linear-gradient(180deg,rgba(255,255,255,0.65),transparent)]" />
      </div>

      <header className="sticky top-0 z-30 px-4 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1540px] items-center justify-between rounded-[22px] border border-white/70 bg-white/85 px-5 py-3 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur">
          <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#111827,#274690)] text-sm font-semibold text-white shadow-[0_10px_24px_rgba(39,70,144,0.24)]">
              S
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.08em] text-[#101828]">SyncDocs</p>
              <p className="text-xs text-[#667085]">{isEditorRoute ? "Document editor" : "Collaborative workspace"}</p>
            </div>
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            {user ? (
              <>
                <Link to="/dashboard" className="text-sm font-medium text-[#475467] transition hover:text-[#101828]">
                  Dashboard
                </Link>
                <Link to="/account" className="text-sm font-medium text-[#475467] transition hover:text-[#101828]">
                  Account
                </Link>
              </>
            ) : (
              <>
                <a href="/#features" className="text-sm font-medium text-[#475467] transition hover:text-[#101828]">
                  Features
                </a>
                <a href="/#security" className="text-sm font-medium text-[#475467] transition hover:text-[#101828]">
                  Security
                </a>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="hidden items-center gap-3 rounded-full bg-[#f8fafc] px-3 py-1.5 sm:flex">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="h-8 w-8 rounded-full border border-[#d0d5dd] object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e2e8f0] text-xs font-semibold text-[#334155]">
                      {user.username.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-medium text-[#344054]">{user.username}</span>
                </div>
                <Link
                  to={isEditorRoute ? "/dashboard" : "/account"}
                  className="rounded-xl bg-[#111827]  px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f172a]"
                >
                  {isEditorRoute ? "Back to dashboard" : "Manage account"}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl border border-[#d0d5dd] bg-white px-4 py-2.5 text-sm font-semibold text-[#344054] transition hover:bg-[#f8fafc]"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="rounded-xl bg-[#111827] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f172a]"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 min-h-[calc(100vh-88px)]">
        <Outlet />
      </main>
    </div>
  );
}
