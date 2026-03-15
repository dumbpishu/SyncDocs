import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="pb-20">
      <section className="mx-auto grid max-w-[1560px] gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_500px] lg:px-8 lg:py-24">
        <div className="flex flex-col justify-center">
          <span className="inline-flex w-fit rounded-full border border-[#dbe3ee] bg-white px-3 py-1 text-sm font-medium text-[#475467] shadow-[0_10px_22px_rgba(15,23,42,0.05)]">
            Real-time collaboration
          </span>
          <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-[-0.04em] text-[#101828] sm:text-6xl lg:text-7xl">
            Documents built for focused teams and faster decisions.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#667085]">
            SyncDocs combines live editing, sharing controls, PDF export, secure sign-in, and account management in a polished collaborative workspace.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/login"
              className="rounded-xl bg-[#111827] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0f172a]"
            >
              Open workspace
            </Link>
            <a
              href="#features"
              className="rounded-xl border border-[#d0d5dd] bg-white px-5 py-3 text-sm font-semibold text-[#344054] transition hover:bg-[#f8fafc]"
            >
              Explore features
            </a>
          </div>

          <div className="mt-10 grid max-w-2xl gap-4 sm:grid-cols-3">
            <StatCard label="Editing" value="Realtime" />
            <StatCard label="Access" value="Role-based" />
            <StatCard label="Export" value="PDF ready" />
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 rounded-[36px] bg-[linear-gradient(135deg,rgba(39,70,144,0.12),rgba(14,165,233,0.08))] blur-3xl" />
          <div className="relative rounded-[36px] border border-[#dbe3ee] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 shadow-[0_28px_70px_rgba(15,23,42,0.14)]">
            <div className="rounded-[28px] border border-[#e4e7ec] bg-white p-5">
              <div className="flex items-center justify-between border-b border-[#eef2f7] pb-4">
                <div>
                  <p className="text-sm font-semibold text-[#101828]">Quarterly planning</p>
                  <p className="text-xs text-[#98a2b3]">Owner: Product</p>
                </div>
                <div className="flex -space-x-2">
                  <Avatar label="AD" />
                  <Avatar label="MK" />
                  <Avatar label="RP" />
                </div>
              </div>

              <div className="grid gap-4 pt-5 lg:grid-cols-[minmax(0,1fr)_200px]">
                <div className="rounded-[22px] border border-[#e4e7ec] bg-[#fcfdff] p-5">
                  <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#98a2b3]">
                    Editor
                  </div>
                  <div className="space-y-3">
                    <div className="h-3 w-3/4 rounded-full bg-[#111827]" />
                    <div className="h-3 w-full rounded-full bg-[#e9eef5]" />
                    <div className="h-3 w-11/12 rounded-full bg-[#e9eef5]" />
                    <div className="rounded-2xl border border-[#dbe3ee] bg-white px-4 py-4 shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
                      <p className="text-sm font-medium leading-7 text-[#344054]">
                        Comments, sharing, and access controls stay close to the document.
                      </p>
                    </div>
                    <div className="h-3 w-10/12 rounded-full bg-[#e9eef5]" />
                    <div className="h-3 w-8/12 rounded-full bg-[#e9eef5]" />
                  </div>
                </div>

                <div className="space-y-4">
                  <MiniPanel title="Access" items={["Owner", "Editors", "Viewers"]} />
                  <MiniPanel title="Workspace" items={["Realtime sync", "PDF export", "Account settings"]} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-[1560px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#98a2b3]">Features</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#101828]">
              Everything needed for collaborative document work.
            </h2>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <FeatureCard
            title="Collaborative editing"
            text="Edit documents together with live updates, presence, and server-enforced access rules."
          />
          <FeatureCard
            title="Document management"
            text="Create, rename, organize, share, and manage owned or shared documents from one dashboard."
          />
          <FeatureCard
            title="Professional workflow"
            text="Upload avatars, manage your account, and export polished documents to PDF."
          />
        </div>
      </section>

      <section id="security" className="mx-auto max-w-[1560px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="rounded-[30px] border border-[#dbe3ee] bg-[linear-gradient(135deg,#111827_0%,#1d3557_52%,#274690_100%)] p-7 text-white shadow-[0_22px_52px_rgba(17,24,39,0.20)]">
            <p className="text-sm font-semibold text-white/80">Security</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Built around controlled access.</h2>
            <p className="mt-4 text-sm leading-7 text-white/84">
              OTP sign-in, refresh-based sessions, protected routes, and role checks keep the workspace reliable without adding friction.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <InfoCard title="OTP login" text="Fast sign-in without passwords." />
            <InfoCard title="Cookie sessions" text="Auth stays server-backed and secure." />
            <InfoCard title="Role checks" text="Owners, editors, and viewers are enforced consistently." />
            <InfoCard title="Account controls" text="Avatar upload, logout, and profile settings are built in." />
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#dbe3ee] bg-white px-4 py-4 shadow-[0_12px_26px_rgba(15,23,42,0.05)]">
      <p className="text-xl font-semibold text-[#101828]">{value}</p>
      <p className="mt-1 text-sm text-[#667085]">{label}</p>
    </div>
  );
}

function Avatar({ label }: { label: string }) {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[#dbeafe] text-xs font-semibold text-[#274690] shadow-[0_8px_18px_rgba(39,70,144,0.12)]">
      {label}
    </div>
  );
}

function MiniPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-[22px] border border-[#e4e7ec] bg-[#fcfdff] p-4">
      <p className="text-sm font-semibold text-[#101828]">{title}</p>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={item} className="rounded-xl bg-white px-3 py-2 text-sm text-[#475467] shadow-[0_6px_16px_rgba(15,23,42,0.03)]">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function FeatureCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[28px] border border-[#dde3ec] bg-white p-6 shadow-[0_14px_30px_rgba(15,23,42,0.06)]">
      <div className="mb-5 h-12 w-12 rounded-2xl bg-[linear-gradient(135deg,#e0ecff,#edf4ff)]" />
      <p className="text-xl font-semibold text-[#101828]">{title}</p>
      <p className="mt-3 text-sm leading-7 text-[#667085]">{text}</p>
    </div>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[26px] border border-[#dde3ec] bg-white p-6 shadow-[0_12px_26px_rgba(15,23,42,0.05)]">
      <p className="text-lg font-semibold text-[#101828]">{title}</p>
      <p className="mt-3 text-sm leading-7 text-[#667085]">{text}</p>
    </div>
  );
}
