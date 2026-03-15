import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(199,210,254,0.3),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(186,230,253,0.26),_transparent_20%),linear-gradient(180deg,#fafbfc_0%,#f3f5f7_100%)] text-[#142033]">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-[-8rem] top-[-6rem] h-72 w-72 rounded-full bg-[#e8eefc] blur-3xl" />
        <div className="absolute right-[-6rem] top-10 h-64 w-64 rounded-full bg-[#edf6fb] blur-3xl" />
      </div>

      <header className="sticky top-0 z-30 px-4 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1560px] items-center justify-between rounded-[26px] border border-white/90 bg-white/92 px-5 py-3.5 shadow-[0_18px_42px_rgba(15,23,42,0.08)] backdrop-blur">
          <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#0f172a,#334155)] text-sm font-semibold text-white shadow-[0_12px_26px_rgba(15,23,42,0.16)]">
              S
            </div>
            <div className="flex flex-col">
              <p className="text-base font-semibold tracking-tight text-[#101828]">SyncDocs</p>
              <p className="text-xs text-[#98a2b3]">{user ? "Workspace" : "Collaborative documents"}</p>
            </div>
          </Link>

          <div className="hidden items-center gap-2 rounded-full border border-[#eaecf0] bg-[#f8fafc] p-1 lg:flex">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="rounded-full px-4 py-2 text-sm font-semibold text-[#475467] transition hover:bg-white hover:text-[#101828]"
                >
                  Dashboard
                </Link>
                <Link
                  to="/account"
                  className="rounded-full px-4 py-2 text-sm font-semibold text-[#475467] transition hover:bg-white hover:text-[#101828]"
                >
                  Account
                </Link>
              </>
            ) : (
              <>
                <a
                  href="/#features"
                  className="rounded-full px-4 py-2 text-sm font-semibold text-[#475467] transition hover:bg-white hover:text-[#101828]"
                >
                  Features
                </a>
                <a
                  href="/#security"
                  className="rounded-full px-4 py-2 text-sm font-semibold text-[#475467] transition hover:bg-white hover:text-[#101828]"
                >
                  Security
                </a>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="hidden items-center gap-3 rounded-full border border-[#eaecf0] bg-[#f8fafc] px-3 py-1.5 md:flex">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="h-9 w-9 rounded-full border border-[#d0d5dd] object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dbeafe] text-xs font-semibold text-[#274690]">
                      {user.username.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-[#101828]">{user.username}</p>
                    <p className="text-xs text-[#98a2b3]">{isEditorRoute ? "Editing session" : "Signed in"}</p>
                  </div>
                </div>

                <Link
                  to={isEditorRoute ? "/dashboard" : "/account"}
                  className="cursor-pointer rounded-xl bg-[#111827] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(17,24,39,0.14)] transition hover:bg-[#0f172a]"
                >
                  {isEditorRoute ? "Dashboard" : "Account"}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="cursor-pointer rounded-xl border border-[#d0d5dd] bg-white px-4 py-2.5 text-sm font-semibold text-[#344054] transition hover:bg-[#f8fafc]"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="cursor-pointer rounded-xl bg-[#111827] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(17,24,39,0.14)] transition hover:bg-[#0f172a]"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 min-h-[calc(100vh-92px)]">
        <Outlet />
      </main>
    </div>
  );
}
