import { useAuth } from "../context/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="px-6 py-10">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.72fr_0.28fr]">
        <section className="rounded-[2rem] border border-white/70 bg-white/85 p-8 shadow-[0_25px_80px_rgba(28,25,23,0.08)] backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-orange-600">
                Workspace
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-900">
                Welcome back{user?.username ? `, ${user.username}` : ""}.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-600">
                This is your starting point for documents, collaboration, and account-aware actions.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 px-5 py-4 text-sm text-stone-600">
              Signed in as
              <div className="mt-1 font-medium text-stone-900">{user?.email ?? "unknown user"}</div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <OverviewCard value="Documents" label="Your files and shared work will appear here." tone="dark" />
            <OverviewCard value="Collaboration" label="Presence, comments, and activity can plug in next." tone="light" />
            <OverviewCard value="Auth" label="Session recovery is active through refresh tokens." tone="light" />
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-[0_25px_80px_rgba(28,25,23,0.06)] backdrop-blur">
            <p className="text-sm uppercase tracking-[0.28em] text-orange-600">Quick actions</p>
            <div className="mt-5 grid gap-3">
              <button className="rounded-2xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600">
                Create document
              </button>
              <button className="rounded-2xl border border-stone-300 bg-stone-50 px-5 py-3 text-sm font-semibold text-stone-700 transition hover:border-orange-400 hover:text-orange-700">
                Invite collaborator
              </button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-stone-200 bg-stone-50 p-6">
            <p className="text-sm uppercase tracking-[0.28em] text-orange-600">Account</p>
            <div className="mt-4 space-y-3">
              <InlineNote title="Email" text={user?.email ?? "Not available"} />
              <InlineNote title="Username" text={user?.username ?? "Not available"} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function OverviewCard({
  value,
  label,
  tone,
}: {
  value: string;
  label: string;
  tone: "dark" | "light";
}) {
  const toneClass =
    tone === "dark"
      ? "border-stone-900 bg-stone-900 text-white"
      : "border-stone-200 bg-stone-50 text-stone-900";

  return (
    <div className={`rounded-[1.5rem] border p-5 ${toneClass}`}>
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
      <p className={`mt-2 text-sm leading-6 ${tone === "dark" ? "text-stone-300" : "text-stone-500"}`}>{label}</p>
    </div>
  );
}

function InlineNote({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3">
      <p className="text-sm font-semibold text-stone-900">{title}</p>
      <p className="mt-1 text-sm leading-6 text-stone-600">{text}</p>
    </div>
  );
}
