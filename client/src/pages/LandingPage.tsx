import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="pb-16">
      <section className="mx-auto grid max-w-7xl gap-10 px-6 pb-10 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-10 lg:pt-20">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-2 text-sm text-orange-700 shadow-sm backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            Real-time collaboration
          </div>

          <h1 className="mt-8 max-w-4xl text-5xl font-semibold tracking-[-0.04em] text-stone-950 sm:text-6xl lg:text-7xl">
            Write together without losing flow.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600">
            SyncDocs is a shared document workspace for drafting, editing, and reviewing with your team in real time.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              to="/login"
              className="rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
            >
              Start writing now
            </Link>
            <a
              href="#features"
              className="rounded-full border border-stone-300 bg-white/75 px-6 py-3 text-sm font-semibold text-stone-700 transition hover:border-orange-400 hover:text-orange-700"
            >
              Explore the product
            </a>
          </div>

          <div className="mt-10 grid max-w-xl grid-cols-3 gap-4">
            <Stat label="Editing" value="Live" />
            <Stat label="Auth" value="OTP" />
            <Stat label="Session" value="Refresh" />
          </div>
        </div>

        <div id="workspace" className="relative">
          <div className="absolute -left-8 top-10 h-32 w-32 rounded-full bg-orange-200/60 blur-3xl" />
          <div className="absolute -right-6 bottom-0 h-40 w-40 rounded-full bg-amber-100 blur-3xl" />

          <div className="relative rounded-[2rem] border border-white/70 bg-white/85 p-4 shadow-[0_25px_80px_rgba(28,25,23,0.12)] backdrop-blur">
            <div className="rounded-[1.6rem] border border-stone-200 bg-stone-50 p-4">
              <div className="flex items-center justify-between rounded-[1.3rem] border border-stone-200 bg-white px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-stone-900">Team Planning Doc</p>
                  <p className="text-xs text-stone-500">3 people active</p>
                </div>
                <div className="flex -space-x-2">
                  <Avatar label="AJ" />
                  <Avatar label="RK" />
                  <Avatar label="PM" />
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[0.62fr_0.38fr]">
                <div className="rounded-[1.5rem] border border-stone-200 bg-white p-5">
                  <div className="mb-5 flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-stone-400">
                    Editor
                  </div>
                  <div className="space-y-4">
                    <div className="h-3 w-4/5 rounded-full bg-stone-900/90" />
                    <div className="h-3 w-full rounded-full bg-stone-200" />
                    <div className="h-3 w-11/12 rounded-full bg-stone-200" />
                    <div className="h-3 w-2/3 rounded-full bg-orange-200" />
                    <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
                      <p className="text-sm font-medium text-orange-900">Someone is editing this section right now.</p>
                      <p className="mt-1 text-sm text-orange-700">Presence and syncing help everyone stay aligned.</p>
                    </div>
                    <div className="h-3 w-full rounded-full bg-stone-200" />
                    <div className="h-3 w-9/12 rounded-full bg-stone-200" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[1.5rem] border border-stone-200 bg-stone-950 p-5 text-stone-100">
                    <p className="text-xs uppercase tracking-[0.28em] text-orange-300">Workspace</p>
                    <div className="mt-4 space-y-3">
                      <Signal title="Presence" detail="See who is active in the document." />
                      <Signal title="Comments" detail="Keep feedback attached to the work." />
                      <Signal title="Sync" detail="Changes show up as they happen." />
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-stone-200 bg-white p-5">
                    <p className="text-xs uppercase tracking-[0.28em] text-stone-400">Authentication</p>
                    <div className="mt-4 space-y-3">
                      <MiniCard value="OTP login" label="Passwordless sign-in" />
                      <MiniCard value="Refresh token" label="Session recovery" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <div className="mb-10 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-600">
            Features
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight text-stone-950">
            The essentials for a collaborative writing experience.
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Feature
            title="Real-time editing"
            desc="Work in the same document with live updates, presence cues, and fewer collisions."
          />
          <Feature
            title="Focused collaboration"
            desc="Comments, ownership signals, and shared context keep review cycles moving."
          />
          <Feature
            title="Modern auth foundation"
            desc="Email OTP plus refresh-token session recovery keeps sign-in simple without feeling fragile."
          />
        </div>
      </section>

      <section id="security" className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-stone-200 bg-stone-950 p-8 text-stone-100 shadow-[0_18px_60px_rgba(28,25,23,0.14)]">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-300">
              Security
            </p>
            <h3 className="mt-4 text-3xl font-semibold">
              Simple sign-in with reliable session handling.
            </h3>
            <p className="mt-4 max-w-lg text-sm leading-7 text-stone-300">
              Short-lived access tokens and refresh-token based recovery keep the auth flow simple on the surface and dependable underneath.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <SecurityCard title="OTP sign-in" text="Fast onboarding for collaborators joining from email invites or direct links." />
            <SecurityCard title="Cookie sessions" text="Tokens stay out of local storage and ride along securely with API requests." />
            <SecurityCard title="Auto refresh" text="Expired access tokens recover silently so the workspace stays uninterrupted." />
            <SecurityCard title="Protected routes" text="Dashboard and future editor routes can depend on a consistent auth state." />
          </div>
        </div>
      </section>
    </div>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-[1.75rem] border border-white/70 bg-white/85 p-7 shadow-[0_18px_50px_rgba(28,25,23,0.06)] backdrop-blur transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(28,25,23,0.1)]">
      <div className="mb-5 h-12 w-12 rounded-2xl bg-orange-100 shadow-inner shadow-white/60" />
      <h3 className="text-xl font-semibold text-stone-900">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-7 text-stone-600">
        {desc}
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/70 bg-white/80 px-4 py-5 shadow-sm backdrop-blur">
      <p className="text-2xl font-semibold tracking-tight text-stone-950">{value}</p>
      <p className="mt-1 text-sm text-stone-500">{label}</p>
    </div>
  );
}

function Avatar({ label }: { label: string }) {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-orange-100 text-xs font-semibold text-orange-700">
      {label}
    </div>
  );
}

function Signal({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-sm font-medium text-white">{title}</p>
      <p className="mt-1 text-sm text-stone-300">{detail}</p>
    </div>
  );
}

function MiniCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
      <p className="text-base font-semibold text-stone-950">{value}</p>
      <p className="mt-1 text-sm text-stone-500">{label}</p>
    </div>
  );
}

function SecurityCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[1.75rem] border border-stone-200 bg-white/80 p-6 shadow-[0_18px_50px_rgba(28,25,23,0.05)] backdrop-blur">
      <p className="text-lg font-semibold text-stone-900">{title}</p>
      <p className="mt-3 text-sm leading-7 text-stone-600">{text}</p>
    </div>
  );
}
