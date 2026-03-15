import { Link } from "react-router-dom";

const workflowCards = [
  {
    label: "Workspace",
    title: "One place for owned and shared docs",
    text: "Separate views for owned documents, editor access, and viewer access make navigation feel immediate.",
  },
  {
    label: "Permissions",
    title: "Access that stays understandable",
    text: "Invite collaborators, assign roles, rename documents, and manage participation without leaving the dashboard.",
  },
  {
    label: "Delivery",
    title: "From draft to polished PDF",
    text: "Writers can stay in flow, then export a clean version when the document is ready to share externally.",
  },
];

export default function LandingPage() {
  return (
    <div className="pb-20">
      <section className="mx-auto max-w-[1560px] px-4 py-12 sm:px-6 lg:px-8 lg:py-18">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_540px] lg:items-center">
          <div className="max-w-4xl">
            <span className="inline-flex w-fit rounded-full border border-[#dbe3ee] bg-white px-3 py-1.5 text-sm font-medium text-[#475467] shadow-[0_10px_22px_rgba(15,23,42,0.05)]">
              Real-time collaborative documents
            </span>
            <h1 className="mt-6 max-w-5xl text-5xl font-semibold tracking-[-0.045em] text-[#101828] sm:text-6xl lg:text-7xl">
              Professional documents, collaboration, and control in one workspace.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#667085]">
              SyncDocs combines writing, access control, live collaboration, and PDF export in a focused product
              built for day-to-day team work.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/login"
                className="cursor-pointer rounded-xl bg-[#111827] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0f172a]"
              >
                Open workspace
              </Link>
              <a
                href="#product"
                className="cursor-pointer rounded-xl border border-[#d0d5dd] bg-white px-5 py-3 text-sm font-semibold text-[#344054] transition hover:bg-[#f8fafc]"
              >
                View product
              </a>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <StatCard label="Realtime" value="Editing" />
              <StatCard label="Controlled" value="Sharing" />
              <StatCard label="Ready" value="PDF export" />
            </div>
          </div>

          <div className="relative" id="product">
            <div className="absolute inset-0 rounded-[40px] bg-[linear-gradient(135deg,rgba(148,163,184,0.16),rgba(191,219,254,0.12))] blur-3xl" />
            <div className="relative overflow-hidden rounded-[36px] border border-[#dbe3ee] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 shadow-[0_28px_70px_rgba(15,23,42,0.12)]">
              <div className="rounded-[28px] border border-[#e4e7ec] bg-white">
                <div className="flex items-center justify-between border-b border-[#eef2f6] px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-[#101828]">Product strategy</p>
                    <p className="mt-1 text-xs text-[#98a2b3]">Shared with design, product, and operations</p>
                  </div>
                  <div className="flex -space-x-2">
                    <Avatar label="PS" />
                    <Avatar label="AN" />
                    <Avatar label="MK" />
                    <Avatar label="RT" />
                  </div>
                </div>

                <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_220px]">
                  <div className="rounded-[24px] border border-[#e4e7ec] bg-[#fcfdff] p-5">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-[#eef2f7] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#667085]">
                        Editor
                      </span>
                      <span className="rounded-full bg-[#ecfdf3] px-3 py-1.5 text-[11px] font-semibold text-[#027a48]">
                        Synced
                      </span>
                    </div>

                    <div className="mt-5 space-y-4">
                      <div className="h-3 w-3/4 rounded-full bg-[#111827]" />
                      <div className="h-3 w-full rounded-full bg-[#e9eef5]" />
                      <div className="h-3 w-11/12 rounded-full bg-[#e9eef5]" />
                      <div className="rounded-[22px] border border-[#dbe3ee] bg-white px-4 py-4 shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
                        <p className="text-sm font-medium leading-7 text-[#344054]">
                          Editing, review, and access management stay close to the document instead of being
                          split across tools.
                        </p>
                      </div>
                      <div className="h-3 w-10/12 rounded-full bg-[#e9eef5]" />
                      <div className="h-3 w-8/12 rounded-full bg-[#e9eef5]" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <MiniPanel title="Roles" items={["Owner", "Editors", "Viewers"]} />
                    <MiniPanel title="Capabilities" items={["Realtime presence", "PDF export", "Account controls"]} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-[1560px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#98a2b3]">Why teams use it</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#101828]">
              Built for the work that happens after the first draft.
            </h2>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {workflowCards.map((item) => (
            <WorkflowCard key={item.title} label={item.label} title={item.title} text={item.text} />
          ))}
        </div>
      </section>

      <section id="security" className="mx-auto max-w-[1560px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="rounded-[30px] border border-[#dbe3ee] bg-[linear-gradient(135deg,#0f172a_0%,#1f2937_52%,#334155_100%)] p-7 text-white shadow-[0_22px_52px_rgba(15,23,42,0.18)]">
            <p className="text-sm font-semibold text-white/80">Security</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Access stays controlled as the workspace grows.</h2>
            <p className="mt-4 text-sm leading-7 text-white/84">
              OTP sign-in, refresh-backed sessions, protected routes, and consistent role enforcement help teams
              move quickly without losing structure.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <InfoCard title="OTP login" text="Fast authentication without adding password friction." />
            <InfoCard title="Cookie sessions" text="Sessions stay server-aware and ready for protected routes." />
            <InfoCard title="Role checks" text="Owners, editors, and viewers are enforced consistently across the app." />
            <InfoCard title="Account controls" text="Avatar upload, profile settings, and logout are built into the workspace." />
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
    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[#e7eef9] text-xs font-semibold text-[#334155] shadow-[0_8px_18px_rgba(15,23,42,0.08)]">
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

function WorkflowCard({
  label,
  title,
  text,
}: {
  label: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[28px] border border-[#dde3ec] bg-white p-6 shadow-[0_14px_30px_rgba(15,23,42,0.06)]">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#98a2b3]">{label}</p>
      <p className="mt-4 text-xl font-semibold text-[#101828]">{title}</p>
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
